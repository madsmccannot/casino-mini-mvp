import { Request, Response } from 'express';
import { User } from '../models/User';

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "Carteira obrigatória" });
    }

    // A Magia do MongoDB:
    // Procura pela wallet. Se não encontrar, CRIA uma nova (upsert: true).
    // Devolve o utilizador atualizado/novo (new: true).
    let user = await User.findOneAndUpdate(
      { walletAddress: walletAddress.toLowerCase() },
      { 
        $setOnInsert: { 
          walletAddress: walletAddress.toLowerCase(),
          balance: 0, // Começa com 0
          createdAt: new Date() 
        } 
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`👤 Login: ${walletAddress.slice(0,6)}... | Saldo: ${user.balance} SOL`);

    res.json({
      success: true,
      user: {
        walletAddress: user.walletAddress,
        balance: user.balance,
        // Futuramente podemos adicionar um token de sessão aqui
      }
    });

  } catch (error: any) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Erro no servidor ao fazer login" });
  }
};