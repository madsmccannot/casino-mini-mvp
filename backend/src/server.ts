import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv'; 
import { connectDB } from './config/db'; 
import { loginUser } from './controllers/authController'; 
import { User } from './models/User';

// --- SOLANA ONLY ---
import * as solana from './blockchain/solana'; 
import { priceOracle } from './utils/priceOracle';
import { switchboardRNG } from './rng/switchboard';

// --- GAME ROUTES ---
import { validateBet } from './api/bets/validateBet.middleware';
import { placeBet } from './api/bets/placeBet.controller';

// --- SECURITY / ADMIN ---
import { checkEmergencyState } from './emergency/emergency.middleware'; 
import { toggleEmergency, exportBalances } from './api/admin/emergency.controller'; 
import { getBankrollStatus, withdrawHouseFunds } from './api/admin/bankroll.controller';

// --- CONFIG ---
dotenv.config(); 
connectDB(); 
switchboardRNG.init();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// --- FINANCIAL REQUEST TYPE (SOL ONLY) ---
interface FinancialRequest extends Request {
  body: {
    walletAddress: string;
    amount?: number;
    signature?: string;
  };
}

// --- ROOT ---
app.get('/', (_req, res) => {
  res.json({ status: 'SolCasino Backend Online 🚀', db: 'Connected' });
});

// --- CASINO PUBLIC KEY (SOLANA ONLY) ---
app.get('/api/casino/publicKey', (_req, res) => {
  res.send(solana.getCasinoPublicKey());
});

// --- AUTH ---
app.post('/api/auth/login', loginUser);

// --- ADMIN ROUTES ---
// CORREÇÃO: Adicionado 'validateBet' para autenticar o administrador
app.post('/api/admin/emergency/toggle', validateBet as any, toggleEmergency as any); 
app.post('/api/admin/emergency/export', validateBet as any, exportBalances as any); 

// Bankroll Admin
app.get('/api/admin/bankroll', validateBet as any, getBankrollStatus as any);
app.post('/api/admin/bankroll/withdraw', validateBet as any, withdrawHouseFunds as any);

// --- DEPOSIT (SOL -> USD) ---
app.post(
  '/api/wallet/deposit',
  checkEmergencyState,
  async (req: FinancialRequest, res: Response) => {
    try {
      const { walletAddress, signature } = req.body;

      if (!signature) {
        return res.status(400).json({ error: 'Missing transaction signature.' });
      }

      // 1. Audit Solana Transaction
      const auditResult = await solana.auditRecentDeposits(walletAddress, signature);
      const amountSol = auditResult?.amountSol || 0;

      if (!auditResult || !auditResult.isConfirmed || amountSol <= 0) {
        return res.status(400).json({ error: 'Invalid Solana transaction.' });
      }

      // 2. Convert SOL -> USD
      const priceUsd = await priceOracle.getPrice('SOL');
      const amountUSD = amountSol * priceUsd;

      // 3. Credit User Balance
      const updatedUser = await User.findOneAndUpdate(
        { walletAddress: walletAddress.toLowerCase() },
        { $inc: { balance: amountUSD } },
        { new: true }
      );

      console.log(
        `💰 Deposit: ${amountSol} SOL @ $${priceUsd} = +$${amountUSD.toFixed(2)} USD`
      );

      res.json({ success: true, newBalance: updatedUser?.balance });

    } catch (error: any) {
      console.error('Deposit error:', error.message);
      res.status(500).json({ error: 'Deposit processing error.' });
    }
  }
);

// --- WITHDRAW (USD -> SOL) ---
app.post(
  '/api/wallet/withdraw',
  checkEmergencyState,
  async (req: FinancialRequest, res: Response) => {
    try {
      const { walletAddress, amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount.' });
      }

      // 1. Check Balance
      const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

      if (!user || user.balance < amount) {
        return res.status(400).json({ error: 'Insufficient USD balance.' });
      }

      // 2. Convert USD -> SOL
      const priceUsd = await priceOracle.getPrice('SOL');
      const solAmount = amount / priceUsd;

      if (solAmount < 0.001) {
        return res.status(400).json({ error: 'Amount too small to withdraw.' });
      }

      console.log(
        `💸 Withdraw: $${amount} USD -> ${solAmount.toFixed(4)} SOL`
      );

      // 3. Lock Funds
      user.balance -= amount;
      await user.save();

      try {
        // 4. Pay on Solana
        const result = await solana.processWithdrawal(walletAddress, solAmount);

        console.log(`✅ Paid! TX: ${result.tx}`);
        res.json({ success: true, newBalance: user.balance, tx: result.tx });

      } catch (blockchainError: any) {
        console.error('❌ Solana Error:', blockchainError.message);
        user.balance += amount;
        await user.save();
        res.status(500).json({ error: 'Solana payout failed. Funds refunded.' });
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