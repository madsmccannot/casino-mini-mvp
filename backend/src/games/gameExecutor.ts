import { playCoinflip } from './coinflip.service';
import { playDice } from './dice.service';
import { playPlinko } from './plinko.service';
import { playRoulette } from './roulette.service';
import { playLimbo } from './limbo.service';

export const executeInstantGame = (game: string, wager: number, params: unknown, commitment: { serverSeed: string; commitId: string; committedAt: string }) => {
  switch (game) {
    case 'coinflip': return playCoinflip(wager, params, commitment);
    case 'dice': return playDice(wager, params, commitment);
    case 'plinko': return playPlinko(wager, params, commitment);
    case 'roulette': return playRoulette(wager, params, commitment);
    case 'limbo': return playLimbo(wager, params, commitment);
    default: throw new Error('Game not supported');
  }
};

export const standardizedStats = (result: any) => ({
  wager: result.wager,
  payout: result.payout,
  multiplier: result.multiplier,
  profit: result.profit,
  won: result.won,
  proofAlgorithm: result.proof?.algorithm,
  ...(result.game === 'dice' ? { target: result.outcome.target, condition: result.outcome.condition, rolled: result.outcome.rolled } : {}),
  ...(result.game === 'plinko' ? { rows: result.outcome.rows, risk: result.outcome.risk, bucket: result.outcome.bucket } : {}),
  ...(result.game === 'roulette' ? { number: result.outcome.number, color: result.outcome.color, selection: result.outcome.selection } : {}),
  ...(result.game === 'mines' ? { status: result.outcome.status, revealedCount: result.outcome.revealed?.length } : {})
  ,...(result.game === 'limbo' ? { targetMultiplier: result.outcome.targetMultiplier, resultMultiplier: result.outcome.resultMultiplier } : {})
  ,...(result.game === 'crash' ? { autoCashout: result.outcome.autoCashout, crashMultiplier: result.outcome.crashMultiplier, roundId: result.outcome.roundId } : {})
  ,...(result.game === 'blackjack' ? { status: result.outcome.status, playerValue: result.outcome.playerValue, dealerValue: result.outcome.dealerValue } : {})
});
