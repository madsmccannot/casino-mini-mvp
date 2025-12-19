import { Request, Response, NextFunction } from 'express';
import { User } from '../../models/User';

export interface AuthRequest extends Request {
  user?: any;
}

export const validateBet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Tenta encontrar o endereço em 3 sítios: Body (POST), Query (GET url) ou Headers (Standard)
    let walletAddress = req.body.walletAddress || req.query.walletAddress || req.headers['x-wallet-address'];
    
    // Se o endereço vier num array (raro, mas possível em headers), pegamos o primeiro
    if (Array.isArray(walletAddress)) walletAddress = walletAddress[0];

    if (!walletAddress) {
      return res.status(401).json({ error: 'Unauthorized: Wallet address required' });
    }

    // Buscar utilizador à BD (case insensitive)
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found in DB.' });
    }

    // Anexa o user ao request
    req.user = user;

    // Se for uma rota de Admin, não precisamos de validar saldo de aposta, apenas autenticar
    if (req.path.includes('/admin')) {
        return next();
    }

    // Lógica existente para jogos (Mines, etc.)
    const { betAmount, game, action } = req.body;
    if (game === 'mines' && (action === 'reveal' || action === 'cashout')) {
      return next();
    }

    // Validações de aposta (apenas se houver betAmount)
    if (betAmount !== undefined) {
        if (betAmount <= 0) return res.status(400).json({ error: 'Invalid bet amount' });
        if (user.balance < betAmount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }
    }
    
    next();
  } catch (error) {
    console.error('Auth validation error:', error);
    return res.status(500).json({ error: 'Internal server error during validation' });
  }
};