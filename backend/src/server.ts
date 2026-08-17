import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { connectDB } from './config/db'; 
import { createLoginChallenge, loginUser } from './controllers/authController';
import { User } from './models/User';

import { switchboardRNG } from './rng/switchboard';

// --- GAME ROUTES & MIDDLEWARE ---
import { validateBet, AuthRequest } from './api/bets/validateBet.middleware'; // Importar AuthRequest
import { placeBet } from './api/bets/placeBet.controller';

// --- SECURITY / ADMIN ---
import { checkEmergencyState } from './emergency/emergency.middleware'; 
import { toggleEmergency, exportBalances } from './api/admin/emergency.controller'; 
import { getBankrollStatus, withdrawHouseFunds } from './api/admin/bankroll.controller';
import { assertProductionConfig, getAllowedOrigins } from './config/env';
import { getCustodyMode } from './config/env';
import { getProductionReadiness } from './config/productionReadiness';
import { getMyBalance, getMyTransactions } from './api/ledger/ledger.controller';
import { getLedgerReconciliation } from './api/admin/reconciliation.controller';
import crypto from 'crypto';
import mongoose from 'mongoose';
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

const requestWindow = new Map<string, { startedAt: number; count: number }>();
const boundedRateLimit = (limit: number, windowMs: number) => (req: Request, res: Response, next: any) => {
  const key = `${req.ip || 'unknown'}:${req.path}`;
  const now = Date.now();
  const current = requestWindow.get(key);
  if (!current || now - current.startedAt >= windowMs) requestWindow.set(key, { startedAt: now, count: 1 });
  else if (current.count >= limit) return res.status(429).json({ error: 'Too many requests. Try again later.' });
  else current.count += 1;
  return next();
};

const allowedOrigins = new Set(getAllowedOrigins());
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
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
app.get('/health/live', (_req, res) => res.json({ status: 'ok' }));
app.get('/health/ready', (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  const productionReadiness = getProductionReadiness();
  const operational = ready && (!productionReadiness.production || productionReadiness.readyForRealMoney);
  return res.status(operational ? 200 : 503).json({ status: operational ? 'ready' : 'not_ready', database: ready ? 'connected' : 'disconnected', productionReadiness });
});

// --- AUTH ---
app.post('/api/auth/login', boundedRateLimit(20, 60_000), loginUser);
app.get('/api/auth/challenge', boundedRateLimit(30, 60_000), createLoginChallenge);

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

// Legacy Solana money movement is retired. Keep explicit responses so an old
// client cannot accidentally interpret a disabled path as a pending transfer.
app.post('/api/wallet/deposit', (_req, res) => res.status(410).json({ error: 'Legacy Solana deposits are retired. Use the approved EVM provider flow when enabled.' }));
app.post('/api/wallet/withdraw', (_req, res) => res.status(410).json({ error: 'Legacy Solana withdrawals are retired. Use the approved EVM provider flow when enabled.' }));

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
