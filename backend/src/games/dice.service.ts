import { createFairRandom } from './fairness';
import { standardResult } from './game.types';
import { validators } from './gameRegistry';

export const playDice = async (wager: number, raw: unknown, commitment?: { serverSeed: string; commitId: string; committedAt: string }) => {
  const params = validators.dice(wager, raw);
  const random = createFairRandom(params.clientSeed, params.nonce, commitment?.serverSeed, commitment);
  const rolled = random.integer(10_000) / 100;
  const chance = params.condition === 'over' ? 100 - params.target : params.target;
  const won = params.condition === 'over' ? rolled > params.target : rolled < params.target;
  const multiplier = won ? 99 / chance : 0;
  return { ...standardResult('dice', wager, wager * multiplier, multiplier, { rolled, condition: params.condition, target: params.target }, random.proof), rolled };
};
