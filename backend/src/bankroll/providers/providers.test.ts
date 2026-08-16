import assert from 'node:assert/strict';
import test from 'node:test';
import { InternalProvider } from './InternalProvider';
import { WinrProvider } from './WinrProvider';

test('WINR provider fails closed without a verified transport', async () => {
  const provider = new WinrProvider();
  assert.equal((await provider.getHealth()).state, 'DISABLED');
  await assert.rejects(() => provider.getLimits('dice', 'SOL'), /not configured/);
});

test('internal provider is disabled unless explicitly enabled and never runs in production', async () => {
  const previousMode = process.env.BANKROLL_INTERNAL_TEST_MODE;
  const previousNodeEnv = process.env.NODE_ENV;
  try {
    delete process.env.BANKROLL_INTERNAL_TEST_MODE;
    await assert.rejects(() => new InternalProvider().getLimits('dice', 'SOL'), /restricted/);
    process.env.BANKROLL_INTERNAL_TEST_MODE = 'enabled';
    process.env.NODE_ENV = 'production';
    await assert.rejects(() => new InternalProvider().getLimits('dice', 'SOL'), /restricted/);
  } finally {
    if (previousMode === undefined) delete process.env.BANKROLL_INTERNAL_TEST_MODE; else process.env.BANKROLL_INTERNAL_TEST_MODE = previousMode;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousNodeEnv;
  }
});

test('internal provider enforces limits and settlement idempotency', async () => {
  const previousMode = process.env.BANKROLL_INTERNAL_TEST_MODE;
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.BANKROLL_INTERNAL_TEST_MODE = 'enabled';
  process.env.NODE_ENV = 'test';
  try {
    const provider = new InternalProvider();
    const request = { betId: 'bet-1', game: 'dice', currency: 'SOL', stakeMinor: 1n, maxPayoutMinor: 10n };
    await provider.reserveExposure(request);
    const settlementRequest = { ...request, payoutMinor: 2n, resultHash: 'hash' };
    const first = await provider.submitSettlement(settlementRequest);
    const retry = await provider.submitSettlement(settlementRequest);
    assert.deepEqual(retry, first);
    await assert.rejects(() => provider.reserveExposure({ ...request, betId: 'too-large', maxPayoutMinor: 2_000_000_000n }), /exceeds/);
  } finally {
    if (previousMode === undefined) delete process.env.BANKROLL_INTERNAL_TEST_MODE; else process.env.BANKROLL_INTERNAL_TEST_MODE = previousMode;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousNodeEnv;
  }
});
