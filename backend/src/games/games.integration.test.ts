import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import { AddressInfo } from 'node:net';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { app } from '../server';
import { User } from '../models/User';
import { migrateLegacyTestBalances } from '../ledger/migrateLegacyBalances.service';
import { getJwtSecret } from '../config/env';
import { CrashRound } from '../models/CrashRound';
import { advanceCrashRound } from './crash.service';
import { attachCrashRealtime } from './crashRealtime';
import WebSocket from 'ws';

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

test('HTTP lifecycle settles and publicly verifies all eight Originals', async () => {
  const instantCases = [
    ['coinflip', { side: 'heads', clientSeed: 'e2e-coin', nonce: 1 }],
    ['dice', { target: 50, condition: 'over', clientSeed: 'e2e-dice', nonce: 2 }],
    ['plinko', { rows: 16, risk: 'High', clientSeed: 'e2e-plinko', nonce: 3 }],
    ['roulette', { color: 'green', clientSeed: 'e2e-roulette', nonce: 4 }]
    ,['limbo', { targetMultiplier: 2, clientSeed: 'e2e-limbo', nonce: 6 }]
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

  const blackjackBetId = 'phase4:blackjack:00';
  let blackjack = await postPlay({
    game: 'blackjack', betAmount: 0.001, params: await committed({ clientSeed: 'e2e-blackjack', nonce: 7 }),
    action: 'bet', idempotencyKey: blackjackBetId
  });
  if (blackjack.result.outcome.status === 'active') {
    blackjack = await postPlay({
      game: 'blackjack', betAmount: 0, params: { sessionId: blackjack.result.sessionId },
      action: 'stand', idempotencyKey: 'phase4:blackjack:stand'
    });
  }
  assert.notEqual(blackjack.result.outcome.status, 'active');
  await assertPublicProof(blackjackBetId);

  const roundResponse = await fetch(`${origin}/api/crash/round`);
  const publicRound: any = await roundResponse.json();
  assert.equal(roundResponse.status, 200);
  const crashBetId = 'phase4:crash:0000';
  const crashBetResponse = await fetch(`${origin}/api/crash/bet`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ roundId: publicRound.roundId, betAmount: 0.001, autoCashout: 2, idempotencyKey: crashBetId })
  });
  assert.equal(crashBetResponse.status, 201, JSON.stringify(await crashBetResponse.clone().json()));
  const storedRound = await CrashRound.findOne({ roundId: publicRound.roundId }).select('+serverSeed +crashMultiplier');
  assert.ok(storedRound);
  const startedAt = new Date(storedRound!.bettingClosesAt.getTime() + 1);
  await advanceCrashRound(startedAt);
  await advanceCrashRound(new Date(startedAt.getTime() + 5 * 60_000));
  await assertPublicProof(crashBetId);

  const sockets = attachCrashRealtime(server);
  const streamed: any = await new Promise((resolve, reject) => {
    const client = new WebSocket(`ws://127.0.0.1:${(server.address() as AddressInfo).port}/api/crash/stream`);
    const timeout = setTimeout(() => reject(new Error('Crash WebSocket timed out')), 3_000);
    client.once('message', data => { clearTimeout(timeout); const value = JSON.parse(data.toString()); client.close(); resolve(value); });
    client.once('error', reject);
  });
  assert.equal(streamed.roundId, publicRound.roundId);
  await new Promise<void>(resolve => sockets.close(() => resolve()));
});
