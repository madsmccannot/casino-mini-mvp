import { createFairRandom } from './fairness';
import { standardResult } from './game.types';
import { validators } from './gameRegistry';

const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export const rouletteColor = (number: number) => number === 0 ? 'green' : RED.has(number) ? 'red' : 'black';

export const playRoulette = async (wager: number, raw: unknown, commitment?: { serverSeed: string; commitId: string; committedAt: string }) => {
  const params = validators.roulette(wager, raw);
  const random = createFairRandom(params.clientSeed, params.nonce, commitment?.serverSeed, commitment);
  const number = random.integer(37);
  const color = rouletteColor(number);
  const multiplier = color === params.color ? (color === 'green' ? 36 : 2) : 0;
  return standardResult('roulette', wager, wager * multiplier, multiplier, { number, color, selection: params.color }, random.proof);
};
