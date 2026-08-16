import { Request, Response } from 'express';
import { User } from '../models/User';
import nacl from 'tweetnacl'; // Criptografia
import bs58 from 'bs58';       // Codificação Solana
import jwt from 'jsonwebtoken'; // Token de Sessão
import crypto from 'crypto';
import { PublicKey } from '@solana/web3.js';
import { AuthChallenge } from '../models/AuthChallenge';
import { getJwtSecret } from '../config/env';
import { getUserBalanceSol } from '../ledger/casinoLedger.service';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const JWT_ISSUER = 'casino-mini-mvp';
const JWT_AUDIENCE = 'casino-mini-mvp-web';

export const createLoginChallenge = async (req: Request, res: Response) => {
  try {
    const walletAddress = String(req.query.walletAddress || '');
    try {
      if (new PublicKey(walletAddress).toBase58() !== walletAddress) throw new Error('non-canonical address');
    } catch {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }

    const nonce = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
    const message = [
      'Sign in to Casino Mini MVP',
      `Wallet: ${walletAddress}`,
      `Nonce: ${nonce}`,
      `Expires: ${expiresAt.toISOString()}`
    ].join('\n');

    await AuthChallenge.create({ walletAddress, nonce, message, expiresAt });
    return res.json({ message, nonce, expiresAt: expiresAt.toISOString() });
  } catch (error) {
    console.error('Challenge creation failed:', error);
    return res.status(500).json({ error: 'Unable to create login challenge' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { walletAddress, signature, message, nonce } = req.body;

    // 1. Validações Básicas
    if (!walletAddress || !signature || !message || !nonce) {
      return res.status(400).json({ error: "Dados de login incompletos" });
    }

    let canonicalAddress: string;
    try {
      canonicalAddress = new PublicKey(walletAddress).toBase58();
      if (canonicalAddress !== walletAddress) throw new Error('non-canonical address');
    } catch {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }

    // Claim the one-time challenge atomically before verifying the signature.
    const challenge = await AuthChallenge.findOneAndUpdate(
      { walletAddress: canonicalAddress, nonce, message, usedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
      { $set: { usedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!challenge) return res.status(401).json({ error: 'Login challenge is invalid, expired, or already used' });

    // 2. VERIFICAÇÃO CRIPTOGRÁFICA
    try {
      // Converte tudo para Uint8Array para o NaCl verificar
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = bs58.decode(signature);
      const publicKeyBytes = bs58.decode(canonicalAddress);

      // Verifica se a assinatura corresponde à mensagem e à carteira
      const verified = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );

      if (!verified) {
        return res.status(401).json({ error: "Assinatura inválida! Você não é dono desta carteira." });
      }
    } catch (err) {
      console.error("Signature verification failed:", err);
      return res.status(400).json({ error: "Erro ao validar assinatura" });
    }

    // 3. Upsert no MongoDB (Procura ou Cria)
    let user = await User.findOneAndUpdate(
      { walletAddress: canonicalAddress },
      { 
        $setOnInsert: { 
          walletAddress: canonicalAddress,
          balance: 0, 
          createdAt: new Date() 
        },
        $set: { lastLogin: new Date() } // Atualiza último login
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    // 4. Gerar JWT (Sessão Segura)
    const token = jwt.sign(
      { id: user._id, walletAddress: user.walletAddress },
      getJwtSecret(),
      { expiresIn: '15m', algorithm: 'HS256', issuer: JWT_ISSUER, audience: JWT_AUDIENCE }
    );

    console.log(`👤 Auth Success: ${walletAddress.slice(0,6)}...`);

    // 5. Retornar User + Token
    res.json({
      success: true,
      token, // O Frontend vai guardar isto
      user: {
        walletAddress: user.walletAddress,
        balance: await getUserBalanceSol(user._id.toString()),
      }
    });

  } catch (error: any) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Erro no servidor ao fazer login" });
  }
};
