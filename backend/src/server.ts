import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv'; 
import { connectDB } from './config/db'; 
import { createLoginChallenge, loginUser } from './controllers/authController';
import { User } from './models/User';

// --- SOLANA ONLY ---
import * as solana from './blockchain/solana'; 
import { switchboardRNG } from './rng/switchboard';

// --- GAME ROUTES & MIDDLEWARE ---
import { validateBet, AuthRequest } from './api/bets/validateBet.middleware'; // Importar AuthRequest
import { placeBet } from './api/bets/placeBet.controller';

// --- SECURITY / ADMIN ---
import { checkEmergencyState } from './emergency/emergency.middleware'; 
import { toggleEmergency, exportBalances } from './api/admin/emergency.controller'; 
import { getBankrollStatus, withdrawHouseFunds } from './api/admin/bankroll.controller';
import { assertProductionConfig, getAllowedOrigins } from './config/env';
import { DepositReceipt } from './models/DepositReceipt';
import { PublicKey } from '@solana/web3.js';
import { getCustodyMode } from './config/env';

// --- CONFIG ---
dotenv.config(); 
assertProductionConfig();
connectDB(); 
switchboardRNG.init(); // Inicia RNG (ou fallback seguro)

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = new Set(getAllowedOrigins());
app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS policy'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600
}));
app.use(express.json({ limit: '32kb', strict: true }));

// --- ROOT ---
app.get('/', (_req, res) => {
  res.json({ status: 'SolCasino Backend Online 🚀', mode: 'SOL_NATIVE' });
});

// --- AUTH ---
app.post('/api/auth/login', loginUser);
app.get('/api/auth/challenge', createLoginChallenge);

// --- ADMIN ROUTES (Protegidas por validateBet que verifica isAdmin) ---
app.post('/api/admin/emergency/toggle', validateBet as any, toggleEmergency as any); 
app.post('/api/admin/emergency/export', validateBet as any, exportBalances as any); 
app.get('/api/admin/bankroll', validateBet as any, getBankrollStatus as any);
app.post('/api/admin/bankroll/withdraw', validateBet as any, withdrawHouseFunds as any);

// --- DEPOSIT (SOL NATIVE) ---
// Depósitos são públicos (qualquer um pode mandar dinheiro), validamos pela assinatura na blockchain
app.post(
  '/api/wallet/deposit',
  checkEmergencyState,
  async (req: Request, res: Response) => {
    try {
      if (getCustodyMode() === 'disabled') {
        return res.status(503).json({ error: 'Custody is not configured. Deposits are disabled.' });
      }
      const { walletAddress, signature } = req.body;

      if (!signature || !walletAddress) {
        return res.status(400).json({ error: 'Missing signature or wallet address.' });
      }

      let canonicalAddress: string;
      try {
        canonicalAddress = new PublicKey(walletAddress).toBase58();
        if (canonicalAddress !== walletAddress) throw new Error('non-canonical address');
      } catch {
        return res.status(400).json({ error: 'Invalid Solana wallet address.' });
      }

      // 1. Auditar Transação na Blockchain
      const auditResult = await solana.auditRecentDeposits(canonicalAddress, signature);
      
      if (!auditResult || !auditResult.isConfirmed || auditResult.amountSol <= 0) {
        return res.status(400).json({ error: 'Invalid or unconfirmed Solana transaction.' });
      }

      const amountSol = auditResult.amountSol;

      try {
        await DepositReceipt.create({
          signature,
          walletAddress: canonicalAddress,
          amountSol,
          status: 'pending_credit'
        });
      } catch (error: any) {
        if (error?.code === 11000) {
          return res.status(409).json({ error: 'Deposit transaction has already been submitted.' });
        }
        throw error;
      }

      // 2. Creditar Saldo em SOL (Sem conversão USD)
      const updatedUser = await User.findOneAndUpdate(
        { walletAddress: canonicalAddress },
        { $inc: { balance: amountSol } },
        { new: true }
      );

      if (!updatedUser) {
        await DepositReceipt.updateOne({ signature }, { $set: { status: 'manual_review' } });
        return res.status(409).json({ error: 'Account not found. Deposit queued for manual review.' });
      }

      await DepositReceipt.updateOne(
        { signature, status: 'pending_credit' },
        { $set: { status: 'credited', creditedAt: new Date() } }
      );

      console.log(`💰 Deposit: +${amountSol.toFixed(4)} SOL for ${walletAddress.slice(0,6)}...`);

      res.json({ success: true, newBalance: updatedUser?.balance });

    } catch (error: any) {
      console.error('Deposit error:', error.message);
      res.status(500).json({ error: 'Deposit processing error.' });
    }
  }
);

// --- WITHDRAW (SOL NATIVE & SECURE) ---
// Alteração Crítica: Agora usa 'validateBet' para garantir que só o dono da conta levanta o dinheiro
app.post(
  '/api/wallet/withdraw',
  checkEmergencyState,
  validateBet as any, // <--- SEGURANÇA: Exige Token JWT
  async (req: AuthRequest, res: Response) => {
    try {
      if (getCustodyMode() === 'disabled') {
        return res.status(503).json({ error: 'Custody is not configured. Withdrawals are disabled.' });
      }
      const { amount } = req.body;
      const user = req.user; // O middleware já carregou o user seguro

      if (!user) return res.status(401).json({ error: "Unauthorized" });

      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(amount * 1_000_000_000)) {
        return res.status(400).json({ error: 'Invalid amount.' });
      }

      // 1. Verificar Saldo (SOL)
      if (user.balance < amount) {
        return res.status(400).json({ error: 'Insufficient SOL balance.' });
      }

      // 2. Bloquear Fundos (Atomicamente) antes de enviar
      // Isto evita Race Conditions onde o user tenta levantar 2x rápido
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(400).json({ error: 'Insufficient balance (Concurrency check).' });
      }

      console.log(`💸 Withdraw Request: ${amount} SOL to ${user.walletAddress}`);

      try {
        // 3. Enviar SOL na Blockchain
        const result = await solana.processWithdrawal(user.walletAddress, amount);

        console.log(`✅ Paid! TX: ${result.tx}`);
        res.json({ success: true, newBalance: updatedUser.balance, tx: result.tx });

      } catch (blockchainError: any) {
        console.error('❌ Solana Payout Error:', blockchainError.message);
        
        // REEMBOLSO DE EMERGÊNCIA: Se a blockchain falhar, devolvemos o saldo
        await User.findByIdAndUpdate(user._id, { $inc: { balance: amount } });
        
        res.status(500).json({ error: 'Blockchain transfer failed. Funds refunded to balance.' });
      }

    } catch (error) {
      console.error('Withdraw error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// --- GAME ROUTE ---
app.post('/api/play', checkEmergencyState, validateBet as any, placeBet as any);

// --- START ---
app.listen(PORT, () => {
  console.log(`\n🎲 Backend running on http://localhost:${PORT}`);
});
