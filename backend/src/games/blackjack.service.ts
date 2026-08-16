import { randomBytes } from 'node:crypto';
import { BlackjackSession } from '../models/BlackjackSession';
import { createFairRandom, FairRandom } from './fairness';
import { standardResult } from './game.types';
import { validators } from './gameRegistry';

const SUITS = ['S', 'H', 'D', 'C'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const freshDeck = () => SUITS.flatMap(suit => RANKS.map(rank => `${rank}${suit}`));

export const shuffleDeck = (random: FairRandom) => {
  const deck = freshDeck();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = random.integer(i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

export const handValue = (cards: string[]) => {
  let value = 0;
  let aces = 0;
  for (const card of cards) {
    const rank = card.slice(0, -1);
    if (rank === 'A') { value += 11; aces++; }
    else if (['J', 'Q', 'K'].includes(rank)) value += 10;
    else value += Number(rank);
  }
  while (value > 21 && aces > 0) { value -= 10; aces--; }
  return { value, soft: aces > 0 };
};

const proofFor = (session: any) => createFairRandom(session.clientSeed, session.nonce, session.serverSeed, { commitId: session.commitId, committedAt: new Date(session.committedAt).toISOString() }).proof;
const visible = (session: any, terminal: boolean) => ({
  playerCards: session.playerCards,
  dealerCards: terminal ? session.dealerCards : [session.dealerCards[0], 'hidden'],
  playerValue: handValue(session.playerCards).value,
  dealerValue: terminal ? handValue(session.dealerCards).value : undefined
});

const result = (session: any, status: string, multiplier: number, terminal: boolean) => {
  const proof = proofFor(session);
  const base = standardResult('blackjack', session.wager, session.wager * multiplier, multiplier, { status, ...visible(session, terminal) }, terminal ? proof : { ...proof, serverSeed: '0'.repeat(64) });
  return { ...base, serverSeed: terminal ? proof.serverSeed : 'hidden', proof: terminal ? proof : { ...proof, serverSeed: 'hidden' }, sessionId: session.sessionId, betId: session.betId };
};

const dealerPlay = (session: any) => {
  while (handValue(session.dealerCards).value < 17) session.dealerCards.push(session.deck[session.deckIndex++]);
};

const settleStanding = (session: any) => {
  dealerPlay(session);
  const player = handValue(session.playerCards).value;
  const dealer = handValue(session.dealerCards).value;
  session.active = false;
  if (dealer > 21 || player > dealer) return ['win', 2] as const;
  if (player === dealer) return ['push', 1] as const;
  return ['loss', 0] as const;
};

const loadSession = (userId: string, sessionId: string) => {
  if (!/^[a-f0-9]{32}$/.test(sessionId)) throw new Error('Invalid Blackjack session ID');
  return BlackjackSession.findOne({ userId, sessionId }).select('+deck +serverSeed');
};

const finalize = async (session: any, status: string, multiplier: number) => {
  session.active = false;
  const terminal = result(session, status, multiplier, true);
  session.terminalResult = terminal;
  await session.save();
  return terminal;
};

export const blackjackService = {
  resume: async (userId: string, betId: string) => {
    const session = await BlackjackSession.findOne({ userId, betId }).select('+deck +serverSeed');
    if (!session) return null;
    if (!session.active && session.terminalResult) return session.terminalResult;
    if (!session.active) return null;
    return result(session, 'active', 0, false);
  },
  start: async (userId: string, betId: string, wager: number, raw: unknown, commitment: { serverSeed: string; commitId: string; committedAt: string }) => {
    const params = validators.blackjack(wager, raw);
    const random = createFairRandom(params.clientSeed, params.nonce, commitment.serverSeed, commitment);
    const deck = shuffleDeck(random);
    const session = await BlackjackSession.create({
      userId, betId, sessionId: randomBytes(16).toString('hex'), wager, active: true, deck, deckIndex: 4,
      playerCards: [deck[0], deck[2]], dealerCards: [deck[1], deck[3]],
      serverSeed: random.proof.serverSeed, commitHash: random.proof.commitHash, clientSeed: random.proof.clientSeed, nonce: random.proof.nonce
      ,commitId: commitment.commitId, committedAt: new Date(commitment.committedAt)
    });
    const playerBlackjack = handValue(session.playerCards).value === 21;
    const dealerBlackjack = handValue(session.dealerCards).value === 21;
    if (playerBlackjack || dealerBlackjack) {
      if (playerBlackjack && dealerBlackjack) return finalize(session, 'push', 1);
      return finalize(session, playerBlackjack ? 'blackjack' : 'loss', playerBlackjack ? 2.5 : 0);
    }
    return result(session, 'active', 0, false);
  },

  hit: async (userId: string, sessionId: string) => {
    const session = await loadSession(userId, sessionId);
    if (!session) throw new Error('Blackjack game not found');
    if (!session.active) {
      if (session.terminalResult) return session.terminalResult;
      throw new Error('Blackjack game is finished');
    }
    session.playerCards.push(session.deck[session.deckIndex++]);
    const value = handValue(session.playerCards).value;
    if (value > 21) {
      return finalize(session, 'bust', 0);
    }
    if (value === 21) {
      const [status, multiplier] = settleStanding(session);
      return finalize(session, status, multiplier);
    }
    await session.save();
    return result(session, 'active', 0, false);
  },

  stand: async (userId: string, sessionId: string) => {
    const session = await loadSession(userId, sessionId);
    if (!session) throw new Error('Blackjack game not found');
    if (!session.active) {
      if (session.terminalResult) return session.terminalResult;
      throw new Error('Blackjack game is finished');
    }
    const [status, multiplier] = settleStanding(session);
    return finalize(session, status, multiplier);
  }
};
