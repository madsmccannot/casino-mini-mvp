import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import { AddressInfo } from 'node:net';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { app } from '../server';
import { User } from '../models/User';
import { migrateLegacyTestBalances } from '../ledger/migrateLegacyBalances.service';
import { getJwtSecret } from '../config/env';

const baseUri = process.env.LEDGER_TEST_MONGO_URI;
if (!baseUri) throw new Error('LEDGER_TEST_MONGO_URI is required');
let server: ReturnType<typeof app.listen>;
let origin: string;
let token: string;

before(async () => {
  process.env.BANKROLL_PROVIDER = 'internal';
  process.env.BANKROLL_INTERNAL_TEST_MODE = 'enabled';
  process.env.NODE_ENV = 'test';
  await mongoose.connect(baseUri.replace('/casino_ledger_test?', '/casino_games_test?'));
  await mongoose.connection.dropDatabase();
  const user = await User.create({ walletAddress: 'phase3-e2e-user', balance: 10 });
  const migration = await migrateLegacyTestBalances();
  assert.equal(migration.errors.length, 0);
  token = jwt.sign(
    { id: user._id.toString(), walletAddress: user.walletAddress },
    getJwtSecret(),
    { expiresIn: '5m', algorithm: 'HS256', issuer: 'casino-mini-mvp', audience: 'casino-mini-mvp-web' }
  );
  server = app.listen(0);
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  await mongoose.disconnect();
});

const postPlay = async (body: unknown) => {
  const response = await fetch(`${origin}/api/play`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify(body)
  });
  const payload: any = await response.json();
  assert.equal(response.status, 200, JSON.stringify(payload));
  return payload;
};

const committed = async (params: any) => {
  const response = await fetch(`${origin}/api/fairness/commit`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ clientSeed: params.clientSeed, nonce: params.nonce })
  });
  const payload: any = await response.json();
  assert.equal(response.status, 201, JSON.stringify(payload));
  return { ...params, fairnessCommitId: payload.commitId };
};

const assertPublicProof = async (betId: string) => {
  const response = await fetch(`${origin}/api/fairness/${betId}`);
  const payload: any = await response.json();
  assert.equal(response.status, 200, JSON.stringify(payload));
  assert.equal(payload.verified, true);
};

test('HTTP lifecycle settles and publicly verifies all five existing games', async () => {
  const instantCases = [
    ['coinflip', { side: 'heads', clientSeed: 'e2e-coin', nonce: 1 }],
    ['dice', { target: 50, condition: 'over', clientSeed: 'e2e-dice', nonce: 2 }],
    ['plinko', { rows: 16, risk: 'High', clientSeed: 'e2e-plinko', nonce: 3 }],
    ['roulette', { color: 'green', clientSeed: 'e2e-roulette', nonce: 4 }]
  ] as const;
  for (const [index, [game, params]] of instantCases.entries()) {
    const betId = `phase3:${game}:000${index}`;
    const committedParams = await committed(params);
    const payload = await postPlay({ game, betAmount: 0.001, params: committedParams, action: 'bet', idempotencyKey: betId });
    assert.equal(payload.result.game, game);
    assert.equal(typeof payload.newBalance, 'number');
    await assertPublicProof(betId);
    if (index === 0) {
      const replay = await fetch(`${origin}/api/play`, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ game, betAmount: 0.001, params: committedParams, action: 'bet', idempotencyKey: 'phase3:commit:replay' })
      });
      assert.equal(replay.status, 400);
      assert.match(JSON.stringify(await replay.json()), /already used/);
    }
  }

  const minesBetId = 'phase3:mines:00000';
  const started = await postPlay({
    game: 'mines', betAmount: 0.001,
    params: await committed({ bombCount: 1, clientSeed: 'e2e-mines', nonce: 5 }), action: 'bet', idempotencyKey: minesBetId
  });
  let terminal = await postPlay({
    game: 'mines', betAmount: 0, params: { sessionId: started.result.sessionId, tileIndex: 0 },
    action: 'reveal', idempotencyKey: 'phase3:mines:reveal'
  });
  if (terminal.result.outcome.status === 'gem') {
    terminal = await postPlay({
      game: 'mines', betAmount: 0, params: { sessionId: started.result.sessionId },
      action: 'cashout', idempotencyKey: 'phase3:mines:cashout'
    });
  }
  assert.ok(['boom', 'cashout'].includes(terminal.result.outcome.status));
  await assertPublicProof(minesBetId);
});
