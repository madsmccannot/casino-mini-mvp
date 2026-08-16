import { ClientSession, Types } from 'mongoose';
import { LedgerAccount } from './ledgerAccount.model';
import { LedgerReservation } from './reservation.model';
import { getAccountBalance, userAccountCode } from './balance.service';
import { postJournalTransaction, withLedgerTransaction } from './journal.service';
import { assertMinorAmount, LedgerCurrency, PostTransactionInput } from './ledger.types';

const decimal = (amount: bigint): Types.Decimal128 => Types.Decimal128.fromString(amount.toString());

export const ensureUserAccounts = async (ownerId: Types.ObjectId, currency: LedgerCurrency, session: ClientSession) => {
  for (const purpose of ['AVAILABLE', 'RESERVED', 'PENDING'] as const) {
    await LedgerAccount.updateOne(
      { code: userAccountCode(ownerId.toString(), purpose, currency) },
      { $setOnInsert: { type: 'LIABILITY', currency, ownerId, purpose, status: 'ACTIVE' } },
      { upsert: true, session }
    );
  }
};

export const createSystemAccount = async (
  code: string,
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE',
  currency: LedgerCurrency,
  purpose: string
) => LedgerAccount.findOneAndUpdate(
  { code },
  { $setOnInsert: { type, currency, purpose, status: 'ACTIVE' } },
  { upsert: true, returnDocument: 'after' }
);

export const postTransaction = (input: PostTransactionInput) =>
  withLedgerTransaction((session) => postJournalTransaction(input, session));

export const ensureUserLedgerAccounts = (ownerId: Types.ObjectId, currency: LedgerCurrency = 'SOL') =>
  withLedgerTransaction(async (session) => {
    await ensureUserAccounts(ownerId, currency, session);
    return true;
  });

export const reserveFunds = async (input: {
  reservationId: string;
  ownerId: Types.ObjectId;
  currency: LedgerCurrency;
  amountMinor: bigint;
  referenceType: string;
  referenceId: string;
}): Promise<typeof LedgerReservation.prototype> => {
  assertMinorAmount(input.amountMinor);
  return withLedgerTransaction(async (session) => {
    const existing = await LedgerReservation.findOne({ reservationId: input.reservationId }).session(session);
    if (existing) {
      if (
        existing.ownerId.toString() !== input.ownerId.toString() ||
        existing.amountMinor.toString() !== input.amountMinor.toString() ||
        existing.currency !== input.currency ||
        existing.referenceType !== input.referenceType ||
        existing.referenceId !== input.referenceId
      ) {
        throw new Error('Reservation id was already used with different parameters');
      }
      return existing;
    }
    await ensureUserAccounts(input.ownerId, input.currency, session);
    const availableCode = userAccountCode(input.ownerId.toString(), 'AVAILABLE', input.currency);
    const reservedCode = userAccountCode(input.ownerId.toString(), 'RESERVED', input.currency);
    if (await getAccountBalance(availableCode, session) < input.amountMinor) throw new Error('Insufficient available ledger balance');

    const journal = await postJournalTransaction({
      idempotencyKey: `reservation:${input.reservationId}:reserve`,
      transactionType: 'FUNDS_RESERVED',
      currency: input.currency,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      postings: [
        { accountCode: availableCode, side: 'DEBIT', amountMinor: input.amountMinor },
        { accountCode: reservedCode, side: 'CREDIT', amountMinor: input.amountMinor }
      ]
    }, session);
    const [reservation] = await LedgerReservation.create([{
      ...input,
      amountMinor: decimal(input.amountMinor),
      status: 'ACTIVE',
      reserveJournalId: journal._id
    }], { session });
    return reservation;
  });
};

const closeReservation = async (
  reservationId: string,
  action: 'RELEASED' | 'COMMITTED',
  destinationAccountCode?: string
) => withLedgerTransaction(async (session) => {
  const reservation = await LedgerReservation.findOne({ reservationId }).session(session);
  if (!reservation) throw new Error('Reservation not found');
  const amount = BigInt(reservation.amountMinor.toString());
  const reservedCode = userAccountCode(reservation.ownerId.toString(), 'RESERVED', reservation.currency);
  const targetCode = action === 'RELEASED'
    ? userAccountCode(reservation.ownerId.toString(), 'AVAILABLE', reservation.currency)
    : destinationAccountCode;
  if (!targetCode) throw new Error('Commit requires a destination ledger account');

  const journalInput: PostTransactionInput = {
    idempotencyKey: `reservation:${reservationId}:${action.toLowerCase()}`,
    transactionType: action === 'RELEASED' ? 'BET_RELEASE' : 'STAKE_COMMITTED',
    currency: reservation.currency,
    referenceType: reservation.referenceType,
    referenceId: reservation.referenceId,
    postings: [
      { accountCode: reservedCode, side: 'DEBIT', amountMinor: amount },
      { accountCode: targetCode, side: 'CREDIT', amountMinor: amount }
    ]
  };
  if (reservation.status !== 'ACTIVE') {
    if (reservation.status === action) {
      await postJournalTransaction(journalInput, session);
      return reservation;
    }
    throw new Error(`Reservation is already ${reservation.status}`);
  }
  const journal = await postJournalTransaction(journalInput, session);
  reservation.status = action;
  reservation.terminalJournalId = journal._id;
  await reservation.save({ session });
  return reservation;
});

export const releaseReservation = (reservationId: string) => closeReservation(reservationId, 'RELEASED');
export const commitReservation = (reservationId: string, destinationAccountCode: string) =>
  closeReservation(reservationId, 'COMMITTED', destinationAccountCode);

export const settleReservation = async (input: {
  reservationId: string;
  stakeDestinationAccountCode: string;
  payoutSourceAccountCode: string;
  payoutMinor: bigint;
}) => {
  if (input.payoutMinor < 0n) throw new Error('Payout cannot be negative');
  return withLedgerTransaction(async (session) => {
    const reservation = await LedgerReservation.findOne({ reservationId: input.reservationId }).session(session);
    if (!reservation) throw new Error('Reservation not found');

    const stakeMinor = BigInt(reservation.amountMinor.toString());
    const reservedCode = userAccountCode(reservation.ownerId.toString(), 'RESERVED', reservation.currency);
    const availableCode = userAccountCode(reservation.ownerId.toString(), 'AVAILABLE', reservation.currency);
    const postings: PostTransactionInput['postings'] = [
      { accountCode: reservedCode, side: 'DEBIT', amountMinor: stakeMinor },
      { accountCode: input.stakeDestinationAccountCode, side: 'CREDIT', amountMinor: stakeMinor }
    ];
    if (input.payoutMinor > 0n) {
      postings.push(
        { accountCode: input.payoutSourceAccountCode, side: 'DEBIT', amountMinor: input.payoutMinor },
        { accountCode: availableCode, side: 'CREDIT', amountMinor: input.payoutMinor }
      );
    }
    const journalInput: PostTransactionInput = {
      idempotencyKey: `reservation:${input.reservationId}:settle`,
      transactionType: 'CASINO_SETTLEMENT',
      currency: reservation.currency,
      referenceType: reservation.referenceType,
      referenceId: reservation.referenceId,
      postings
    };
    if (reservation.status === 'COMMITTED') {
      await postJournalTransaction(journalInput, session);
      return reservation;
    }
    if (reservation.status !== 'ACTIVE') throw new Error(`Reservation is already ${reservation.status}`);
    const journal = await postJournalTransaction(journalInput, session);
    reservation.status = 'COMMITTED';
    reservation.terminalJournalId = journal._id;
    await reservation.save({ session });
    return reservation;
  });
};
