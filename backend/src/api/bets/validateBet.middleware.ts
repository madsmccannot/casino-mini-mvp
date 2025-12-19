import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../models/User';

export interface AuthRequest extends Request {
  user?: any;
}

export const validateBet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 1. SEGURANÇA: Validar Token JWT (Bearer Token)
    // O Frontend envia: "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Se for rota de admin, talvez tenha outra lógica, mas por defeito bloqueia
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'dev-secret-do-not-use-in-prod';

    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // 2. Buscar User Fresco na BD
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;

    // Se for Admin, passa direto
    if (req.path.includes('/admin')) return next();

    // 3. Validações de Saldo (Lógica de Jogo)
    const { betAmount, game, action } = req.body;
    
    // Ignora validação de saldo para ações secundárias do Mines (reveal/cashout)
    if (game === 'mines' && (action === 'reveal' || action === 'cashout')) {
      return next();
    }

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