import { Request, Response } from 'express';
import { User } from '../models/User';
import { verifyMessage } from 'ethers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthChallenge } from '../models/AuthChallenge';
import { getJwtSecret } from '../config/env';
import { getUserBalanceUsdc } from '../ledger/casinoLedger.service';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const JWT_ISSUER = 'casino-mini-mvp';
const JWT_AUDIENCE = 'casino-mini-mvp-web';
const AUTH_DOMAIN = process.env.AUTH_DOMAIN?.trim() || 'localhost:3000';
const AUTH_URI = process.env.AUTH_URI?.trim() || 'http://localhost:3000';
const SUPPORTED_CHAIN_IDS = new Set([1, 10, 137, 8453, 42161]);

const canonicalAddress = (value: unknown): string => {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(value)) throw new Error('invalid EVM address');
  return value.toLowerCase();
};

const parseChainId = (value: unknown): number => {
  const chainId = Number(value);
  if (!Number.isSafeInteger(chainId) || !SUPPORTED_CHAIN_IDS.has(chainId)) throw new Error('unsupported EVM chain');
  return chainId;
};

const buildMessage = (address: string, chainId: number, nonce: string, issuedAt: Date, expiresAt: Date) => [
  `${AUTH_DOMAIN} wants you to sign in with your Ethereum account:`,
  address,
  '',
  'Sign in to SolCasino.',
  '',
  `URI: ${AUTH_URI}`,
  'Version: 1',
  `Chain ID: ${chainId}`,
  `Nonce: ${nonce}`,
  `Issued At: ${issuedAt.toISOString()}`,
  `Expiration Time: ${expiresAt.toISOString()}`
].join('\n');

export const createLoginChallenge = async (req: Request, res: Response) => {
  try {
    const address = canonicalAddress(req.query.address);
    const chainId = parseChainId(req.query.chainId);
    const nonce = crypto.randomBytes(32).toString('hex');
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + CHALLENGE_TTL_MS);
    const message = buildMessage(address, chainId, nonce, issuedAt, expiresAt);

    await AuthChallenge.create({ address, chainFamily: 'EVM', chainId, domain: AUTH_DOMAIN, uri: AUTH_URI, nonce, message, expiresAt });
    return res.json({ message, nonce, expiresAt: expiresAt.toISOString(), chainId, address });
  } catch (error) {
    if (error instanceof Error && /invalid|unsupported/.test(error.message)) return res.status(400).json({ error: 'Invalid EVM wallet or unsupported network' });
    console.error('Challenge creation failed:', error);
    return res.status(500).json({ error: 'Unable to create login challenge' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { address: rawAddress, chainId: rawChainId, signature, message, nonce } = req.body;
    if (!rawAddress || !rawChainId || !signature || !message || !nonce) return res.status(400).json({ error: 'Incomplete login data' });

    const address = canonicalAddress(rawAddress);
    const chainId = parseChainId(rawChainId);
    const challenge = await AuthChallenge.findOne({ address, chainFamily: 'EVM', chainId, nonce, message, usedAt: { $exists: false }, expiresAt: { $gt: new Date() } });
    if (!challenge) return res.status(401).json({ error: 'Login challenge is invalid, expired, or already used' });

    const verifiedAddress = (await verifyMessage(message, signature)).toLowerCase();
    const verified = verifiedAddress === address;
    if (!verified) return res.status(401).json({ error: 'Invalid wallet signature' });

    // Consume only after cryptographic verification, while keeping the claim
    // atomic so a valid signature cannot be replayed concurrently.
    const claimed = await AuthChallenge.findOneAndUpdate(
      { _id: challenge._id, usedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
      { $set: { usedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!claimed) return res.status(401).json({ error: 'Login challenge is invalid, expired, or already used' });

    let user = await User.findOneAndUpdate(
      { 'primaryWallet.chainFamily': 'EVM', 'primaryWallet.address': address, 'primaryWallet.chainId': chainId },
      {
        $setOnInsert: { accountId: crypto.randomUUID(), primaryWallet: { chainFamily: 'EVM', chainId, address }, balance: 0, createdAt: new Date() },
        $set: { lastLogin: new Date() }
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    if (!user) throw new Error('Unable to create account');

    const token = jwt.sign(
      { id: user._id, accountId: user.accountId, chainFamily: 'EVM', chainId, address },
      getJwtSecret(),
      { expiresIn: '15m', algorithm: 'HS256', issuer: JWT_ISSUER, audience: JWT_AUDIENCE }
    );

    // The ledger is still being migrated from legacy SOL test units. Never label
    // those units as USDC; expose zero canonical USDC until the migration lands.
    const balanceUsdc = await getUserBalanceUsdc(user._id.toString());
    return res.json({
      success: true,
      token,
      account: { accountId: user.accountId, primaryWallet: user.primaryWallet },
      user: { accountId: user.accountId, address, chainId, balanceUsdc }
    });
  } catch (error) {
    console.error('EVM login failed:', error);
    return res.status(400).json({ error: 'Unable to authenticate wallet' });
  }
};
