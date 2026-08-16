export const LEDGER_CURRENCIES = ['SOL'] as const;
export type LedgerCurrency = typeof LEDGER_CURRENCIES[number];

export const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const;
export type LedgerAccountType = typeof ACCOUNT_TYPES[number];

export type PostingSide = 'DEBIT' | 'CREDIT';

export interface LedgerPostingInput {
  accountCode: string;
  side: PostingSide;
  amountMinor: bigint;
  memo?: string;
}

export interface PostTransactionInput {
  idempotencyKey: string;
  transactionType: string;
  currency: LedgerCurrency;
  referenceType: string;
  referenceId: string;
  postings: LedgerPostingInput[];
  metadata?: Record<string, unknown>;
}

export const assertMinorAmount = (amount: bigint): void => {
  if (amount <= 0n) throw new Error('Ledger amount must be a positive integer');
};

export const validateBalancedPostings = (postings: LedgerPostingInput[]): void => {
  if (postings.length < 2) throw new Error('A journal transaction requires at least two postings');
  let debits = 0n;
  let credits = 0n;
  for (const posting of postings) {
    assertMinorAmount(posting.amountMinor);
    if (posting.side === 'DEBIT') debits += posting.amountMinor;
    else if (posting.side === 'CREDIT') credits += posting.amountMinor;
    else throw new Error('Invalid posting side');
  }
  if (debits !== credits) throw new Error('Journal transaction is not balanced');
};
