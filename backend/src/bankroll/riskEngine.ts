import { getGameLimits, MAX_MULTIPLIER_GLOBAL } from './limits';
import { bankrollRouter } from './BankrollRouter';
import { solToLamports, lamportsToSol } from '../ledger/casinoLedger.service';

// Regra de Ouro: Nunca arriscar mais de 1% da banca numa única aposta.
// Se a banca tiver 100 SOL, o pagamento máximo possível é 1 SOL.
export const riskEngine = {

    /**
     * Calcula o estado de risco atual
     */
    getStatus: async (game = 'dice') => {
        return bankrollRouter.execute(async provider => {
            const limits = await provider.getLimits(game, 'SOL');
            return {
                provider: provider.name,
                totalBalance: lamportsToSol(limits.availableLiquidityMinor),
                maxRiskExposure: lamportsToSol(limits.maxPayoutMinor),
                maxPayoutMultiplier: Number(limits.maxMultiplierBps) / 10_000,
                validUntil: limits.validUntil
            };
        });
    },

    /**
     * Valida se uma aposta é segura
     */
    validateBet: async (game: string, wager: number, potentialMultiplier: number): Promise<true | string> => {
        if (wager <= 0) return "Bet amount must be positive";

        // 1. Limites do Jogo (Estáticos)
        const gameLimits = getGameLimits(game);

        // 2. Estado da Banca (Dinâmico)
        const providerLimits = await bankrollRouter.execute(provider => provider.getLimits(game, 'SOL'));
        const maxRiskExposure = lamportsToSol(providerLimits.maxPayoutMinor);
        
        const calculatedMaxPayout = wager * potentialMultiplier;

        // CHECK A: Multiplicador ilegal?
        if (potentialMultiplier > gameLimits.maxPayoutMultiplier) {
            return `Multiplier ${potentialMultiplier.toFixed(2)}x exceeds limit for ${game}`;
        }

        if (BigInt(Math.ceil(potentialMultiplier * 10_000)) > providerLimits.maxMultiplierBps) {
            return `Multiplier ${potentialMultiplier.toFixed(2)}x exceeds provider limit`;
        }

        // CHECK B: Aposta acima do teto fixo?
        if (wager > gameLimits.maxBetAmountSOL) {
            return `Wager exceeds max allowed for ${game} (${gameLimits.maxBetAmountSOL} SOL)`;
        }

        if (solToLamports(wager) > providerLimits.maxBetMinor) return 'Wager exceeds provider maximum stake';

        // CHECK C: Risco de Ruína (O mais importante)
        // O casino tem dinheiro para pagar se o jogador ganhar?
        if (calculatedMaxPayout > maxRiskExposure) {
            return `Max potential payout (${calculatedMaxPayout.toFixed(4)} SOL) exceeds casino risk limit. Lower your bet.`;
        }

        return true;
    }
};
