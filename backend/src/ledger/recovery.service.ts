import { Bet } from '../models/Bet';
import { settleCasinoBet } from './casinoLedger.service';

export interface RecoveryReport {
  scanned: number;
  settled: number;
  failed: Array<{ betId: string; error: string }>;
}

// Safe recovery only processes outcomes already persisted before settlement.
// It never invents or re-runs a game result.
export const recoverResultReadyBets = async (): Promise<RecoveryReport> => {
  const bets = await Bet.find({ status: 'RESULT_READY' }).select('betId payout');
  const report: RecoveryReport = { scanned: bets.length, settled: 0, failed: [] };
  for (const bet of bets) {
    try {
      await settleCasinoBet(bet.betId, bet.payout);
      await Bet.updateOne({ _id: bet._id, status: 'RESULT_READY' }, { $set: { status: 'SETTLED' } });
      report.settled += 1;
    } catch (error: any) {
      report.failed.push({ betId: bet.betId, error: error.message });
    }
  }
  return report;
};
