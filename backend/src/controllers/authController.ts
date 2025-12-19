import { Request, Response } from 'express';
import { User } from '../models/User';
import nacl from 'tweetnacl'; // Criptografia
import bs58 from 'bs58';       // Codificação Solana
import jwt from 'jsonwebtoken'; // Token de Sessão

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { walletAddress, signature, message } = req.body;

    // 1. Validações Básicas
    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ error: "Dados de login incompletos" });
    }

    // 2. VERIFICAÇÃO CRIPTOGRÁFICA (A parte "Profissional")
    try {
      // Converte tudo para Uint8Array para o NaCl verificar
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = bs58.decode(signature);
      const publicKeyBytes = bs58.decode(walletAddress);

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
      { walletAddress: walletAddress.toLowerCase() },
      { 
        $setOnInsert: { 
          walletAddress: walletAddress.toLowerCase(),
          balance: 0, 
          createdAt: new Date() 
        },
        $set: { lastLogin: new Date() } // Atualiza último login
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 4. Gerar JWT (Sessão Segura)
    const token = jwt.sign(
      { id: user._id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET || 'dev-secret-do-not-use-in-prod', // Usa variável de ambiente em PROD!
      { expiresIn: '24h' }
    );

    console.log(`👤 Auth Success: ${walletAddress.slice(0,6)}...`);

    // 5. Retornar User + Token
    res.json({
      success: true,
      token, // O Frontend vai guardar isto
      user: {
        walletAddress: user.walletAddress,
        balance: user.balance,
      }
    });

  } catch (error: any) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Erro no servidor ao fazer login" });
  }
};