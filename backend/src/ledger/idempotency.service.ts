import crypto from 'crypto';
import { PostTransactionInput } from './ledger.types';

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, stableValue(entry)])
    );
  }
  return value;
};

export const hashLedgerPayload = (input: PostTransactionInput): string => {
  const serializable = {
    ...input,
    postings: input.postings.map((posting) => ({ ...posting, amountMinor: posting.amountMinor.toString() }))
  };
  return crypto.createHash('sha256').update(JSON.stringify(stableValue(serializable))).digest('hex');
};

export const assertIdempotentMatch = (storedHash: string, incomingHash: string): void => {
  if (storedHash !== incomingHash) {
    throw new Error('Idempotency key was already used with a different payload');
  }
};
