import { solToLamports } from '../ledger/casinoLedger.service';
import { authorizeExposure, releaseExposure, settleExposure } from './exposure/exposure.service';

export const authorizeBetBankroll = (betId: string, game: string, wagerSol: number, multiplier: number) => {
  if (!Number.isFinite(multiplier) || multiplier <= 0) throw new Error('Invalid maximum payout multiplier');
  return authorizeExposure({
    betId, game, currency: 'SOL',
    stakeMinor: solToLamports(wagerSol),
    maxPayoutMinor: solToLamports(wagerSol * multiplier)
  });
};

export const releaseBetBankroll = releaseExposure;

export const settleBetBankroll = (betId: string, payoutSol: number, result: unknown) =>
  settleExposure(betId, payoutSol === 0 ? 0n : solToLamports(payoutSol), result);
