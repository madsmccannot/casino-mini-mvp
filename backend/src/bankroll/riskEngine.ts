import { bankrollService } from './bankroll.service';
import { RiskLimits, BankrollStatus } from '../types';

// Taxas de gestão de risco
const MAX_BANKROLL_EXPOSURE_PERCENT = 0.5; // Nunca arriscar mais de 0.5% da Banca Total numa única aposta
const MAX_ALLOWED_MULTIPLIER = 1000; // Multiplicador máximo geral (1000x)

// Limites específicos por jogo (exemplo, deve ser ajustado)
const DEFAULT_LIMITS: Record<string, RiskLimits> = {
    'dice': { maxPayoutMultiplier: 100, maxBetAmountSOL: 10 },
    'coinflip': { maxPayoutMultiplier: 1.99, maxBetAmountSOL: 50 },
    'roulette': { maxPayoutMultiplier: 14, maxBetAmountSOL: 50 },
    'plinko': { maxPayoutMultiplier: 110, maxBetAmountSOL: 5 },
    'mines': { maxPayoutMultiplier: 500, maxBetAmountSOL: 20 },
};

export const riskEngine = {

    /**
     * Obtém o estado atual da Banca e calcula os limites máximos permitidos.
     */
    getStatus: async (): Promise<BankrollStatus> => {
        const totalBalance = await bankrollService.getBankrollBalance();
        
        // Calculamos a exposição máxima em SOL
        const maxExposure = totalBalance * (MAX_BANKROLL_EXPOSURE_PERCENT / 100);

        return {
            totalBalance,
            maxRiskExposure: maxExposure,
            maxPayoutMultiplier: MAX_ALLOWED_MULTIPLIER,
        };
    },

    /**
     * Verifica se uma aposta excede os limites de risco do Casino.
     * @param game - O jogo a ser jogado.
     * @param wager - O valor apostado.
     * @param potentialMultiplier - O multiplicador que pode ser ganho (se conhecido, como no Dice/Coinflip).
     * @returns True se for seguro, ou uma string de erro.
     */
    validateBet: async (game: string, wager: number, potentialMultiplier: number): Promise<true | string> => {
        const { totalBalance, maxRiskExposure } = await riskEngine.getStatus();
        
        const gameLimits = DEFAULT_LIMITS[game] || DEFAULT_LIMITS['dice']; // Fallback
        
        const calculatedPayout = wager * potentialMultiplier;

        // 1. Verificar se o Multiplicador é demasiado alto para o jogo
        if (potentialMultiplier > gameLimits.maxPayoutMultiplier) {
            return `Multiplier ${potentialMultiplier.toFixed(2)}x exceeds the max limit for ${game} (${gameLimits.maxPayoutMultiplier}x).`;
        }

        // 2. Verificar se a aposta é maior que o limite fixo do jogo
        if (wager > gameLimits.maxBetAmountSOL) {
            return `Wager exceeds max allowed bet for ${game} (${gameLimits.maxBetAmountSOL} SOL).`;
        }

        // 3. Verificar se o PAGAMENTO TOTAL excede o limite de exposição da Banca
        if (calculatedPayout > maxRiskExposure) {
            return `Potential payout (${calculatedPayout.toFixed(4)} SOL) exceeds Casino's current risk limit of ${maxRiskExposure.toFixed(4)} SOL.`;
        }

        return true;
    }
};