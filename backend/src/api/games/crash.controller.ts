import { Response } from 'express';
import { AuthRequest } from '../bets/validateBet.middleware';
import { advanceCrashRound, cashoutCrashWager, placeCrashWager, publicCrashRound } from '../../games/crash.service';

const KEY_PATTERN = /^[A-Za-z0-9:_-]{16,128}$/;

export const getCrashRound = async (_req: AuthRequest, res: Response) => {
  const round = await advanceCrashRound();
  return res.json(publicCrashRound(round));
};

export const cashoutCrashRound = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { betId } = req.body || {};
  if (typeof betId !== 'string' || !KEY_PATTERN.test(betId)) return res.status(400).json({ error: 'A valid betId is required' });
  try {
    return res.json(await cashoutCrashWager(req.user._id, betId));
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const betCrashRound = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { roundId, betAmount, autoCashout, idempotencyKey } = req.body || {};
  if (typeof idempotencyKey !== 'string' || !KEY_PATTERN.test(idempotencyKey)) return res.status(400).json({ error: 'A valid idempotencyKey is required' });
  try {
    const wager = await placeCrashWager(req.user._id, idempotencyKey, roundId, betAmount, { autoCashout });
    return res.status(201).json(wager);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};
