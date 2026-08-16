import { Types } from 'mongoose';
import { getUnifiedBalance } from './balance.service';
import { createSystemAccount, ensureUserLedgerAccounts, postTransaction, releaseReservation, reserveFunds, settleReservation, commitReservation } from './ledger.service';
import { userAccountCode } from './balance.service';

export const CASINO_STAKE_REVENUE = 'SYSTEM:USDC:CASINO_STAKE_REVENUE';
export const CASINO_PAYOUT_EXPENSE = 'SYSTEM:USDC:CASINO_PAYOUTS';
export const CUSTODY_TREASURY = 'SYSTEM:USDC:CUSTODY_TREASURY';

export const solToLamports = (amountSol: number): bigint => {
  if (!Number.isFinite(amountSol) || amountSol <= 0) throw new Error('Invalid SOL amount');
  const lamports = Math.round(amountSol * 1_000_000_000);
  if (!Number.isSafeInteger(lamports)) throw new Error('SOL amount exceeds safe range');
  return BigInt(lamports);
};

export const lamportsToSol = (lamports: bigint): number => Number(lamports) / 1_000_000_000;

export const usdcToMinor = (amountUsdc: number): bigint => {
  if (!Number.isFinite(amountUsdc) || amountUsdc <= 0) throw new Error('Invalid USDC amount');
  const minor = Math.round(amountUsdc * 1_000_000);
  if (!Number.isSafeInteger(minor)) throw new Error('USDC amount exceeds safe range');
  return BigInt(minor);
};

export const minorToUsdc = (minor: bigint): number => Number(minor) / 1_000_000;

export const ensureCasinoLedgerAccounts = async () => {
  await Promise.all([
    createSystemAccount(CASINO_STAKE_REVENUE, 'REVENUE', 'USDC', 'CASINO_STAKES'),
    createSystemAccount(CASINO_PAYOUT_EXPENSE, 'EXPENSE', 'USDC', 'CASINO_PAYOUTS'),
    createSystemAccount(CUSTODY_TREASURY, 'ASSET', 'USDC', 'CUSTODY_TREASURY')
  ]);
};

export const reserveCasinoBet = async (ownerId: Types.ObjectId, betId: string, amountUsdc: number) => {
  await ensureCasinoLedgerAccounts();
  return reserveFunds({
    reservationId: `casino:${betId}`,
    ownerId,
    currency: 'USDC',
    amountMinor: usdcToMinor(amountUsdc),
    referenceType: 'casino_bet',
    referenceId: betId
  });
};

export const settleCasinoBet = async (betId: string, payoutUsdc: number) => {
  const payoutMinor = payoutUsdc === 0 ? 0n : usdcToMinor(payoutUsdc);
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

export const getUserBalanceUsdc = async (ownerId: string): Promise<number> =>
  minorToUsdc((await getUnifiedBalance(ownerId, 'USDC')).availableMinor);

export const creditConfirmedDeposit = async (ownerId: Types.ObjectId, signature: string, amountUsdc: number) => {
  await ensureCasinoLedgerAccounts();
  await ensureUserLedgerAccounts(ownerId, 'USDC');
  const amountMinor = usdcToMinor(amountUsdc);
  return postTransaction({
    idempotencyKey: `deposit:evm:${signature}`,
    transactionType: 'DEPOSIT_CONFIRMED',
    currency: 'USDC',
    referenceType: 'evm_transaction',
    referenceId: signature,
    postings: [
      { accountCode: CUSTODY_TREASURY, side: 'DEBIT', amountMinor },
      { accountCode: userAccountCode(ownerId.toString(), 'AVAILABLE'), side: 'CREDIT', amountMinor }
    ]
  });
};

export const reserveWithdrawal = async (ownerId: Types.ObjectId, withdrawalId: string, amountUsdc: number) => {
  await ensureCasinoLedgerAccounts();
  return reserveFunds({
    reservationId: `withdrawal:${withdrawalId}`,
    ownerId,
    currency: 'USDC',
    amountMinor: usdcToMinor(amountUsdc),
    referenceType: 'withdrawal',
    referenceId: withdrawalId
  });
};

export const confirmWithdrawal = (withdrawalId: string) =>
  commitReservation(`withdrawal:${withdrawalId}`, CUSTODY_TREASURY);

export const failWithdrawal = (withdrawalId: string) =>
  releaseReservation(`withdrawal:${withdrawalId}`);
