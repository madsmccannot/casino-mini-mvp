import { createFairRandom } from './fairness';
import { standardResult } from './game.types';
import { validators } from './gameRegistry';

export const limboOutcome = (randomInteger: number): number => {
  const uniform = (randomInteger + 1) / 0x1_0000_0000;
  return Math.min(1_000_000, Math.floor((0.99 / uniform) * 100) / 100);
};

export const playLimbo = async (wager: number, raw: unknown, commitment?: { serverSeed: string; commitId: string; committedAt: string }) => {
  const params = validators.limbo(wager, raw);
  const random = createFairRandom(params.clientSeed, params.nonce, commitment?.serverSeed, commitment);
  const resultMultiplier = limboOutcome(random.integer(0x1_0000_0000));
  const multiplier = resultMultiplier >= params.targetMultiplier ? params.targetMultiplier : 0;
  return standardResult('limbo', wager, wager * multiplier, multiplier, { resultMultiplier, targetMultiplier: params.targetMultiplier }, random.proof);
};
