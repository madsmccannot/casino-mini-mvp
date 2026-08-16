import crypto from 'node:crypto';
import { Response } from 'express';
import { AuthRequest } from '../bets/validateBet.middleware';
import { Bet } from '../../models/Bet';
import { User } from '../../models/User';
import { UserFavorite } from '../../models/UserFavorite';
import { ReferralCode } from '../../models/ReferralCode';

const allowedTypes = new Set(['original', 'catalog', 'sports']);
const originalGames = new Set(['coinflip', 'dice', 'mines', 'plinko', 'roulette', 'crash', 'limbo', 'blackjack']);

const accountId = (req: AuthRequest) => req.user?._id;

export const getAccountProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  return res.json({ accountId: req.user.accountId, displayName: req.user.displayName ?? null, primaryWallet: req.user.primaryWallet ?? null });
};

export const updateAccountProfile = async (req: AuthRequest, res: Response) => {
  const id = accountId(req);
  if (!id) return res.status(401).json({ error: 'Unauthorized' });
  if (!Object.prototype.hasOwnProperty.call(req.body, 'displayName')) return res.status(400).json({ error: 'Only displayName can be updated' });
  const displayName = req.body.displayName === null ? undefined : String(req.body.displayName).trim();
  if (displayName !== undefined && (displayName.length < 2 || displayName.length > 32 || /[\u0000-\u001f\u007f]/.test(displayName))) {
    return res.status(400).json({ error: 'displayName must contain 2 to 32 safe characters' });
  }
  const user = await User.findByIdAndUpdate(id, { $set: { displayName } }, { new: true, runValidators: true }).select('_id accountId displayName primaryWallet');
  if (!user) return res.status(404).json({ error: 'Account not found' });
  return res.json({ accountId: user.accountId, displayName: user.displayName ?? null, primaryWallet: user.primaryWallet ?? null });
};

export const listBetHistory = async (req: AuthRequest, res: Response) => {
  const id = accountId(req);
  if (!id) return res.status(401).json({ error: 'Unauthorized' });
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  const page = Math.min(Math.max(Number(req.query.page) || 1, 1), 1000);
  const status = typeof req.query.status === 'string' && ['SETTLED', 'REFUNDED', 'FAILED', 'FUNDS_RESERVED', 'RESULT_READY'].includes(req.query.status) ? req.query.status as 'SETTLED' | 'REFUNDED' | 'FAILED' | 'FUNDS_RESERVED' | 'RESULT_READY' : undefined;
  const filter: any = { userId: id, ...(status ? { status } : {}) };
  const [total, bets] = await Promise.all([
    Bet.countDocuments(filter),
    Bet.find(filter).sort({ timestamp: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).select('betId game wager payout multiplier profit outcome status timestamp').lean()
  ]);
  return res.json({ currency: 'USDC', page, limit, total, bets });
};

export const listFavorites = async (req: AuthRequest, res: Response) => {
  const id = accountId(req);
  if (!id) return res.status(401).json({ error: 'Unauthorized' });
  return res.json({ favorites: await UserFavorite.find({ userId: id }).sort({ createdAt: -1 }).select('itemType itemId createdAt').lean() });
};

export const addFavorite = async (req: AuthRequest, res: Response) => {
  const id = accountId(req);
  if (!id) return res.status(401).json({ error: 'Unauthorized' });
  const itemType = String(req.body.itemType || '') as 'original' | 'catalog' | 'sports';
  const itemId = String(req.body.itemId || '').trim();
  if (!allowedTypes.has(itemType) || !/^[A-Za-z0-9:_-]{1,128}$/.test(itemId)) return res.status(400).json({ error: 'Invalid favorite' });
  if (itemType === 'original' && !originalGames.has(itemId)) return res.status(400).json({ error: 'Unknown original game' });
  const favorite = await UserFavorite.findOneAndUpdate({ userId: id, itemType, itemId }, { $setOnInsert: { userId: id, itemType, itemId } }, { upsert: true, new: true }).select('itemType itemId createdAt').lean();
  return res.status(201).json({ favorite });
};

export const removeFavorite = async (req: AuthRequest, res: Response) => {
  const id = accountId(req);
  if (!id) return res.status(401).json({ error: 'Unauthorized' });
  const itemType = String(req.body.itemType || '') as 'original' | 'catalog' | 'sports';
  const itemId = String(req.body.itemId || '').trim();
  if (!allowedTypes.has(itemType) || !/^[A-Za-z0-9:_-]{1,128}$/.test(itemId)) return res.status(400).json({ error: 'Invalid favorite' });
  await UserFavorite.deleteOne({ userId: id, itemType, itemId });
  return res.status(204).send();
};

const newReferralCode = () => crypto.randomBytes(8).toString('hex').toUpperCase();

export const getRetentionSummary = async (req: AuthRequest, res: Response) => {
  const id = accountId(req);
  if (!id) return res.status(401).json({ error: 'Unauthorized' });
  let referral = await ReferralCode.findOne({ userId: id }).select('code status createdAt').lean();
  if (!referral) referral = await ReferralCode.create({ userId: id, code: newReferralCode(), status: 'ACTIVE' });
  return res.json({
    referral: { code: referral.code, status: referral.status, rewardsEnabled: false },
    vip: { tier: 'STANDARD', points: 0, enabled: false },
    cashback: { enabled: false, rateBps: 0 },
    missions: { enabled: false, items: [] },
    leaderboard: { enabled: false, entries: [] },
    promotions: { enabled: false, items: [] }
  });
};
