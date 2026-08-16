import { createHash } from 'node:crypto';
import { Types } from 'mongoose';
import { getSportsUserBalanceSol, rejectOrVoidSportsTicket, reserveSportsTicket, settleSportsTicketLedger, sportsStakeSolToMinor } from '../../ledger/sportsLedger.service';
import { sportsbookRouter } from '../SportsbookRouter';
import { SportsTicket } from '../models/SportsTicket';
import { SportsMarket } from '../models/SportsMarket';
import { SportsTicketRejectedError, TicketQuoteLeg } from '../providers/SportsbookProvider';

const decimal = (value: bigint) => Types.Decimal128.fromString(value.toString());
const stable = (value: any): any => typeof value === 'bigint' ? value.toString() : Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.keys(value).sort().reduce((out, key) => ({ ...out, [key]: stable(value[key]) }), {}) : value;
const payloadHash = (value: unknown) => createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');

export interface PlaceSportsTicketInput {
  ticketId: string; ownerId: Types.ObjectId; stakeSol: number; acceptOddsChange: boolean;
  product?: 'STANDARD' | 'BET_BUILDER';
  legs: Array<{ selectionId: string; displayedMarketVersion: number; displayedOddsMillionths: string }>;
}

export const placeSportsTicket = async (input: PlaceSportsTicketInput) => {
  if (!/^[A-Za-z0-9:_-]{16,128}$/.test(input.ticketId)) throw new Error('Invalid ticket ID');
  if (!Array.isArray(input.legs) || input.legs.length < 1 || input.legs.length > 20) throw new Error('Ticket requires 1-20 legs');
  if (new Set(input.legs.map(leg => leg.selectionId)).size !== input.legs.length) throw new Error('Duplicate selections are not allowed');
  const stakeMinor = sportsStakeSolToMinor(input.stakeSol);
  const product = input.product || 'STANDARD';
  if (!['STANDARD', 'BET_BUILDER'].includes(product)) throw new Error('Invalid sportsbook product');
  const quotes: TicketQuoteLeg[] = input.legs.map(leg => {
    if (!/^[A-Za-z0-9:_.-]{1,128}$/.test(leg.selectionId) || !Number.isSafeInteger(leg.displayedMarketVersion) || leg.displayedMarketVersion < 1 || !/^\d{7,10}$/.test(leg.displayedOddsMillionths)) throw new Error('Invalid ticket quote');
    return { selectionId: leg.selectionId, displayedMarketVersion: leg.displayedMarketVersion, displayedOddsMillionths: BigInt(leg.displayedOddsMillionths) };
  });
  const provider = sportsbookRouter.selected();
  const hash = payloadHash({ stakeMinor, quotes, acceptOddsChange: input.acceptOddsChange, product, provider: provider.name });
  let ticket = await SportsTicket.findOne({ ticketId: input.ticketId });
  if (ticket) {
    if (ticket.userId.toString() !== input.ownerId.toString() || ticket.acceptancePayloadHash !== hash) throw new Error('Sports ticket idempotency payload mismatch');
    if (ticket.status !== 'FUNDS_RESERVED') return ticket;
  } else {
    await reserveSportsTicket(input.ownerId, input.ticketId, stakeMinor);
    try {
      ticket = await SportsTicket.create({ ticketId: input.ticketId, userId: input.ownerId, provider: provider.name, type: product === 'BET_BUILDER' ? 'BET_BUILDER' : quotes.length === 1 ? 'SINGLE' : 'ACCUMULATOR', product, stakeMinor: decimal(stakeMinor), maxPayoutMinor: decimal(stakeMinor), status: 'FUNDS_RESERVED', legs: [], quoteLegs: quotes.map(leg => ({ ...leg, displayedOddsMillionths: decimal(leg.displayedOddsMillionths) })), acceptOddsChange: input.acceptOddsChange, acceptancePayloadHash: hash });
    } catch (error: any) {
      if (error?.code === 11000) ticket = await SportsTicket.findOne({ ticketId: input.ticketId });
      if (!ticket) { await rejectOrVoidSportsTicket(input.ticketId).catch(() => undefined); throw error; }
    }
  }
  try {
    const acceptance = await sportsbookRouter.execute(current => current.acceptTicket({ ticketId: input.ticketId, stakeMinor, legs: quotes, acceptOddsChange: input.acceptOddsChange, product }));
    if (acceptance.status !== 'ACCEPTED') throw new SportsTicketRejectedError(acceptance.reason || 'Provider rejected ticket');
    const isLive = !!await SportsMarket.exists({ marketId: { $in: acceptance.legs.map(leg => leg.marketId) }, isLive: true });
    ticket = await SportsTicket.findOneAndUpdate(
      { ticketId: input.ticketId, status: 'FUNDS_RESERVED' },
      { $set: { providerTicketId: acceptance.providerTicketId, acceptedCombinedOddsMillionths: decimal(acceptance.combinedOddsMillionths), maxPayoutMinor: decimal(acceptance.maxPayoutMinor), legs: acceptance.legs.map(leg => ({ ...leg, acceptedOddsMillionths: decimal(leg.acceptedOddsMillionths), result: 'OPEN' })), context: isLive ? 'LIVE' : 'PREMATCH', status: 'ACCEPTED', acceptedAt: new Date() } },
      { returnDocument: 'after' }
    ) || await SportsTicket.findOne({ ticketId: input.ticketId });
    return ticket;
  } catch (error) {
    if (error instanceof SportsTicketRejectedError) {
      await rejectOrVoidSportsTicket(input.ticketId).catch(() => undefined);
      await SportsTicket.updateOne({ ticketId: input.ticketId, status: 'FUNDS_RESERVED' }, { $set: { status: 'REJECTED' } });
    }
    throw error;
  }
};

export const serializeSportsTicket = (ticket: any) => ({
  ticketId: ticket.ticketId, type: ticket.type, product: ticket.product, context: ticket.context, status: ticket.status, stakeMinor: ticket.stakeMinor.toString(),
  maxPayoutMinor: ticket.maxPayoutMinor.toString(), payoutMinor: ticket.payoutMinor?.toString(), acceptedAt: ticket.acceptedAt, settledAt: ticket.settledAt,
  combinedOddsMillionths: ticket.acceptedCombinedOddsMillionths?.toString(),
  cashoutAmountMinor: ticket.cashoutAmountMinor?.toString(), cashedOutAt: ticket.cashedOutAt,
  legs: ticket.legs.map((leg: any) => ({ selectionId: leg.selectionId, eventId: leg.eventId, marketId: leg.marketId, marketType: leg.marketType, selectionName: leg.selectionName, oddsMillionths: leg.acceptedOddsMillionths.toString(), marketVersion: leg.acceptedMarketVersion, result: leg.result }))
});

export const getSportsHistory = async (ownerId: Types.ObjectId, limit = 50) => {
  const tickets = await SportsTicket.find({ userId: ownerId }).sort({ createdAt: -1 }).limit(Math.min(Math.max(limit, 1), 100));
  return Promise.all(tickets.map(async ticket => serializeSportsTicket(ticket)));
};

export { getSportsUserBalanceSol };

export const recoverReservedSportsTickets = async () => {
  const provider = sportsbookRouter.selected();
  const tickets = await SportsTicket.find({ provider: provider.name, status: 'FUNDS_RESERVED' }).sort({ createdAt: 1 }).limit(500);
  let recovered = 0;
  for (const ticket of tickets) {
    try {
      const acceptance = await sportsbookRouter.execute(current => current.acceptTicket({
        ticketId: ticket.ticketId, stakeMinor: BigInt(ticket.stakeMinor.toString()), acceptOddsChange: ticket.acceptOddsChange, product: ticket.product || 'STANDARD',
        legs: ticket.quoteLegs.map((leg: any) => ({ selectionId: leg.selectionId, displayedMarketVersion: leg.displayedMarketVersion, displayedOddsMillionths: BigInt(leg.displayedOddsMillionths.toString()) }))
      }));
      if (acceptance.status !== 'ACCEPTED') throw new SportsTicketRejectedError(acceptance.reason || 'Provider rejected ticket');
      const changed = await SportsTicket.updateOne({ _id: ticket._id, status: 'FUNDS_RESERVED' }, { $set: { providerTicketId: acceptance.providerTicketId, acceptedCombinedOddsMillionths: decimal(acceptance.combinedOddsMillionths), maxPayoutMinor: decimal(acceptance.maxPayoutMinor), legs: acceptance.legs.map(leg => ({ ...leg, acceptedOddsMillionths: decimal(leg.acceptedOddsMillionths), result: 'OPEN' })), status: 'ACCEPTED', acceptedAt: new Date() } });
      recovered += changed.modifiedCount;
    } catch (error) {
      if (error instanceof SportsTicketRejectedError) {
        await rejectOrVoidSportsTicket(ticket.ticketId).catch(() => undefined);
        await SportsTicket.updateOne({ _id: ticket._id, status: 'FUNDS_RESERVED' }, { $set: { status: 'REJECTED' } });
      }
    }
  }
  return recovered;
};
