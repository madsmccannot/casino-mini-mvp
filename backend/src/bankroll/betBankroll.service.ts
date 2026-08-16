import { usdcToMinor } from '../ledger/casinoLedger.service';
import { authorizeExposure, releaseExposure, settleExposure } from './exposure/exposure.service';

export const authorizeBetBankroll = (betId: string, game: string, wagerUsdc: number, multiplier: number) => {
  if (!Number.isFinite(multiplier) || multiplier <= 0) throw new Error('Invalid maximum payout multiplier');
  return authorizeExposure({
    betId, game, currency: 'USDC',
    stakeMinor: usdcToMinor(wagerUsdc),
    maxPayoutMinor: usdcToMinor(wagerUsdc * multiplier)
  });
};

export const releaseBetBankroll = releaseExposure;

export const settleBetBankroll = (betId: string, payoutUsdc: number, result: unknown) =>
  settleExposure(betId, payoutUsdc === 0 ? 0n : usdcToMinor(payoutUsdc), result);
