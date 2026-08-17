import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import mongoose, { Types } from 'mongoose';
import { createSystemAccount, postTransaction, reserveFunds, releaseReservation, commitReservation, settleReservation } from './ledger.service';
import { getUnifiedBalance, userAccountCode } from './balance.service';
import { LedgerAccount } from './ledgerAccount.model';
import { JournalTransaction } from './journal.model';
import { reconcileLedger } from './reconciliation.service';
import { User } from '../models/User';
import { Bet } from '../models/Bet';
import { migrateLegacyTestBalances } from './migrateLegacyBalances.service';
import { reserveCasinoBet } from './casinoLedger.service';
import { recoverResultReadyBets } from './recovery.service';
import { AuditEvent } from '../observability/auditLog';

const mongoUri = process.env.LEDGER_TEST_MONGO_URI;
const integrationTest = mongoUri ? test : test.skip;
const ownerId = new Types.ObjectId();
const treasuryCode = 'SYSTEM:SOL:TREASURY';
const revenueCode = 'SYSTEM:SOL:REVENUE';

before(async () => {
  if (!mongoUri) return;
  await mongoose.connect(mongoUri);
  await mongoose.connection.db!.dropDatabase();
  await Promise.all([
    createSystemAccount(treasuryCode, 'ASSET', 'SOL', 'TEST_TREASURY'),
    createSystemAccount(revenueCode, 'REVENUE', 'SOL', 'TEST_REVENUE')
  ]);
  // reserveFunds creates the user accounts; seed them first explicitly.
  for (const purpose of ['AVAILABLE', 'RESERVED', 'PENDING'] as const) {
    await LedgerAccount.create({
      code: userAccountCode(ownerId.toString(), purpose),
      type: 'LIABILITY',
      currency: 'SOL',
      ownerId,
      purpose,
      status: 'ACTIVE'
    });
  }
  await postTransaction({
    idempotencyKey: 'test:opening:owner',
    transactionType: 'OPENING_BALANCE',
    currency: 'SOL',
    referenceType: 'test_fixture',
    referenceId: ownerId.toString(),
    postings: [
      { accountCode: treasuryCode, side: 'DEBIT', amountMinor: 100n },
      { accountCode: userAccountCode(ownerId.toString(), 'AVAILABLE'), side: 'CREDIT', amountMinor: 100n }
    ]
  });
});

after(async () => {
  if (mongoose.connection.readyState) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

integrationTest('posts idempotently without changing the balance twice', async () => {
  const input = {
    idempotencyKey: 'test:idempotent:credit',
    transactionType: 'TEST_CREDIT',
    currency: 'SOL' as const,
    referenceType: 'test',
    referenceId: 'idempotent-credit',
    postings: [
      { accountCode: treasuryCode, side: 'DEBIT' as const, amountMinor: 10n },
      { accountCode: userAccountCode(ownerId.toString(), 'AVAILABLE'), side: 'CREDIT' as const, amountMinor: 10n }
    ]
  };
  const first = await postTransaction(input);
  const second = await postTransaction(input);
  assert.equal(first._id.toString(), second._id.toString());
  assert.equal((await getUnifiedBalance(ownerId.toString())).availableMinor, 110n);
  await assert.rejects(() => postTransaction({ ...input, referenceId: 'changed' }), /different payload/);
});

integrationTest('reserve, release, and commit preserve double-entry balances', async () => {
  await reserveFunds({ reservationId: 'release-me', ownerId, currency: 'SOL', amountMinor: 10n, referenceType: 'bet', referenceId: 'bet-release' });
  let balance = await getUnifiedBalance(ownerId.toString());
  assert.deepEqual(balance, { availableMinor: 100n, reservedMinor: 10n, pendingMinor: 0n });
  await releaseReservation('release-me');
  await releaseReservation('release-me');
  balance = await getUnifiedBalance(ownerId.toString());
  assert.deepEqual(balance, { availableMinor: 110n, reservedMinor: 0n, pendingMinor: 0n });

  await reserveFunds({ reservationId: 'commit-me', ownerId, currency: 'SOL', amountMinor: 10n, referenceType: 'bet', referenceId: 'bet-commit' });
  await commitReservation('commit-me', revenueCode);
  await commitReservation('commit-me', revenueCode);
  balance = await getUnifiedBalance(ownerId.toString());
  assert.deepEqual(balance, { availableMinor: 100n, reservedMinor: 0n, pendingMinor: 0n });
  await assert.rejects(() => releaseReservation('commit-me'), /already COMMITTED/);
  await assert.rejects(() => commitReservation('commit-me', treasuryCode), /different payload/);
});

integrationTest('casino settlement is atomic and rejects a changed retry payout', async () => {
  await reserveFunds({ reservationId: 'settle-with-payout', ownerId, currency: 'SOL', amountMinor: 10n, referenceType: 'bet', referenceId: 'payout-bet' });
  await settleReservation({ reservationId: 'settle-with-payout', stakeDestinationAccountCode: revenueCode, payoutSourceAccountCode: treasuryCode, payoutMinor: 25n });
  await settleReservation({ reservationId: 'settle-with-payout', stakeDestinationAccountCode: revenueCode, payoutSourceAccountCode: treasuryCode, payoutMinor: 25n });
  assert.equal((await getUnifiedBalance(ownerId.toString())).availableMinor, 115n);
  await assert.rejects(
    () => settleReservation({ reservationId: 'settle-with-payout', stakeDestinationAccountCode: revenueCode, payoutSourceAccountCode: treasuryCode, payoutMinor: 26n }),
    /different payload/
  );
});

integrationTest('concurrent reservations cannot overspend', async () => {
  const attempts = Array.from({ length: 10 }, (_, index) => reserveFunds({
    reservationId: `race-${index}`,
    ownerId,
    currency: 'SOL' as const,
    amountMinor: 20n,
    referenceType: 'concurrency_test',
    referenceId: `race-${index}`
  }));
  const results = await Promise.allSettled(attempts);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 5);
  assert.equal(results.filter((result) => result.status === 'rejected').length, 5);
  const balance = await getUnifiedBalance(ownerId.toString());
  assert.deepEqual(balance, { availableMinor: 15n, reservedMinor: 100n, pendingMinor: 0n });
});

integrationTest('migrates legacy test balances exactly once', async () => {
  const user = await User.create({ walletAddress: 'migration-test-wallet', balance: 1.25 });
  const first = await migrateLegacyTestBalances();
  assert.equal(first.migrated, 1);
  assert.equal(first.totalMinor, '1250000');
  const migrated = await User.findById(user._id);
  assert.equal(migrated?.balance, 0);
  assert.equal(migrated?.legacyBalanceMinor, '1250000');
  assert.equal((await getUnifiedBalance(user._id.toString(), 'USDC')).availableMinor, 1_250_000n);
  const second = await migrateLegacyTestBalances();
  assert.equal(second.migrated, 0);
  assert.equal((await getUnifiedBalance(user._id.toString(), 'USDC')).availableMinor, 1_250_000n);
});

integrationTest('recovers a persisted result without rerunning or double-paying it', async () => {
  const user = await User.findOne({ walletAddress: 'migration-test-wallet' });
  assert.ok(user);
  const before = (await getUnifiedBalance(user._id.toString(), 'USDC')).availableMinor;
  await reserveCasinoBet(user._id, 'recovery-bet-id', 0.0001);
  await Bet.create({
    betId: 'recovery-bet-id',
    userId: user._id,
    game: 'coinflip',
    wager: 0.0001,
    payout: 0.0002,
    multiplier: 2,
    profit: 0.0001,
    outcome: 'win',
    status: 'RESULT_READY',
    details: { persisted: true }
  });
  const first = await recoverResultReadyBets();
  assert.equal(first.settled, 1);
  const second = await recoverResultReadyBets();
  assert.equal(second.scanned, 0);
  assert.equal((await getUnifiedBalance(user._id.toString(), 'USDC')).availableMinor, before + 100n);
});

integrationTest('journal is immutable and reconciliation is healthy', async () => {
  const journal = await JournalTransaction.findOne();
  assert.ok(journal);
  await assert.rejects(() => JournalTransaction.updateOne({ _id: journal._id }, { $set: { referenceId: 'tampered' } }), /immutable/);
  await assert.rejects(() => JournalTransaction.deleteOne({ _id: journal._id }), /cannot be deleted/);
  const report = await reconcileLedger();
  assert.equal(report.healthy, true, JSON.stringify(report.issues));
});

integrationTest('operational audit events are append-only', async () => {
  const event = await AuditEvent.create({
    eventId: 'audit-test-event',
    action: 'TEST_ACTION',
    targetType: 'ledger',
    correlationId: 'test-correlation-id',
    outcome: 'SUCCESS'
  });
  await assert.rejects(() => AuditEvent.updateOne({ _id: event._id }, { $set: { outcome: 'FAILED' } }), /immutable/);
  await assert.rejects(() => AuditEvent.deleteOne({ _id: event._id }), /cannot be deleted/);
});
