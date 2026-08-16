import { Types } from 'mongoose';
import { getUnifiedBalance } from './balance.service';
import { createSystemAccount, releaseReservation, reserveFunds, settleReservation } from './ledger.service';
import { lamportsToSol, solToLamports } from './casinoLedger.service';

export const SPORTS_STAKE_REVENUE = 'SYSTEM:SOL:SPORTS_STAKE_REVENUE';
export const SPORTS_PAYOUT_EXPENSE = 'SYSTEM:SOL:SPORTS_PAYOUT_EXPENSE';
const ensureAccounts = () => Promise.all([
  createSystemAccount(SPORTS_STAKE_REVENUE, 'REVENUE', 'SOL', 'SPORTS_STAKES'),
  createSystemAccount(SPORTS_PAYOUT_EXPENSE, 'EXPENSE', 'SOL', 'SPORTS_PAYOUTS')
]);

export const reserveSportsTicket = async (ownerId: Types.ObjectId, ticketId: string, stakeMinor: bigint) => {
  await ensureAccounts();
  return reserveFunds({ reservationId: `sports:${ticketId}`, ownerId, currency: 'SOL', amountMinor: stakeMinor, referenceType: 'sports_ticket', referenceId: ticketId });
};
export const rejectOrVoidSportsTicket = (ticketId: string) => releaseReservation(`sports:${ticketId}`);
export const settleSportsTicketLedger = async (ticketId: string, payoutMinor: bigint) => {
  await ensureAccounts();
  return settleReservation({ reservationId: `sports:${ticketId}`, stakeDestinationAccountCode: SPORTS_STAKE_REVENUE, payoutSourceAccountCode: SPORTS_PAYOUT_EXPENSE, payoutMinor });
};
export const sportsStakeSolToMinor = solToLamports;
export const getSportsUserBalanceSol = async (ownerId: string) => lamportsToSol((await getUnifiedBalance(ownerId)).availableMinor);
