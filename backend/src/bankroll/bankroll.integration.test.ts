import assert from 'node:assert/strict';
import test, { after, before, beforeEach } from 'node:test';
import mongoose from 'mongoose';
import { authorizeExposure, getAggregatedExposure, releaseExposure, settleExposure } from './exposure/exposure.service';
import { Exposure } from './exposure/exposure.model';
import { ProviderState } from './providerState.model';
import { assertCircuitAllows, recordProviderFailure, recordProviderSuccess } from './circuitBreaker.service';

const mongoUri = process.env.LEDGER_TEST_MONGO_URI;
if (!mongoUri) throw new Error('LEDGER_TEST_MONGO_URI is required');

before(async () => {
  process.env.BANKROLL_PROVIDER = 'internal';
  process.env.BANKROLL_INTERNAL_TEST_MODE = 'enabled';
  process.env.NODE_ENV = 'test';
  const isolatedUri = mongoUri.replace('/casino_ledger_test?', '/casino_bankroll_test?');
  await mongoose.connect(isolatedUri);
});

beforeEach(async () => {
  await Promise.all([Exposure.deleteMany({}), ProviderState.deleteMany({})]);
});

after(async () => { await mongoose.disconnect(); });

test('exposure authorization is idempotent and rejects a changed payload', async () => {
  const request = { betId: 'exposure-idempotent', game: 'dice', currency: 'SOL', stakeMinor: 1_000n, maxPayoutMinor: 2_000n };
  const first = await authorizeExposure(request);
  const retry = await authorizeExposure(request);
  assert.equal(first?._id.toString(), retry?._id.toString());
  await assert.rejects(() => authorizeExposure({ ...request, maxPayoutMinor: 2_001n }), /payload mismatch/);
  assert.equal(await Exposure.countDocuments({ betId: request.betId }), 1);
});

test('confirmed settlement is idempotent and cannot exceed reserved payout', async () => {
  const request = { betId: 'exposure-settle', game: 'dice', currency: 'SOL', stakeMinor: 1_000n, maxPayoutMinor: 2_000n };
  await authorizeExposure(request);
  await assert.rejects(() => settleExposure(request.betId, 2_001n, { roll: 5 }), /exceeds/);
  const first = await settleExposure(request.betId, 1_500n, { roll: 5 });
  const retry = await settleExposure(request.betId, 1_500n, { roll: 5 });
  assert.equal(first?.status, 'SETTLED');
  assert.equal(retry?.status, 'SETTLED');
  await assert.rejects(() => settleExposure(request.betId, 1_499n, { roll: 5 }), /payload mismatch/);
});

test('release and aggregate exposure preserve lifecycle state', async () => {
  await authorizeExposure({ betId: 'active', game: 'dice', currency: 'SOL', stakeMinor: 1_000n, maxPayoutMinor: 2_000n });
  await authorizeExposure({ betId: 'released', game: 'dice', currency: 'SOL', stakeMinor: 1_000n, maxPayoutMinor: 3_000n });
  await releaseExposure('released');
  const aggregate = await getAggregatedExposure();
  assert.equal(aggregate.length, 1);
  assert.equal(aggregate[0].count, 1);
  assert.equal(aggregate[0].reservedPayoutMinor.toString(), '2000');
  assert.equal((await Exposure.findOne({ betId: 'released' }))?.status, 'RELEASED');
});

test('circuit breaker opens after repeated provider failures and closes after success', async () => {
  await recordProviderFailure('internal', new Error('one'));
  await recordProviderFailure('internal', new Error('two'));
  await assertCircuitAllows('internal');
  await recordProviderFailure('internal', new Error('three'));
  await assert.rejects(() => assertCircuitAllows('internal'), /circuit breaker is open/);
  await recordProviderSuccess('internal');
  await assertCircuitAllows('internal');
  assert.equal((await ProviderState.findOne({ provider: 'internal' }))?.circuit, 'CLOSED');
});
