import { Types } from 'mongoose';
import { User } from '../models/User';
import { userAccountCode } from './balance.service';
import { usdcToMinor } from './casinoLedger.service';
import { createSystemAccount, ensureUserAccounts } from './ledger.service';
import { postJournalTransaction, withLedgerTransaction } from './journal.service';

export const LEGACY_MIGRATION_CLEARING = 'SYSTEM:USDC:LEGACY_TEST_MIGRATION_CLEARING';

export interface MigrationReport {
  scanned: number;
  migrated: number;
  zeroBalances: number;
  skipped: number;
  totalMinor: string;
  errors: Array<{ userId: string; error: string }>;
}

export const migrateLegacyTestBalances = async (): Promise<MigrationReport> => {
  await createSystemAccount(LEGACY_MIGRATION_CLEARING, 'ASSET', 'USDC', 'LEGACY_TEST_BALANCE_MIGRATION');
  const users = await User.find({ legacyBalanceMigratedAt: { $exists: false }, isBankroll: false }).select('_id balance');
  const report: MigrationReport = { scanned: users.length, migrated: 0, zeroBalances: 0, skipped: 0, totalMinor: '0', errors: [] };
  let total = 0n;

  for (const candidate of users) {
    try {
      const migrated = await withLedgerTransaction(async (session) => {
        const user = await User.findOne({ _id: candidate._id, legacyBalanceMigratedAt: { $exists: false } }).session(session);
        if (!user) return { status: 'skipped' as const, amount: 0n };
        const amount = user.balance === 0 ? 0n : usdcToMinor(user.balance);
        await ensureUserAccounts(user._id as Types.ObjectId, 'USDC', session);
        if (amount > 0n) {
          await postJournalTransaction({
            idempotencyKey: `migration:legacy-test-balance:${user._id.toString()}`,
            transactionType: 'OPENING_BALANCE_TEST_MIGRATION',
            currency: 'USDC',
            referenceType: 'legacy_user_balance',
            referenceId: user._id.toString(),
            postings: [
              { accountCode: LEGACY_MIGRATION_CLEARING, side: 'DEBIT', amountMinor: amount },
              { accountCode: userAccountCode(user._id.toString(), 'AVAILABLE', 'USDC'), side: 'CREDIT', amountMinor: amount }
            ],
            metadata: { testDataOnly: true }
          }, session);
        }
        user.legacyBalanceMinor = amount.toString();
        user.legacyBalanceMigratedAt = new Date();
        user.balance = 0;
        await user.save({ session });
        return { status: amount === 0n ? 'zero' as const : 'migrated' as const, amount };
      });
      if (migrated.status === 'skipped') report.skipped += 1;
      else if (migrated.status === 'zero') report.zeroBalances += 1;
      else {
        report.migrated += 1;
        total += migrated.amount;
      }
    } catch (error: any) {
      report.errors.push({ userId: candidate._id.toString(), error: error.message });
    }
  }
  report.totalMinor = total.toString();
  return report;
};
