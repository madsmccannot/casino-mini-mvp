import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
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
import bs58 from 'bs58';
import { getCustodyMode } from './config/env';
import { getMyBalance, getMyTransactions } from './api/ledger/ledger.controller';
import { confirmWithdrawal, creditConfirmedDeposit, failWithdrawal, getUserBalanceSol, reserveWithdrawal } from './ledger/casinoLedger.service';
import { getLedgerReconciliation } from './api/admin/reconciliation.controller';
import crypto from 'crypto';
import { createFairnessCommit, verifyBetFairness } from './api/games/fairness.controller';
import { betCrashRound, cashoutCrashRound, getCrashRound } from './api/games/crash.controller';
import { attachCrashRealtime } from './games/crashRealtime';
import { listSportsEvents, getSportsEvent } from './api/sports/events.controller';
import { cashoutSportsTicket, createSportsTicket, getSportsCashoutQuote, listMySportsTickets } from './api/sports/tickets.controller';
import { getSportsOperations, publishSandboxSettlement, runSportsIngest, runSportsSettlement } from './api/admin/sports.controller';
import { attachSportsOddsStream } from './sportsbook/feeds/liveOdds.service';
import { getCatalog, launchCatalog, wagerCatalog } from './api/casinoCatalog.controller';
import { addFavorite, getAccountProfile, getRetentionSummary, listBetHistory, listFavorites, removeFavorite, updateAccountProfile } from './api/account/account.controller';

export const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = new Set(getAllowedOrigins());
app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS policy'));
  },
  methods: ['GET', 'POST', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600
}));
app.use(express.json({ limit: '32kb', strict: true }));
app.use((req: AuthRequest, res, next) => {
  const incoming = req.header('x-correlation-id');
  req.correlationId = incoming && /^[A-Za-z0-9:_-]{8,128}$/.test(incoming) ? incoming : crypto.randomUUID();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
});

// --- ROOT ---
app.get('/', (_req, res) => {
  res.json({ status: 'Casino backend online', custodyMode: getCustodyMode() });
});

// --- AUTH ---
app.post('/api/auth/login', loginUser);
app.get('/api/auth/challenge', createLoginChallenge);

// --- UNIFIED LEDGER (read-only API during Phase 1 rollout) ---
app.get('/api/account/balance', validateBet as any, getMyBalance as any);
app.get('/api/account/transactions', validateBet as any, getMyTransactions as any);
app.get('/api/account/profile', validateBet as any, getAccountProfile as any);
app.patch('/api/account/profile', validateBet as any, updateAccountProfile as any);
app.get('/api/account/bets', validateBet as any, listBetHistory as any);
app.get('/api/account/favorites', validateBet as any, listFavorites as any);
app.post('/api/account/favorites', validateBet as any, addFavorite as any);
app.post('/api/account/favorites/remove', validateBet as any, removeFavorite as any);
app.get('/api/account/retention', validateBet as any, getRetentionSummary as any);
app.get('/api/fairness/:betId', verifyBetFairness as any);
app.post('/api/fairness/commit', validateBet as any, createFairnessCommit as any);

// --- ADMIN ROUTES (Protegidas por validateBet que verifica isAdmin) ---
app.post('/api/admin/emergency/toggle', validateBet as any, toggleEmergency as any); 
app.post('/api/admin/emergency/export', validateBet as any, exportBalances as any); 
app.get('/api/admin/bankroll', validateBet as any, getBankrollStatus as any);
app.post('/api/admin/bankroll/withdraw', validateBet as any, withdrawHouseFunds as any);
app.get('/api/admin/ledger/reconciliation', validateBet as any, getLedgerReconciliation as any);
app.get('/api/admin/sports', validateBet as any, getSportsOperations as any);
app.post('/api/admin/sports/ingest', validateBet as any, runSportsIngest as any);
app.post('/api/admin/sports/settle', validateBet as any, runSportsSettlement as any);
app.post('/api/admin/sports/sandbox/settlement', validateBet as any, publishSandboxSettlement as any);

app.get('/api/sports/events', listSportsEvents as any);
app.get('/api/sports/events/:eventId', getSportsEvent as any);
app.post('/api/sports/tickets', checkEmergencyState, validateBet as any, createSportsTicket as any);
app.get('/api/sports/tickets', validateBet as any, listMySportsTickets as any);
app.get('/api/sports/tickets/:ticketId/cashout', validateBet as any, getSportsCashoutQuote as any);
app.post('/api/sports/tickets/:ticketId/cashout', checkEmergencyState, validateBet as any, cashoutSportsTicket as any);
app.get('/api/casino/catalog', getCatalog as any);
app.post('/api/casino/catalog/launch', validateBet as any, launchCatalog as any);
app.post('/api/casino/catalog/wagers', checkEmergencyState, validateBet as any, wagerCatalog as any);

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
        const decoded = bs58.decode(walletAddress);
        if (decoded.length !== 32 || bs58.encode(decoded) !== walletAddress) throw new Error('non-canonical address');
        canonicalAddress = walletAddress;
      } catch {
        return res.status(400).json({ error: 'Invalid Solana wallet address.' });
      }

      // 1. Auditar Transação na Blockchain
      const auditResult = await solana.auditRecentDeposits(canonicalAddress, signature);
      
      if (!auditResult || !auditResult.isConfirmed || auditResult.amountSol <= 0) {
        return res.status(400).json({ error: 'Invalid or unconfirmed Solana transaction.' });
      }

      const amountSol = auditResult.amountSol;

      let receipt = await DepositReceipt.findOne({ signature });
      if (receipt && (receipt.walletAddress !== canonicalAddress || receipt.amountSol !== amountSol)) {
        return res.status(409).json({ error: 'Deposit receipt does not match the submitted transaction.' });
      }
      if (!receipt) {
        receipt = await DepositReceipt.create({
          signature,
          walletAddress: canonicalAddress,
          amountSol,
          status: 'pending_credit'
        });
      }

      const user = await User.findOne({ walletAddress: canonicalAddress });

      if (!user) {
        await DepositReceipt.updateOne({ signature }, { $set: { status: 'manual_review' } });
        return res.status(409).json({ error: 'Account not found. Deposit queued for manual review.' });
      }

      await creditConfirmedDeposit(user._id, signature, amountSol);

      await DepositReceipt.updateOne(
        { signature, status: 'pending_credit' },
        { $set: { status: 'credited', creditedAt: new Date() } }
      );

      console.log(`💰 Deposit: +${amountSol.toFixed(4)} SOL for ${walletAddress.slice(0,6)}...`);

      res.json({ success: true, newBalance: await getUserBalanceSol(user._id.toString()) });

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
      const { amount, idempotencyKey } = req.body;
      const user = req.user; // O middleware já carregou o user seguro

      if (!user) return res.status(401).json({ error: "Unauthorized" });

      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(amount * 1_000_000_000)) {
        return res.status(400).json({ error: 'Invalid amount.' });
      }
      if (typeof idempotencyKey !== 'string' || !/^[A-Za-z0-9:_-]{16,128}$/.test(idempotencyKey)) {
        return res.status(400).json({ error: 'A valid idempotencyKey is required.' });
      }

      await reserveWithdrawal(user._id, idempotencyKey, amount);

      console.log(`💸 Withdraw Request: ${amount} SOL to ${user.walletAddress}`);

      try {
        // 3. Enviar SOL na Blockchain
        const result = await solana.processWithdrawal(user.walletAddress, amount);
        await confirmWithdrawal(idempotencyKey);

        console.log(`✅ Paid! TX: ${result.tx}`);
        res.json({ success: true, newBalance: await getUserBalanceSol(user._id.toString()), tx: result.tx });

      } catch (blockchainError: any) {
        console.error('❌ Solana Payout Error:', blockchainError.message);
        
        await failWithdrawal(idempotencyKey);
        
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
app.get('/api/crash/round', getCrashRound as any);
app.post('/api/crash/bet', checkEmergencyState, validateBet as any, betCrashRound as any);
app.post('/api/crash/cashout', checkEmergencyState, validateBet as any, cashoutCrashRound as any);

export const startServer = async () => {
  assertProductionConfig();
  await connectDB();
  await switchboardRNG.init();
  const server = app.listen(PORT, () => {
    console.log(`\nBackend running on port ${PORT}`);
  });
  attachCrashRealtime(server);
  attachSportsOddsStream(server);
  return server;
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Backend startup failed:', error);
    process.exitCode = 1;
  });
}
