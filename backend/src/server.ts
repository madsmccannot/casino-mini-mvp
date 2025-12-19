import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv'; 
import { connectDB } from './config/db'; 
import { loginUser } from './controllers/authController'; 
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

// --- CONFIG ---
dotenv.config(); 
connectDB(); 
switchboardRNG.init(); // Inicia RNG (ou fallback seguro)

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- ROOT ---
app.get('/', (_req, res) => {
  res.json({ status: 'SolCasino Backend Online 🚀', mode: 'SOL_NATIVE' });
});

// --- AUTH ---
app.post('/api/auth/login', loginUser);

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
      const { walletAddress, signature } = req.body;

      if (!signature || !walletAddress) {
        return res.status(400).json({ error: 'Missing signature or wallet address.' });
      }

      // 1. Auditar Transação na Blockchain
      const auditResult = await solana.auditRecentDeposits(walletAddress, signature);
      
      if (!auditResult || !auditResult.isConfirmed || auditResult.amountSol <= 0) {
        return res.status(400).json({ error: 'Invalid or unconfirmed Solana transaction.' });
      }

      const amountSol = auditResult.amountSol;

      // 2. Creditar Saldo em SOL (Sem conversão USD)
      const updatedUser = await User.findOneAndUpdate(
        { walletAddress: walletAddress.toLowerCase() },
        { $inc: { balance: amountSol } },
        { new: true }
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
      const { amount } = req.body;
      const user = req.user; // O middleware já carregou o user seguro

      if (!user) return res.status(401).json({ error: "Unauthorized" });

      if (!amount || amount <= 0) {
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