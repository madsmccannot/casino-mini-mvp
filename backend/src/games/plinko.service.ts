import { createFairRandom } from './fairness';
import { standardResult } from './game.types';
import { PLINKO_TABLES, validators } from './gameRegistry';

export const playPlinko = async (wager: number, raw: unknown, commitment?: { serverSeed: string; commitId: string; committedAt: string }) => {
  const params = validators.plinko(wager, raw);
  const random = createFairRandom(params.clientSeed, params.nonce, commitment?.serverSeed, commitment);
  const path = Array.from({ length: params.rows }, () => random.integer(2));
  const bucket = path.reduce((sum, direction) => sum + direction, 0);
  const multiplier = PLINKO_TABLES[params.risk][params.rows][bucket];
  return standardResult('plinko', wager, wager * multiplier, multiplier, { path, bucket, risk: params.risk, rows: params.rows }, random.proof);
};
