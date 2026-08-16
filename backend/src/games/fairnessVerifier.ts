import { createFairRandom, verifyCommitment } from './fairness';
import { PLINKO_TABLES, PlinkoRisk, PlinkoRows } from './gameRegistry';
import { rouletteColor } from './roulette.service';
import { limboOutcome } from './limbo.service';
import { handValue, shuffleDeck } from './blackjack.service';

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
    case 'limbo': {
      const value = limboOutcome(random.integer(0x1_0000_0000));
      expectedMultiplier = value >= result.outcome.targetMultiplier ? result.outcome.targetMultiplier : 0;
      if (!close(result.outcome.resultMultiplier, value)) return false;
      break;
    }
    case 'blackjack': {
      const deck = shuffleDeck(random);
      const playerCards = result.outcome.playerCards;
      const dealerCards = result.outcome.dealerCards;
      if (!Array.isArray(playerCards) || !Array.isArray(dealerCards) || dealerCards.includes('hidden')) return false;
      const expectedPlayer = [deck[0], deck[2], ...deck.slice(4, 4 + Math.max(0, playerCards.length - 2))];
      const dealerStart = 4 + Math.max(0, playerCards.length - 2);
      const expectedDealer = [deck[1], deck[3], ...deck.slice(dealerStart, dealerStart + Math.max(0, dealerCards.length - 2))];
      if (JSON.stringify(playerCards) !== JSON.stringify(expectedPlayer) || JSON.stringify(dealerCards) !== JSON.stringify(expectedDealer)) return false;
      const player = handValue(playerCards).value;
      const dealer = handValue(dealerCards).value;
      if (player > 21) expectedMultiplier = 0;
      else if (playerCards.length === 2 && player === 21) expectedMultiplier = dealerCards.length === 2 && dealer === 21 ? 1 : 2.5;
      else if (dealer > 21 || player > dealer) expectedMultiplier = 2;
      else if (player === dealer) expectedMultiplier = 1;
      else expectedMultiplier = 0;
      if (result.outcome.playerValue !== player || result.outcome.dealerValue !== dealer) return false;
      break;
    }
    case 'crash': {
      const crashMultiplier = Math.max(1, limboOutcome(random.integer(0x1_0000_0000)));
      if (result.outcome.status === 'cashed_out') {
        expectedMultiplier = result.multiplier;
        if (expectedMultiplier < 1 || expectedMultiplier > result.outcome.autoCashout || expectedMultiplier > crashMultiplier) return false;
      } else {
        expectedMultiplier = 0;
        if (result.outcome.status !== 'crashed' || crashMultiplier >= result.outcome.autoCashout) return false;
      }
      if (!close(result.outcome.crashMultiplier, crashMultiplier) || proof.clientSeed !== result.outcome.roundId) return false;
      break;
    }
    default: return false;
  }
  return close(result.multiplier, expectedMultiplier) && close(result.payout, result.wager * expectedMultiplier);
};
