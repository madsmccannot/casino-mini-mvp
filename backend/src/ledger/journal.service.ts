import mongoose, { ClientSession, Types } from 'mongoose';
import { JournalTransaction, IJournalTransaction } from './journal.model';
import { LedgerAccount } from './ledgerAccount.model';
import { PostTransactionInput, validateBalancedPostings } from './ledger.types';
import { assertIdempotentMatch, hashLedgerPayload } from './idempotency.service';
import { LedgerBalance } from './ledgerBalance.model';

const decimal = (amount: bigint): Types.Decimal128 => Types.Decimal128.fromString(amount.toString());

export const postJournalTransaction = async (
  input: PostTransactionInput,
  session: ClientSession
): Promise<IJournalTransaction> => {
  validateBalancedPostings(input.postings);
  const payloadHash = hashLedgerPayload(input);
  const existing = await JournalTransaction.findOne({ idempotencyKey: input.idempotencyKey }).session(session);
  if (existing) {
    assertIdempotentMatch(existing.payloadHash, payloadHash);
    return existing;
  }

  const codes = [...new Set(input.postings.map((posting) => posting.accountCode))];
  const accounts = await LedgerAccount.find({ code: { $in: codes }, currency: input.currency, status: 'ACTIVE' }).session(session);
  if (accounts.length !== codes.length) throw new Error('One or more ledger accounts are missing, frozen, or use another currency');
  const byCode = new Map(accounts.map((account) => [account.code, account]));

  // Materialized balances are updated inside this transaction. Updating the
  // same available account creates a write conflict for concurrent spends.
  const deltas = new Map<string, bigint>();
  for (const posting of input.postings) {
    const account = byCode.get(posting.accountCode)!;
    const creditNormal = account.type === 'LIABILITY' || account.type === 'EQUITY' || account.type === 'REVENUE';
    const increasesBalance = creditNormal ? posting.side === 'CREDIT' : posting.side === 'DEBIT';
    deltas.set(posting.accountCode, (deltas.get(posting.accountCode) || 0n) + (increasesBalance ? posting.amountMinor : -posting.amountMinor));
  }
  for (const code of [...deltas.keys()].sort()) {
    const account = byCode.get(code)!;
    const delta = deltas.get(code)!;
    if (code.startsWith('USER:') && delta < 0n) {
      const result = await LedgerBalance.updateOne(
        { accountId: account._id, amountMinor: { $gte: decimal(-delta) } },
        { $inc: { amountMinor: decimal(delta) } },
        { session }
      );
      if (result.modifiedCount !== 1) throw new Error('Insufficient ledger balance');
    } else {
      await LedgerBalance.updateOne(
        { accountId: account._id },
        {
          $setOnInsert: { accountCode: code },
          $inc: { amountMinor: decimal(delta) }
        },
        { upsert: true, session }
      );
    }
  }

  const [journal] = await JournalTransaction.create([{
    ...input,
    payloadHash,
    postings: input.postings.map((posting) => ({
      accountId: byCode.get(posting.accountCode)!._id,
      accountCode: posting.accountCode,
      side: posting.side,
      amountMinor: decimal(posting.amountMinor),
      memo: posting.memo
    })),
    status: 'POSTED',
    postedAt: new Date()
  }], { session });
  return journal;
};

export const withLedgerTransaction = async <T>(work: (session: ClientSession) => Promise<T>): Promise<T> => {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await work(session);
    }, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
      readPreference: 'primary'
    });
    if (result === undefined) throw new Error('Ledger transaction did not produce a result');
    return result;
  } finally {
    await session.endSession();
  }
};
