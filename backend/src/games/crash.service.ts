import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { Bet } from '../models/Bet';
import { CrashRound } from '../models/CrashRound';
import { CrashWager } from '../models/CrashWager';
import { authorizeBetBankroll, releaseBetBankroll, settleBetBankroll } from '../bankroll/betBankroll.service';
import { refundCasinoBet, reserveCasinoBet, settleCasinoBet } from '../ledger/casinoLedger.service';
import { riskEngine } from '../bankroll/riskEngine';
import { createFairRandom } from './fairness';
import { standardResult } from './game.types';
import { validators } from './gameRegistry';
import { standardizedStats } from './gameExecutor';
import { limboOutcome } from './limbo.service';

const BETTING_MS = 5_000;
const INTERMISSION_MS = 2_000;
const GROWTH_PER_MS = Math.log(2) / 10_000;

export const crashMultiplierAt = (startedAt: Date, now = new Date()) =>
  Math.max(1, Math.floor(Math.exp(Math.max(0, now.getTime() - startedAt.getTime()) * GROWTH_PER_MS) * 100) / 100);

export const createCrashRound = async (now = new Date()) => {
  const existing = await CrashRound.findOne({ status: { $in: ['BETTING', 'RUNNING'] } });
  if (existing) return existing;
  const serverSeed = randomBytes(32).toString('hex');
  const roundId = randomUUID();
  const random = createFairRandom(roundId, 0, serverSeed);
  try {
    return await CrashRound.create({
      roundId, serverSeed, commitHash: createHash('sha256').update(serverSeed).digest('hex'), activeSlot: 'GLOBAL',
      crashMultiplier: Math.max(1, limboOutcome(random.integer(0x1_0000_0000))), status: 'BETTING',
      bettingClosesAt: new Date(now.getTime() + BETTING_MS)
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      const raced = await CrashRound.findOne({ activeSlot: 'GLOBAL' });
      if (raced) return raced;
    }
    throw error;
  }
};

export const publicCrashRound = (round: any, now = new Date()) => ({
  roundId: round.roundId, status: round.status, commitHash: round.commitHash,
  bettingClosesAt: round.bettingClosesAt, startedAt: round.startedAt,
  multiplier: round.status === 'RUNNING' ? crashMultiplierAt(round.startedAt, now) : round.status === 'CRASHED' ? round.crashMultiplier : 1,
  ...(round.status === 'CRASHED' ? { serverSeed: round.serverSeed, crashMultiplier: round.crashMultiplier } : {})
});

export const placeCrashWager = async (ownerId: Types.ObjectId, betId: string, roundId: string, wager: number, raw: unknown) => {
  const params = validators.crash(wager, raw);
  const matches = (value: any) => value.userId.toString() === ownerId.toString() && value.roundId === roundId && value.wager === wager && value.autoCashout === params.autoCashout;
  const existing = await CrashWager.findOne({ betId });
  if (existing) {
    if (!matches(existing)) throw new Error('Crash bet idempotency payload mismatch');
    if (existing.status === 'PREPARING') throw new Error('Crash bet is still being prepared');
    return { betId, roundId, autoCashout: params.autoCashout };
  }
  const validation = await riskEngine.validateBet('crash', wager, params.autoCashout);
  if (validation !== true) throw new Error(validation);
  const round = await CrashRound.findOne({ roundId, status: 'BETTING', bettingClosesAt: { $gt: new Date() } });
  if (!round) throw new Error('Crash round is not accepting bets');
  try {
    await CrashWager.create({ betId, roundId, userId: ownerId, wager, autoCashout: params.autoCashout, status: 'PREPARING' });
  } catch (error: any) {
    if (error?.code === 11000) {
      const raced = await CrashWager.findOne({ betId });
      if (raced && matches(raced) && raced.status !== 'PREPARING') return { betId, roundId, autoCashout: params.autoCashout };
      throw new Error(raced && !matches(raced) ? 'Crash bet idempotency payload mismatch' : 'Crash bet is still being prepared');
    }
    throw error;
  }
  try {
    await authorizeBetBankroll(betId, 'crash', wager, params.autoCashout);
    await reserveCasinoBet(ownerId, betId, wager);
    await Bet.create({ betId, userId: ownerId, game: 'crash', wager, payout: 0, multiplier: 0, profit: -wager, outcome: 'pending', status: 'FUNDS_RESERVED', timestamp: new Date() });
    const stillOpen = await CrashRound.exists({ roundId, status: 'BETTING', bettingClosesAt: { $gt: new Date() } });
    if (!stillOpen) throw new Error('Crash round closed while placing bet');
    await CrashWager.updateOne({ betId, status: 'PREPARING' }, { $set: { status: 'ACTIVE' } });
    return { betId, roundId, autoCashout: params.autoCashout };
  } catch (error) {
    await refundCasinoBet(betId).catch(() => undefined);
    await releaseBetBankroll(betId).catch(() => undefined);
    await Bet.updateOne({ betId }, { $set: { status: 'REFUNDED' } }).catch(() => undefined);
    await CrashWager.deleteOne({ betId, status: 'PREPARING' }).catch(() => undefined);
    throw error;
  }
};

const crashResult = (wager: any, round: any, cashout: number) => {
  const proof = createFairRandom(round.roundId, 0, round.serverSeed, { commitId: round.roundId, committedAt: round.createdAt.toISOString() }).proof;
  const multiplier = cashout > 0 ? cashout : 0;
  return standardResult('crash', wager.wager, wager.wager * multiplier, multiplier, {
    roundId: round.roundId, crashMultiplier: round.crashMultiplier, autoCashout: wager.autoCashout, status: multiplier > 0 ? 'cashed_out' : 'crashed'
  }, proof);
};

const settleWager = async (wager: any, round: any, cashout: number) => {
  const claimed = await CrashWager.findOneAndUpdate({ _id: wager._id, status: 'ACTIVE' }, { $set: { status: 'SETTLING' } }, { returnDocument: 'after' });
  if (!claimed) return;
  const result = crashResult(wager, round, cashout);
  const publicResult = round.status === 'CRASHED' ? result : {
    ...result, serverSeed: 'hidden', proof: { ...result.proof, serverSeed: 'hidden' },
    outcome: { ...result.outcome, crashMultiplier: undefined }
  };
  try {
    await settleBetBankroll(wager.betId, result.payout, result);
    await settleCasinoBet(wager.betId, result.payout);
    await Bet.updateOne({ betId: wager.betId, status: 'FUNDS_RESERVED' }, {
      $set: { payout: result.payout, multiplier: result.multiplier, profit: result.profit, outcome: result.won ? 'win' : 'loss', details: publicResult, stats: standardizedStats(publicResult), status: 'SETTLED' }
    });
    await CrashWager.updateOne({ _id: wager._id, status: 'SETTLING' }, { $set: { status: 'SETTLED', settledMultiplier: result.multiplier } });
  } catch (error) {
    await CrashWager.updateOne({ _id: wager._id, status: 'SETTLING' }, { $set: { status: 'ACTIVE' } });
    throw error;
  }
};

const revealCrashRoundResults = async (round: any) => {
  const wagers = await CrashWager.find({ roundId: round.roundId, status: 'SETTLED' });
  for (const wager of wagers) {
    const multiplier = wager.settledMultiplier || 0;
    const result = crashResult(wager, round, multiplier);
    await Bet.updateOne({ betId: wager.betId, status: 'SETTLED' }, { $set: { details: result, stats: standardizedStats(result) } });
  }
};

export const recoverCrashSettlements = async (now = new Date()) => {
  const preparing = await CrashWager.find({ status: 'PREPARING', updatedAt: { $lt: new Date(now.getTime() - 60_000) } }).limit(500);
  for (const wager of preparing) {
    const bet = await Bet.findOne({ betId: wager.betId });
    const roundOpen = await CrashRound.exists({ roundId: wager.roundId, status: 'BETTING', bettingClosesAt: { $gt: now } });
    if (bet?.status === 'FUNDS_RESERVED' && roundOpen) {
      await CrashWager.updateOne({ _id: wager._id, status: 'PREPARING' }, { $set: { status: 'ACTIVE' } });
      continue;
    }
    await refundCasinoBet(wager.betId).catch(() => undefined);
    await releaseBetBankroll(wager.betId).catch(() => undefined);
    await Bet.updateOne({ betId: wager.betId, status: 'FUNDS_RESERVED' }, { $set: { status: 'REFUNDED' } });
    await CrashWager.deleteOne({ _id: wager._id, status: 'PREPARING' });
  }
  await CrashWager.updateMany(
    { status: 'SETTLING', updatedAt: { $lt: new Date(now.getTime() - 60_000) } },
    { $set: { status: 'ACTIVE' } }
  );
  const crashedRounds = await CrashRound.find({ status: 'CRASHED' }).sort({ crashedAt: -1 }).limit(20).select('roundId');
  const pending = await CrashWager.find({ status: 'ACTIVE', roundId: { $in: crashedRounds.map(round => round.roundId) } }).limit(500);
  for (const wager of pending) {
    const round = await CrashRound.findOne({ roundId: wager.roundId, status: 'CRASHED' }).select('+serverSeed +crashMultiplier');
    if (!round) continue;
    const multiplier = round.crashMultiplier >= wager.autoCashout ? wager.autoCashout : 0;
    await settleWager(wager, round, multiplier).catch(error => console.error(`Crash settlement recovery failed for ${wager.betId}:`, error));
    await revealCrashRoundResults(round);
  }
};

export const cashoutCrashWager = async (ownerId: Types.ObjectId, betId: string, now = new Date()) => {
  const wager = await CrashWager.findOne({ betId, userId: ownerId, status: 'ACTIVE' });
  if (!wager) throw new Error('Active Crash wager not found');
  const round = await CrashRound.findOne({ roundId: wager.roundId, status: 'RUNNING' }).select('+serverSeed +crashMultiplier');
  if (!round?.startedAt) throw new Error('Crash round is not running');
  const multiplier = crashMultiplierAt(round.startedAt, now);
  if (multiplier >= round.crashMultiplier) throw new Error('Round has already crashed');
  if (multiplier > wager.autoCashout) throw new Error('Cashout exceeds reserved exposure');
  await settleWager(wager, round, multiplier);
  return { betId, roundId: wager.roundId, multiplier, payout: wager.wager * multiplier };
};

export const advanceCrashRound = async (now = new Date()) => {
  let round: any = await CrashRound.findOne({ status: { $in: ['BETTING', 'RUNNING'] } }).select('+serverSeed +crashMultiplier');
  if (!round) round = await CrashRound.findOne({ status: 'CRASHED' }).sort({ crashedAt: -1 }).select('+serverSeed +crashMultiplier');
  if (!round || (round.crashedAt && now.getTime() - round.crashedAt.getTime() >= INTERMISSION_MS)) round = await createCrashRound(now) as any;
  if (round.status === 'BETTING' && round.bettingClosesAt <= now) {
    round = await CrashRound.findOneAndUpdate({ _id: round._id, status: 'BETTING' }, { $set: { status: 'RUNNING', startedAt: now } }, { returnDocument: 'after' }).select('+serverSeed +crashMultiplier') as any || round;
  }
  if (round.status === 'RUNNING') {
    const current = crashMultiplierAt(round.startedAt!, now);
    const winners = await CrashWager.find({ roundId: round.roundId, status: 'ACTIVE', autoCashout: { $lte: Math.min(current, round.crashMultiplier) } });
    for (const wager of winners) await settleWager(wager, round, wager.autoCashout).catch(error => console.error(`Crash auto-cashout failed for ${wager.betId}:`, error));
    if (current >= round.crashMultiplier) {
      round = await CrashRound.findOneAndUpdate({ _id: round._id, status: 'RUNNING' }, { $set: { status: 'CRASHED', crashedAt: now }, $unset: { activeSlot: 1 } }, { returnDocument: 'after' }).select('+serverSeed +crashMultiplier') as any || round;
      const unsettled = await CrashWager.find({ roundId: round.roundId, status: 'ACTIVE' });
      for (const wager of unsettled) {
        const multiplier = round.crashMultiplier >= wager.autoCashout ? wager.autoCashout : 0;
        await settleWager(wager, round, multiplier).catch(error => console.error(`Crash terminal settlement failed for ${wager.betId}:`, error));
      }
      await revealCrashRoundResults(round);
    }
  }
  if (round.status === 'CRASHED' && round.crashedAt && now.getTime() - round.crashedAt.getTime() >= INTERMISSION_MS) return createCrashRound(now);
  return round;
};
