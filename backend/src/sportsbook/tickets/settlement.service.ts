import { Types } from 'mongoose';
import { rejectOrVoidSportsTicket, settleSportsTicketLedger } from '../../ledger/sportsLedger.service';
import { sportsbookRouter } from '../SportsbookRouter';
import { SportsProviderState } from '../models/SportsProviderState';
import { SportsTicket } from '../models/SportsTicket';
import { SportsSettlementUpdate } from '../providers/SportsbookProvider';
import { SportsSettlementReceipt } from '../models/SportsSettlementReceipt';
import { createHash } from 'node:crypto';

const decimal = (value: bigint) => Types.Decimal128.fromString(value.toString());
const settlementHash = (update: SportsSettlementUpdate) => createHash('sha256').update(JSON.stringify({ providerTicketId: update.providerTicketId, payoutMinor: update.payoutMinor?.toString(), legs: [...update.legs].sort((a, b) => a.selectionId.localeCompare(b.selectionId)) })).digest('hex');

const calculatePayout = (ticket: any): bigint => {
  if (ticket.legs.some((leg: any) => leg.result === 'LOSS')) return 0n;
  if (ticket.product === 'BET_BUILDER' && ticket.legs.every((leg: any) => leg.result === 'WIN')) {
    if (!ticket.acceptedCombinedOddsMillionths) throw new Error('Bet Builder is missing provider combined odds');
    return BigInt(ticket.stakeMinor.toString()) * BigInt(ticket.acceptedCombinedOddsMillionths.toString()) / 1_000_000n;
  }
  let combined = 1_000_000n;
  for (const leg of ticket.legs) if (leg.result === 'WIN') combined = combined * BigInt(leg.acceptedOddsMillionths.toString()) / 1_000_000n;
  return BigInt(ticket.stakeMinor.toString()) * combined / 1_000_000n;
};

export const completePendingSportsSettlement = async (ticketId: string) => {
  const ticket = await SportsTicket.findOne({ ticketId });
  if (!ticket || ticket.status !== 'SETTLEMENT_PENDING') return ticket;
  const allVoid = ticket.legs.every((leg: any) => leg.result === 'VOID');
  if (allVoid) await rejectOrVoidSportsTicket(ticket.ticketId);
  else await settleSportsTicketLedger(ticket.ticketId, BigInt(ticket.payoutMinor!.toString()));
  return SportsTicket.findOneAndUpdate(
    { _id: ticket._id, status: 'SETTLEMENT_PENDING' },
    { $set: { status: allVoid ? 'VOIDED' : 'SETTLED', settledAt: new Date() } }, { returnDocument: 'after' }
  );
};

export const applySportsSettlement = async (update: SportsSettlementUpdate) => {
  const hash = settlementHash(update);
  let receipt = await SportsSettlementReceipt.findOne({ providerSettlementId: update.providerSettlementId });
  if (receipt && (receipt.providerTicketId !== update.providerTicketId || receipt.payloadHash !== hash)) throw new Error('Provider reused settlement ID with a different payload');
  if (!receipt) {
    try { receipt = await SportsSettlementReceipt.create({ providerSettlementId: update.providerSettlementId, providerTicketId: update.providerTicketId, payloadHash: hash }); }
    catch (error: any) {
      if (error?.code !== 11000) throw error;
      receipt = await SportsSettlementReceipt.findOne({ providerSettlementId: update.providerSettlementId });
      if (!receipt || receipt.providerTicketId !== update.providerTicketId || receipt.payloadHash !== hash) throw new Error('Provider reused settlement ID with a different payload');
    }
  }
  let ticket = await SportsTicket.findOne({ providerTicketId: update.providerTicketId });
  if (!ticket) throw new Error('Settlement references unknown provider ticket');
  if (ticket.providerSettlementIds.includes(update.providerSettlementId)) {
    const completed = await completePendingSportsSettlement(ticket.ticketId);
    await SportsSettlementReceipt.updateOne({ _id: receipt._id }, { $set: { status: 'APPLIED', appliedAt: new Date() } });
    return completed;
  }
  if (ticket.status === 'CASHOUT_PENDING') throw new Error('Settlement deferred while cashout acceptance is pending');
  if (ticket.status === 'CASHED_OUT') {
    await SportsSettlementReceipt.updateOne({ _id: receipt._id }, { $set: { status: 'APPLIED', appliedAt: new Date() } });
    return ticket;
  }
  if (!['ACCEPTED', 'SETTLEMENT_PENDING'].includes(ticket.status)) return ticket;
  for (const result of update.legs) {
    const leg: any = ticket.legs.find((value: any) => value.selectionId === result.selectionId);
    if (!leg) throw new Error('Settlement references unknown ticket leg');
    if (leg.result !== 'OPEN' && leg.result !== result.result) throw new Error('Provider changed a terminal leg result');
    leg.result = result.result;
  }
  ticket.providerSettlementIds.push(update.providerSettlementId);
  const terminal = ticket.legs.every((leg: any) => leg.result !== 'OPEN');
  if (!terminal) { await ticket.save(); await SportsSettlementReceipt.updateOne({ _id: receipt._id }, { $set: { status: 'APPLIED', appliedAt: new Date() } }); return ticket; }
  const payout = ticket.product === 'BET_BUILDER'
    ? (() => { if (update.payoutMinor === undefined) throw new Error('Bet Builder terminal settlement requires provider payout'); return update.payoutMinor; })()
    : calculatePayout(ticket);
  if (payout > BigInt(ticket.maxPayoutMinor.toString())) throw new Error('Settlement payout exceeds accepted maximum');
  ticket.payoutMinor = decimal(payout);
  ticket.status = 'SETTLEMENT_PENDING';
  await ticket.save();
  const completed = await completePendingSportsSettlement(ticket.ticketId);
  await SportsSettlementReceipt.updateOne({ _id: receipt._id }, { $set: { status: 'APPLIED', appliedAt: new Date() } });
  return completed;
};

export const pollSportsSettlements = async () => {
  const provider = sportsbookRouter.selected();
  const state = await SportsProviderState.findOne({ provider: provider.name });
  const batch = await sportsbookRouter.execute(current => current.getSettlementUpdates(state?.feedCursor || undefined));
  for (const update of batch.updates) await applySportsSettlement(update);
  await SportsProviderState.updateOne({ provider: provider.name }, { $set: { feedCursor: batch.cursor, lastSuccessAt: new Date() } }, { upsert: true });
  const pending = await SportsTicket.find({ status: 'SETTLEMENT_PENDING' }).limit(500);
  for (const ticket of pending) await completePendingSportsSettlement(ticket.ticketId);
  return batch.updates.length;
};
