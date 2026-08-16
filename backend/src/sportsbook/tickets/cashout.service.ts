import { Types } from 'mongoose';
import { settleSportsTicketLedger } from '../../ledger/sportsLedger.service';
import { sportsbookRouter } from '../SportsbookRouter';
import { SportsTicket } from '../models/SportsTicket';

const decimal = (value: bigint) => Types.Decimal128.fromString(value.toString());

export const quoteSportsCashout = async (ownerId: Types.ObjectId, ticketId: string) => {
  const ticket: any = await SportsTicket.findOne({ ticketId, userId: ownerId, status: 'ACCEPTED' });
  if (!ticket?.providerTicketId) throw new Error('Ticket is not eligible for cashout');
  const quote = await sportsbookRouter.execute(provider => provider.quoteCashout({ providerTicketId: ticket.providerTicketId, ticketId }));
  return { quoteId: quote.quoteId, ticketId, amountMinor: quote.amountMinor.toString(), expiresAt: quote.expiresAt };
};

const completeCashout = async (ticketId: string) => {
  const ticket: any = await SportsTicket.findOne({ ticketId, status: 'CASHOUT_PENDING', cashoutAcceptanceId: { $exists: true }, cashoutAmountMinor: { $exists: true } });
  if (!ticket) return SportsTicket.findOne({ ticketId });
  await settleSportsTicketLedger(ticketId, BigInt(ticket.cashoutAmountMinor.toString()));
  return SportsTicket.findOneAndUpdate({ _id: ticket._id, status: 'CASHOUT_PENDING' }, { $set: { status: 'CASHED_OUT', payoutMinor: ticket.cashoutAmountMinor, cashedOutAt: new Date(), settledAt: new Date() } }, { returnDocument: 'after' });
};

export const acceptSportsCashout = async (ownerId: Types.ObjectId, ticketId: string, quoteId: string) => {
  if (!/^[A-Za-z0-9:_-]{16,160}$/.test(quoteId)) throw new Error('Invalid cashout quote ID');
  let ticket: any = await SportsTicket.findOne({ ticketId, userId: ownerId });
  if (!ticket) throw new Error('Sports ticket not found');
  if (ticket.status === 'CASHED_OUT') return ticket;
  if (ticket.status === 'ACCEPTED') ticket = await SportsTicket.findOneAndUpdate({ _id: ticket._id, status: 'ACCEPTED' }, { $set: { status: 'CASHOUT_PENDING', cashoutQuoteId: quoteId } }, { returnDocument: 'after' });
  if (!ticket || ticket.status !== 'CASHOUT_PENDING' || ticket.cashoutQuoteId !== quoteId || !ticket.providerTicketId) throw new Error('Ticket is no longer eligible for cashout');
  try {
    const accepted = await sportsbookRouter.execute(provider => provider.acceptCashout({ providerTicketId: ticket.providerTicketId, quoteId }));
    ticket = await SportsTicket.findOneAndUpdate({ _id: ticket._id, status: 'CASHOUT_PENDING', cashoutQuoteId: quoteId }, { $set: { cashoutAcceptanceId: accepted.acceptanceId, cashoutAmountMinor: decimal(accepted.amountMinor) } }, { returnDocument: 'after' });
    if (!ticket) throw new Error('Cashout state changed during provider acceptance');
    return completeCashout(ticket.ticketId);
  } catch (error) {
    await SportsTicket.updateOne({ _id: ticket._id, status: 'CASHOUT_PENDING', cashoutAcceptanceId: { $exists: false } }, { $set: { status: 'ACCEPTED' }, $unset: { cashoutQuoteId: 1 } });
    throw error;
  }
};

export const recoverPendingSportsCashouts = async () => {
  const tickets: any[] = await SportsTicket.find({ status: 'CASHOUT_PENDING' }).sort({ updatedAt: 1 }).limit(500);
  let recovered = 0;
  for (const ticket of tickets) {
    try {
      if (!ticket.cashoutAcceptanceId) {
        const accepted = await sportsbookRouter.execute(provider => provider.acceptCashout({ providerTicketId: ticket.providerTicketId, quoteId: ticket.cashoutQuoteId }));
        await SportsTicket.updateOne({ _id: ticket._id, status: 'CASHOUT_PENDING' }, { $set: { cashoutAcceptanceId: accepted.acceptanceId, cashoutAmountMinor: decimal(accepted.amountMinor) } });
      }
      if (await completeCashout(ticket.ticketId)) recovered++;
    } catch {
      await SportsTicket.updateOne({ _id: ticket._id, status: 'CASHOUT_PENDING', cashoutAcceptanceId: { $exists: false } }, { $set: { status: 'ACCEPTED' }, $unset: { cashoutQuoteId: 1 } });
    }
  }
  return recovered;
};
