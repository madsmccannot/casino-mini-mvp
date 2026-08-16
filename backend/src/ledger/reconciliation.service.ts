import { JournalTransaction } from './journal.model';
import { LedgerAccount } from './ledgerAccount.model';
import { LedgerReservation } from './reservation.model';
import { LedgerBalance } from './ledgerBalance.model';

export interface ReconciliationIssue {
  kind: 'UNBALANCED_JOURNAL' | 'BALANCE_MISMATCH' | 'UNKNOWN_ACCOUNT' | 'MISSING_JOURNAL' | 'INVALID_RESERVATION' | 'STALE_RESERVATION';
  recordId: string;
  detail: string;
}

export interface ReconciliationReport {
  checkedAt: Date;
  journalCount: number;
  reservationCount: number;
  issues: ReconciliationIssue[];
  healthy: boolean;
}

export const reconcileLedger = async (): Promise<ReconciliationReport> => {
  const issues: ReconciliationIssue[] = [];
  const accounts = await LedgerAccount.find({}, { code: 1, type: 1 }).lean();
  const accountCodes = new Set(accounts.map((account) => account.code));
  const accountTypes = new Map(accounts.map((account) => [account.code, account.type]));
  const journals = await JournalTransaction.find({ status: 'POSTED' }).lean();
  const journalIds = new Set(journals.map((journal) => journal._id.toString()));
  const computedBalances = new Map<string, bigint>();

  for (const journal of journals) {
    let debits = 0n;
    let credits = 0n;
    for (const posting of journal.postings) {
      const amount = BigInt(posting.amountMinor.toString());
      if (posting.side === 'DEBIT') debits += amount;
      else credits += amount;
      const accountType = accountTypes.get(posting.accountCode);
      if (accountType) {
        const creditNormal = accountType === 'LIABILITY' || accountType === 'EQUITY' || accountType === 'REVENUE';
        const increase = creditNormal ? posting.side === 'CREDIT' : posting.side === 'DEBIT';
        computedBalances.set(posting.accountCode, (computedBalances.get(posting.accountCode) || 0n) + (increase ? amount : -amount));
      }
      if (!accountCodes.has(posting.accountCode)) {
        issues.push({ kind: 'UNKNOWN_ACCOUNT', recordId: journal._id.toString(), detail: posting.accountCode });
      }
    }
    if (debits !== credits) {
      issues.push({ kind: 'UNBALANCED_JOURNAL', recordId: journal._id.toString(), detail: `${debits} != ${credits}` });
    }
  }

  const materialized = await LedgerBalance.find().lean();
  const materializedCodes = new Set(materialized.map((balance) => balance.accountCode));
  for (const balance of materialized) {
    const expected = computedBalances.get(balance.accountCode) || 0n;
    const actual = BigInt(balance.amountMinor.toString());
    if (expected !== actual) {
      issues.push({ kind: 'BALANCE_MISMATCH', recordId: balance._id.toString(), detail: `materialized ${actual} != journal ${expected}` });
    }
  }
  for (const [accountCode, expected] of computedBalances) {
    if (expected !== 0n && !materializedCodes.has(accountCode)) {
      issues.push({ kind: 'BALANCE_MISMATCH', recordId: accountCode, detail: `materialized balance missing; journal ${expected}` });
    }
  }

  const reservations = await LedgerReservation.find().lean();
  const staleBefore = Date.now() - 24 * 60 * 60 * 1000;
  for (const reservation of reservations) {
    if (!journalIds.has(reservation.reserveJournalId.toString())) {
      issues.push({ kind: 'MISSING_JOURNAL', recordId: reservation._id.toString(), detail: 'reserve journal missing' });
    }
    if (reservation.status !== 'ACTIVE' && (!reservation.terminalJournalId || !journalIds.has(reservation.terminalJournalId.toString()))) {
      issues.push({ kind: 'INVALID_RESERVATION', recordId: reservation._id.toString(), detail: 'terminal journal missing' });
    }
    if (reservation.status === 'ACTIVE' && reservation.createdAt.getTime() < staleBefore) {
      issues.push({ kind: 'STALE_RESERVATION', recordId: reservation._id.toString(), detail: `active since ${reservation.createdAt.toISOString()}` });
    }
  }

  return {
    checkedAt: new Date(),
    journalCount: journals.length,
    reservationCount: reservations.length,
    issues,
    healthy: issues.length === 0
  };
};
