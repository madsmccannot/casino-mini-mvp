import { Response } from 'express';
import { AuthRequest } from '../bets/validateBet.middleware';
import { getUnifiedBalance, userAccountCode } from '../../ledger/balance.service';
import { JournalTransaction } from '../../ledger/journal.model';

export const getMyBalance = async (req: AuthRequest, res: Response) => {
  if (!req.user?._id) return res.status(401).json({ error: 'Unauthorized' });
  const balance = await getUnifiedBalance(req.user._id.toString());
  return res.json({
    currency: 'SOL',
    unit: 'lamports',
    availableMinor: balance.availableMinor.toString(),
    reservedMinor: balance.reservedMinor.toString(),
    pendingMinor: balance.pendingMinor.toString()
  });
};

export const getMyTransactions = async (req: AuthRequest, res: Response) => {
  if (!req.user?._id) return res.status(401).json({ error: 'Unauthorized' });
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const ownerPrefix = `USER:${req.user._id.toString()}:SOL:`;
  const transactions = await JournalTransaction.find({
    'postings.accountCode': { $in: [
      userAccountCode(req.user._id.toString(), 'AVAILABLE'),
      userAccountCode(req.user._id.toString(), 'RESERVED'),
      userAccountCode(req.user._id.toString(), 'PENDING')
    ] }
  }).sort({ postedAt: -1 }).limit(limit).lean();

  return res.json({ transactions: transactions.map((transaction) => ({
    id: transaction._id,
    type: transaction.transactionType,
    referenceType: transaction.referenceType,
    referenceId: transaction.referenceId,
    currency: transaction.currency,
    postedAt: transaction.postedAt,
    postings: transaction.postings
      .filter((posting) => posting.accountCode.startsWith(ownerPrefix))
      .map((posting) => ({
        account: posting.accountCode.slice(ownerPrefix.length),
        side: posting.side,
        amountMinor: posting.amountMinor.toString(),
        memo: posting.memo
      }))
  })) });
};
