import assert from 'node:assert/strict';
import test from 'node:test';
import { playCoinflip } from './coinflip.service';
import { playDice } from './dice.service';
import { playPlinko } from './plinko.service';
import { playRoulette } from './roulette.service';
import { verifyGameResult } from './fairnessVerifier';
import { maxMultiplierFor, PLINKO_TABLES, validators } from './gameRegistry';
import { playLimbo } from './limbo.service';
import { createFairRandom } from './fairness';
import { freshDeck, handValue, shuffleDeck } from './blackjack.service';
import { crashMultiplierAt } from './crash.service';

test('all instant games return internally verifiable fairness proofs', async () => {
  const results = await Promise.all([
    playCoinflip(0.001, { side: 'heads', clientSeed: 'unit-coin', nonce: 1 }),
    playDice(0.001, { target: 50, condition: 'over', clientSeed: 'unit-dice', nonce: 2 }),
    playPlinko(0.001, { rows: 16, risk: 'High', clientSeed: 'unit-plinko', nonce: 3 }),
    playRoulette(0.001, { color: 'green', clientSeed: 'unit-roulette', nonce: 4 })
    ,playLimbo(0.001, { targetMultiplier: 2, clientSeed: 'unit-limbo', nonce: 5 })
  ]);
  for (const result of results) {
    assert.equal(verifyGameResult(result), true, result.game);
    assert.equal(result.payout, result.wager * result.multiplier);
    assert.equal(result.profit, result.payout - result.wager);
  }
});

test('every Plinko table has a mathematically verified RTP close to 99%', () => {
  const choose = (n: number, k: number) => {
    let value = 1;
    for (let i = 1; i <= k; i++) value = value * (n - i + 1) / i;
    return value;
  };
  for (const tables of Object.values(PLINKO_TABLES)) {
    for (const [rowsText, multipliers] of Object.entries(tables)) {
      const rows = Number(rowsText);
      const rtp = (multipliers as readonly number[]).reduce((sum: number, multiplier: number, bucket: number) => sum + multiplier * choose(rows, bucket) / (2 ** rows), 0);
      assert.ok(rtp >= 0.987 && rtp <= 0.991, `${rows} rows produced RTP ${rtp}`);
    }
  }
});

test('tampering with an outcome, payout, or seed invalidates the proof', async () => {
  const result = await playDice(0.001, { target: 50, condition: 'under', clientSeed: 'tamper-test', nonce: 7 });
  assert.equal(verifyGameResult({ ...result, payout: result.payout + 1 }), false);
  assert.equal(verifyGameResult({ ...result, outcome: { ...result.outcome, rolled: result.outcome.rolled + 0.01 } }), false);
  assert.equal(verifyGameResult({ ...result, proof: { ...result.proof, serverSeed: 'f'.repeat(64) } }), false);
});

test('registry validates every supported configuration and calculates authoritative exposure', () => {
  assert.equal(maxMultiplierFor('coinflip', { side: 'heads' }), 1.98);
  assert.equal(maxMultiplierFor('roulette', { color: 'green' }), 36);
  assert.equal(maxMultiplierFor('plinko', { rows: 16, risk: 'High' }), 1000);
  assert.equal(maxMultiplierFor('limbo', { targetMultiplier: 25 }), 25);
  assert.equal(maxMultiplierFor('crash', { autoCashout: 10 }), 10);
  assert.equal(maxMultiplierFor('blackjack', {}), 2.5);
  assert.ok(maxMultiplierFor('mines', { bombCount: 3 }) > 1);
  assert.throws(() => validators.dice(1, { target: 0, condition: 'over' }), /target/);
  assert.throws(() => validators.plinko(1, { rows: 10, risk: 'low' }), /rows/);
  assert.throws(() => validators.roulette(1, { color: 'blue' }), /color/);
  assert.throws(() => validators.mines(1, { bombCount: 25 }), /bombCount/);
});

test('Blackjack deck and hand scoring are deterministic and complete', () => {
  const first = shuffleDeck(createFairRandom('blackjack-vector', 1, 'a'.repeat(64)));
  const second = shuffleDeck(createFairRandom('blackjack-vector', 1, 'a'.repeat(64)));
  assert.deepEqual(first, second);
  assert.equal(new Set(first).size, 52);
  assert.deepEqual(new Set(first), new Set(freshDeck()));
  assert.equal(handValue(['AS', 'KH']).value, 21);
  assert.equal(handValue(['AS', 'AH', '9D']).value, 21);
  assert.equal(handValue(['KS', 'QH', '2D']).value, 22);
});

test('Crash live multiplier is monotonic and doubles in ten seconds', () => {
  const start = new Date('2026-01-01T00:00:00.000Z');
  assert.equal(crashMultiplierAt(start, start), 1);
  assert.equal(crashMultiplierAt(start, new Date(start.getTime() + 10_000)), 2);
  assert.ok(crashMultiplierAt(start, new Date(start.getTime() + 20_000)) >= 4);
});
