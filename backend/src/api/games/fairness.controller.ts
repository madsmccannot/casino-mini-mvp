import { Request, Response } from 'express';
import { Bet } from '../../models/Bet';
import { verifyGameResult } from '../../games/fairnessVerifier';
import { AuthRequest } from '../bets/validateBet.middleware';
import { issueFairnessCommit } from '../../games/fairnessCommit.service';

export const createFairnessCommit = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    return res.status(201).json(await issueFairnessCommit(req.user._id, req.body?.clientSeed, req.body?.nonce));
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const verifyBetFairness = async (req: Request, res: Response) => {
  const betId = String(req.params.betId || '');
  if (!/^[A-Za-z0-9:_-]{16,128}$/.test(betId)) return res.status(400).json({ error: 'Invalid bet ID' });
  const bet = await Bet.findOne({ betId }).select('betId game status details').lean();
  if (!bet || !bet.details) return res.status(404).json({ error: 'Completed bet proof not found' });
  const verified = verifyGameResult(bet.details);
  return res.status(verified ? 200 : 409).json({ betId, game: bet.game, status: bet.status, verified, result: bet.details });
};
