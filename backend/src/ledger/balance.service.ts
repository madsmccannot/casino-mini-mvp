import { ClientSession } from 'mongoose';
import { LedgerAccount } from './ledgerAccount.model';
import { LedgerBalance } from './ledgerBalance.model';

export interface UnifiedBalance {
  availableMinor: bigint;
  reservedMinor: bigint;
  pendingMinor: bigint;
}

export const getAccountBalance = async (accountCode: string, session?: ClientSession): Promise<bigint> => {
  const accountQuery = LedgerAccount.findOne({ code: accountCode });
  if (session) accountQuery.session(session);
  const account = await accountQuery;
  if (!account) return 0n;
  const balanceQuery = LedgerBalance.findOne({ accountId: account._id });
  if (session) balanceQuery.session(session);
  const balance = await balanceQuery;
  return BigInt(balance?.amountMinor.toString() || '0');
};

export const userAccountCode = (ownerId: string, purpose: 'AVAILABLE' | 'RESERVED' | 'PENDING', currency = 'SOL') =>
  `USER:${ownerId}:${currency}:${purpose}`;

export const getUnifiedBalance = async (ownerId: string): Promise<UnifiedBalance> => ({
  availableMinor: await getAccountBalance(userAccountCode(ownerId, 'AVAILABLE')),
  reservedMinor: await getAccountBalance(userAccountCode(ownerId, 'RESERVED')),
  pendingMinor: await getAccountBalance(userAccountCode(ownerId, 'PENDING'))
});
