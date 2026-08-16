import crypto from 'crypto';
import { Response } from 'express';
import { AuthRequest } from '../bets/validateBet.middleware';
import { reconcileLedger } from '../../ledger/reconciliation.service';
import { appendAuditEvent } from '../../observability/auditLog';

export const getLedgerReconciliation = async (req: AuthRequest, res: Response) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: 'Access denied' });
  try {
    const report = await reconcileLedger();
    await appendAuditEvent({
      eventId: crypto.randomUUID(),
      actorId: req.user._id,
      actorWallet: req.user.walletAddress,
      action: 'LEDGER_RECONCILIATION_RUN',
      targetType: 'ledger',
      correlationId: req.correlationId || crypto.randomUUID(),
      outcome: report.healthy ? 'SUCCESS' : 'FAILED',
      metadata: { journalCount: report.journalCount, reservationCount: report.reservationCount, issueCount: report.issues.length }
    });
    return res.status(report.healthy ? 200 : 409).json(report);
  } catch (error) {
    return res.status(500).json({ error: 'Ledger reconciliation failed' });
  }
};
