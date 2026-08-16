import assert from 'node:assert/strict';
import test from 'node:test';
import { validateBalancedPostings } from './ledger.types';
import { assertIdempotentMatch, hashLedgerPayload } from './idempotency.service';

const balanced = {
  idempotencyKey: 'test:1',
  transactionType: 'TEST',
  currency: 'SOL' as const,
  referenceType: 'test',
  referenceId: '1',
  postings: [
    { accountCode: 'A', side: 'DEBIT' as const, amountMinor: 10n },
    { accountCode: 'B', side: 'CREDIT' as const, amountMinor: 10n }
  ]
};

test('accepts balanced positive postings', () => {
  assert.doesNotThrow(() => validateBalancedPostings(balanced.postings));
});

test('rejects unbalanced and non-positive postings', () => {
  assert.throws(() => validateBalancedPostings([
    { accountCode: 'A', side: 'DEBIT', amountMinor: 10n },
    { accountCode: 'B', side: 'CREDIT', amountMinor: 9n }
  ]));
  assert.throws(() => validateBalancedPostings([
    { accountCode: 'A', side: 'DEBIT', amountMinor: 0n },
    { accountCode: 'B', side: 'CREDIT', amountMinor: 0n }
  ]));
});

test('idempotency hashes are stable and reject payload changes', () => {
  const first = hashLedgerPayload({ ...balanced, metadata: { b: 2, a: 1 } });
  const same = hashLedgerPayload({ ...balanced, metadata: { a: 1, b: 2 } });
  const changed = hashLedgerPayload({ ...balanced, referenceId: '2' });
  assert.equal(first, same);
  assert.doesNotThrow(() => assertIdempotentMatch(first, same));
  assert.throws(() => assertIdempotentMatch(first, changed));
});
