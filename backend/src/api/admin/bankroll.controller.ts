import { Response } from 'express';
import { AuthRequest } from '../bets/validateBet.middleware';
import { bankrollService } from '../../bankroll/bankroll.service';
import { solanaWallet } from '../../wallet/solanaWallet';
import { shutdownService } from '../../emergency/shutdown.service'; 
import { logger } from '../../utils/logger';
import { PublicKey } from '@solana/web3.js';

/**
 * ROTA ADMIN: Obtém o estado atual da Banca e do Sistema
 */
export const getBankrollStatus = async (req: AuthRequest, res: Response) => {
    // Verificação de segurança (Admin Only)
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: "Access Denied" });
    }

    try {
        // 1. Obter saldo real da blockchain
        const balanceSol = await bankrollService.getHouseBalance();
        
        // 2. Obter estado de emergência
        // Se isSystemActive for FALSE, significa que a Emergência é TRUE (está parado)
        const isSystemActive = await shutdownService.isSystemActive();
        const isEmergency = !isSystemActive; 

        return res.json({
            address: solanaWallet.getAddress(),
            balanceSol: balanceSol,
            status: balanceSol > 1 ? 'HEALTHY' : 'LOW_FUNDS',
            isEmergency: isEmergency // O frontend usa isto para bloquear botões
        });

    } catch (error) {
        logger.error("Error fetching bankroll status", error);
        return res.status(500).json({ error: "Failed to fetch bankroll status" });
    }
};

/**
 * ROTA ADMIN: Levantar lucros da Casa (House Withdrawal)
 * O dono do casino retira dinheiro da banca para a sua carteira pessoal (cold wallet).
 */
export const withdrawHouseFunds = async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: "Access Denied" });
    }

    if (!solanaWallet.isEnabled()) {
        return res.status(503).json({ error: 'Custody is not configured. House withdrawals are disabled.' });
    }

    const { amount, targetAddress } = req.body;

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(amount * 1_000_000_000) || !targetAddress) {
        return res.status(400).json({ error: "Invalid amount or address" });
    }

    try {
        if (new PublicKey(targetAddress).toBase58() !== targetAddress) throw new Error('non-canonical address');
    } catch {
        return res.status(400).json({ error: "Invalid amount or address" });
    }

    try {
        logger.warn(`ADMIN ${req.user.walletAddress} requesting house withdrawal of ${amount} SOL to ${targetAddress}`);

        // Usamos o bankrollService para processar a saída
        const txSignature = await bankrollService.payoutUser(targetAddress, amount); 

        return res.json({
            success: true,
            message: "House withdrawal successful",
            tx: txSignature,
            amount: amount
        });

    } catch (error: any) {
        logger.error("House withdrawal failed", error);
        return res.status(500).json({ error: error.message || "Withdrawal failed" });
    }
};

/**
 * ROTA ADMIN: Gerar endereço para depósito de liquidez
 */
export const getDepositAddress = async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: "Access Denied" });
    }
    
    return res.json({ 
        address: solanaWallet.getAddress(),
        message: "Send SOL to this address to top-up the house bankroll."
    });
};
