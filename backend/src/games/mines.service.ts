import { randomBytes } from 'node:crypto';
import { GameSession } from '../models/GameSession';
import { createFairRandom } from './fairness';
import { standardResult } from './game.types';
import { validators } from './gameRegistry';

const calculateMultiplier = (bombCount: number, revealedCount: number) => {
  let multiplier = 1;
  for (let i = 0; i < revealedCount; i++) multiplier *= (25 - i) / (25 - bombCount - i);
  return multiplier * 0.99;
};

const proofFor = (session: any) => createFairRandom(session.clientSeed || 'default', session.nonce || 0, session.serverSeed).proof;

export const minesService = {
  startGame: async (userId: string, betId: string, wager: number, raw: unknown, commitment: { serverSeed: string; commitId: string; committedAt: string }) => {
    const params = validators.mines(wager, raw);
    const random = createFairRandom(params.clientSeed, params.nonce, commitment.serverSeed, commitment);
    const available = Array.from({ length: 25 }, (_, index) => index);
    const bombs: number[] = [];
    for (let i = 0; i < params.bombCount; i++) bombs.push(available.splice(random.integer(available.length), 1)[0]);
    bombs.sort((a, b) => a - b);
    const sessionId = randomBytes(16).toString('hex');
    await GameSession.create({
      userId, betId, sessionId, game: 'mines', wager, active: true,
      state: { bombs, revealed: [], bombCount: params.bombCount },
      serverSeed: random.proof.serverSeed, commitHash: random.proof.commitHash,
      clientSeed: random.proof.clientSeed, nonce: random.proof.nonce
    });
    return {
      ...standardResult('mines', wager, 0, 1, { status: 'active', revealed: [] }, { ...random.proof, serverSeed: '0'.repeat(64) }),
      serverSeed: 'hidden', proof: { ...random.proof, serverSeed: 'hidden' }, sessionId, betId
    };
  },

  reveal: async (userId: string, params: { sessionId: string; tileIndex: number }) => {
    if (!params || !/^[a-f0-9]{32}$/.test(params.sessionId) || !Number.isInteger(params.tileIndex) || params.tileIndex < 0 || params.tileIndex > 24) {
      throw new Error('Invalid Mines reveal parameters');
    }
    const session = await GameSession.findOne({ sessionId: params.sessionId, userId, active: true });
    if (!session) throw new Error('Game not found or finished');
    if (session.state.revealed.includes(params.tileIndex)) throw new Error('Tile already revealed');
    const proof = proofFor(session);
    if (session.state.bombs.includes(params.tileIndex)) {
      session.active = false;
      await session.save();
      return { ...standardResult('mines', session.wager, 0, 0, { status: 'boom', bombs: session.state.bombs, active: false }, proof), betId: session.betId };
    }
    session.state.revealed.push(params.tileIndex);
    session.markModified('state.revealed');
    await session.save();
    const multiplier = calculateMultiplier(session.state.bombCount, session.state.revealed.length);
    return {
      ...standardResult('mines', session.wager, 0, multiplier, { status: 'gem', multiplier, active: true, revealed: session.state.revealed }, { ...proof, serverSeed: '0'.repeat(64) }),
      serverSeed: 'hidden', proof: { ...proof, serverSeed: 'hidden' }, betId: session.betId
    };
  },

  cashout: async (userId: string, params: { sessionId: string }) => {
    if (!params || !/^[a-f0-9]{32}$/.test(params.sessionId)) throw new Error('Invalid Mines cashout parameters');
    const session = await GameSession.findOne({ sessionId: params.sessionId, userId, active: true });
    if (!session) throw new Error('Game not found or finished');
    if (session.state.revealed.length === 0) throw new Error('Reveal at least one safe tile before cashout');
    const multiplier = calculateMultiplier(session.state.bombCount, session.state.revealed.length);
    session.active = false;
    await session.save();
    const payout = session.wager * multiplier;
    return {
      ...standardResult('mines', session.wager, payout, multiplier, { status: 'cashout', bombs: session.state.bombs, active: false, revealed: session.state.revealed }, proofFor(session)),
      betId: session.betId
    };
  }
};
