import { bankrollService } from './bankroll.service';
import { getGameLimits, MAX_MULTIPLIER_GLOBAL } from './limits';
import { BankrollStatus } from '../types';

// Regra de Ouro: Nunca arriscar mais de 1% da banca numa única aposta.
// Se a banca tiver 100 SOL, o pagamento máximo possível é 1 SOL.
const MAX_BANKROLL_EXPOSURE_PERCENT = 1.0; 

export const riskEngine = {

    /**
     * Calcula o estado de risco atual
     */
    getStatus: async (): Promise<BankrollStatus> => {
        const totalBalance = await bankrollService.getHouseBalance();
        
        const maxExposure = totalBalance * (MAX_BANKROLL_EXPOSURE_PERCENT / 100);

        return {
            totalBalance,
            maxRiskExposure: maxExposure,
            maxPayoutMultiplier: MAX_MULTIPLIER_GLOBAL,
        };
    },

    /**
     * Valida se uma aposta é segura
     */
    validateBet: async (game: string, wager: number, potentialMultiplier: number): Promise<true | string> => {
        if (wager <= 0) return "Bet amount must be positive";

        // 1. Limites do Jogo (Estáticos)
        const gameLimits = getGameLimits(game);

        // 2. Estado da Banca (Dinâmico)
        const { maxRiskExposure } = await riskEngine.getStatus();
        
        const calculatedMaxPayout = wager * potentialMultiplier;

        // CHECK A: Multiplicador ilegal?
        if (potentialMultiplier > gameLimits.maxPayoutMultiplier) {
            return `Multiplier ${potentialMultiplier.toFixed(2)}x exceeds limit for ${game}`;
        }

        // CHECK B: Aposta acima do teto fixo?
        if (wager > gameLimits.maxBetAmountSOL) {
            return `Wager exceeds max allowed for ${game} (${gameLimits.maxBetAmountSOL} SOL)`;
        }

        // CHECK C: Risco de Ruína (O mais importante)
        // O casino tem dinheiro para pagar se o jogador ganhar?
        if (calculatedMaxPayout > maxRiskExposure) {
            return `Max potential payout (${calculatedMaxPayout.toFixed(4)} SOL) exceeds casino risk limit. Lower your bet.`;
        }

        return true;
    }
};