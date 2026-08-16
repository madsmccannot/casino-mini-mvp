import { Response } from 'express';
import { AuthRequest } from '../bets/validateBet.middleware';
import { bankrollService } from '../../bankroll/bankroll.service';
import { shutdownService } from '../../emergency/shutdown.service'; 
import { logger } from '../../utils/logger';
import { bankrollRouter } from '../../bankroll/BankrollRouter';
import { getAggregatedExposure } from '../../bankroll/exposure/exposure.service';

/**
 * ROTA ADMIN: Obtém o estado atual da Banca e do Sistema
 */
export const getBankrollStatus = async (req: AuthRequest, res: Response) => {
    // Verificação de segurança (Admin Only)
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: "Access Denied" });
    }

    try {
        const provider = bankrollRouter.selected();
        const health = await provider.getHealth();
        const balanceSol = await bankrollService.getHouseBalance();
        const exposure = await getAggregatedExposure();
        
        // 2. Obter estado de emergência
        // Se isSystemActive for FALSE, significa que a Emergência é TRUE (está parado)
        const isSystemActive = await shutdownService.isSystemActive();
        const isEmergency = !isSystemActive; 

        return res.json({
            provider: provider.name,
            providerHealth: health,
            balanceSol: balanceSol,
            exposure,
            status: health.state,
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

    return res.status(503).json({
        error: 'Direct house-wallet withdrawals are retired. Liquidity operations must use an approved provider-native workflow.'
    });
};

/**
 * ROTA ADMIN: Gerar endereço para depósito de liquidez
 */
export const getDepositAddress = async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: "Access Denied" });
    }
    
    return res.status(503).json({
        error: 'Legacy house-wallet funding is retired. Use an approved provider-native liquidity workflow.'
    });
};
