import { createFairRandom, verifyCommitment } from './fairness';
import { PLINKO_TABLES, PlinkoRisk, PlinkoRows } from './gameRegistry';
import { rouletteColor } from './roulette.service';

const close = (a: number, b: number) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 1e-9;

export const verifyGameResult = (result: any): boolean => {
  const proof = result?.proof;
  if (!proof || proof.serverSeed === 'hidden' || !verifyCommitment(proof)) return false;
  const random = createFairRandom(proof.clientSeed, proof.nonce, proof.serverSeed);
  let expectedOutcome: any;
  let expectedMultiplier = 0;
  switch (result.game) {
    case 'coinflip': {
      const value = random.integer(2) === 0 ? 'heads' : 'tails';
      expectedOutcome = value;
      expectedMultiplier = value === result.outcome.selection ? 1.98 : 0;
      if (result.outcome.result !== value) return false;
      break;
    }
    case 'dice': {
      const rolled = random.integer(10_000) / 100;
      const { target, condition } = result.outcome;
      const chance = condition === 'over' ? 100 - target : target;
      const won = condition === 'over' ? rolled > target : rolled < target;
      expectedMultiplier = won ? 99 / chance : 0;
      if (!close(result.outcome.rolled, rolled)) return false;
      break;
    }
    case 'plinko': {
      const rows = result.outcome.rows as PlinkoRows;
      const risk = result.outcome.risk as PlinkoRisk;
      const path = Array.from({ length: rows }, () => random.integer(2));
      const bucket = path.reduce((sum, direction) => sum + direction, 0);
      expectedMultiplier = PLINKO_TABLES[risk][rows][bucket];
      if (JSON.stringify(result.outcome.path) !== JSON.stringify(path) || result.outcome.bucket !== bucket) return false;
      break;
    }
    case 'roulette': {
      const number = random.integer(37);
      const color = rouletteColor(number);
      expectedMultiplier = color === result.outcome.selection ? (color === 'green' ? 36 : 2) : 0;
      if (result.outcome.number !== number || result.outcome.color !== color) return false;
      break;
    }
    case 'mines': {
      const bombCount = result.outcome.bombs?.length;
      if (!Number.isInteger(bombCount)) return false;
      const available = Array.from({ length: 25 }, (_, index) => index);
      const bombs: number[] = [];
      for (let i = 0; i < bombCount; i++) bombs.push(available.splice(random.integer(available.length), 1)[0]);
      bombs.sort((a, b) => a - b);
      if (JSON.stringify(result.outcome.bombs) !== JSON.stringify(bombs)) return false;
      if (result.outcome.status === 'boom') expectedMultiplier = 0;
      else {
        const revealedCount = result.outcome.revealed?.length;
        if (!Number.isInteger(revealedCount) || revealedCount < 1 || revealedCount > 25 - bombCount) return false;
        expectedMultiplier = 1;
        for (let i = 0; i < revealedCount; i++) expectedMultiplier *= (25 - i) / (25 - bombCount - i);
        expectedMultiplier *= 0.99;
      }
      break;
    }
    default: return false;
  }
  return close(result.multiplier, expectedMultiplier) && close(result.payout, result.wager * expectedMultiplier);
};
