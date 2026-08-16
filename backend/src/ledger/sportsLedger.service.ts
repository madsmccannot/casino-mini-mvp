import { Types } from 'mongoose';
import { getUnifiedBalance } from './balance.service';
import { createSystemAccount, releaseReservation, reserveFunds, settleReservation } from './ledger.service';
import { minorToUsdc, usdcToMinor } from './casinoLedger.service';

export const SPORTS_STAKE_REVENUE = 'SYSTEM:USDC:SPORTS_STAKE_REVENUE';
export const SPORTS_PAYOUT_EXPENSE = 'SYSTEM:USDC:SPORTS_PAYOUT_EXPENSE';
const ensureAccounts = () => Promise.all([
  createSystemAccount(SPORTS_STAKE_REVENUE, 'REVENUE', 'USDC', 'SPORTS_STAKES'),
  createSystemAccount(SPORTS_PAYOUT_EXPENSE, 'EXPENSE', 'USDC', 'SPORTS_PAYOUTS')
]);

export const reserveSportsTicket = async (ownerId: Types.ObjectId, ticketId: string, stakeMinor: bigint) => {
  await ensureAccounts();
  return reserveFunds({ reservationId: `sports:${ticketId}`, ownerId, currency: 'USDC', amountMinor: stakeMinor, referenceType: 'sports_ticket', referenceId: ticketId });
};
export const rejectOrVoidSportsTicket = (ticketId: string) => releaseReservation(`sports:${ticketId}`);
export const settleSportsTicketLedger = async (ticketId: string, payoutMinor: bigint) => {
  await ensureAccounts();
  return settleReservation({ reservationId: `sports:${ticketId}`, stakeDestinationAccountCode: SPORTS_STAKE_REVENUE, payoutSourceAccountCode: SPORTS_PAYOUT_EXPENSE, payoutMinor });
};
export const sportsStakeSolToMinor = usdcToMinor;
export const getSportsUserBalanceSol = async (ownerId: string) => minorToUsdc((await getUnifiedBalance(ownerId, 'USDC')).availableMinor);
