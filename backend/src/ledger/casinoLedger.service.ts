import { Types } from 'mongoose';
import { getUnifiedBalance } from './balance.service';
import { createSystemAccount, ensureUserLedgerAccounts, postTransaction, releaseReservation, reserveFunds, settleReservation, commitReservation } from './ledger.service';
import { userAccountCode } from './balance.service';

export const CASINO_STAKE_REVENUE = 'SYSTEM:SOL:CASINO_STAKE_REVENUE';
export const CASINO_PAYOUT_EXPENSE = 'SYSTEM:SOL:CASINO_PAYOUT_EXPENSE';
export const CUSTODY_TREASURY = 'SYSTEM:SOL:CUSTODY_TREASURY';

export const solToLamports = (amountSol: number): bigint => {
  if (!Number.isFinite(amountSol) || amountSol <= 0) throw new Error('Invalid SOL amount');
  const lamports = Math.round(amountSol * 1_000_000_000);
  if (!Number.isSafeInteger(lamports)) throw new Error('SOL amount exceeds safe range');
  return BigInt(lamports);
};

export const lamportsToSol = (lamports: bigint): number => Number(lamports) / 1_000_000_000;

export const ensureCasinoLedgerAccounts = async () => {
  await Promise.all([
    createSystemAccount(CASINO_STAKE_REVENUE, 'REVENUE', 'SOL', 'CASINO_STAKES'),
    createSystemAccount(CASINO_PAYOUT_EXPENSE, 'EXPENSE', 'SOL', 'CASINO_PAYOUTS'),
    createSystemAccount(CUSTODY_TREASURY, 'ASSET', 'SOL', 'CUSTODY_TREASURY')
  ]);
};

export const reserveCasinoBet = async (ownerId: Types.ObjectId, betId: string, amountSol: number) => {
  await ensureCasinoLedgerAccounts();
  return reserveFunds({
    reservationId: `casino:${betId}`,
    ownerId,
    currency: 'SOL',
    amountMinor: solToLamports(amountSol),
    referenceType: 'casino_bet',
    referenceId: betId
  });
};

export const settleCasinoBet = async (betId: string, payoutSol: number) => {
  const payoutMinor = payoutSol === 0 ? 0n : solToLamports(payoutSol);
  return settleReservation({
    reservationId: `casino:${betId}`,
    stakeDestinationAccountCode: CASINO_STAKE_REVENUE,
    payoutSourceAccountCode: CASINO_PAYOUT_EXPENSE,
    payoutMinor
  });
};

export const refundCasinoBet = (betId: string) => releaseReservation(`casino:${betId}`);

export const getUserBalanceSol = async (ownerId: string): Promise<number> =>
  lamportsToSol((await getUnifiedBalance(ownerId)).availableMinor);

export const creditConfirmedDeposit = async (ownerId: Types.ObjectId, signature: string, amountSol: number) => {
  await ensureCasinoLedgerAccounts();
  await ensureUserLedgerAccounts(ownerId);
  const amountMinor = solToLamports(amountSol);
  return postTransaction({
    idempotencyKey: `deposit:solana:${signature}`,
    transactionType: 'DEPOSIT_CONFIRMED',
    currency: 'SOL',
    referenceType: 'solana_transaction',
    referenceId: signature,
    postings: [
      { accountCode: CUSTODY_TREASURY, side: 'DEBIT', amountMinor },
      { accountCode: userAccountCode(ownerId.toString(), 'AVAILABLE'), side: 'CREDIT', amountMinor }
    ]
  });
};

export const reserveWithdrawal = async (ownerId: Types.ObjectId, withdrawalId: string, amountSol: number) => {
  await ensureCasinoLedgerAccounts();
  return reserveFunds({
    reservationId: `withdrawal:${withdrawalId}`,
    ownerId,
    currency: 'SOL',
    amountMinor: solToLamports(amountSol),
    referenceType: 'withdrawal',
    referenceId: withdrawalId
  });
};

export const confirmWithdrawal = (withdrawalId: string) =>
  commitReservation(`withdrawal:${withdrawalId}`, CUSTODY_TREASURY);

export const failWithdrawal = (withdrawalId: string) =>
  releaseReservation(`withdrawal:${withdrawalId}`);
