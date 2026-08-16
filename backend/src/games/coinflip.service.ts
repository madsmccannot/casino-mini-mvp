import { createFairRandom } from './fairness';
import { standardResult } from './game.types';
import { validators } from './gameRegistry';

export const playCoinflip = async (wager: number, raw: unknown, commitment?: { serverSeed: string; commitId: string; committedAt: string }) => {
  const params = validators.coinflip(wager, raw);
  const random = createFairRandom(params.clientSeed, params.nonce, commitment?.serverSeed, commitment);
  const outcome = random.integer(2) === 0 ? 'heads' : 'tails';
  const multiplier = outcome === params.side ? 1.98 : 0;
  return standardResult('coinflip', wager, wager * multiplier, multiplier, { result: outcome, selection: params.side }, random.proof);
};
