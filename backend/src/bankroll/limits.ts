import { RiskLimits } from '../types';

// --- CONSTANTES DE LIMITE GERAL ---
export const MIN_BET_SOL = 0.001; // Aposta mínima em SOL
export const MAX_BET_SOL = 50.0;  // Aposta máxima em SOL (depende do Bankroll)

// Limite de Multiplicador Geral: usado para jogos com multiplicadores variáveis (ex: Plinko, Mines)
export const MAX_MULTIPLIER_GLOBAL = 1000; 

// --- LIMITES ESPECÍFICOS POR JOGO ---

// Estes limites fixos são usados pelo riskEngine para verificar a aposta inicial.
// Os valores são em SOL ou Multiplicador Máximo.

export const GAME_LIMITS: Record<string, RiskLimits> = {
    // Dice: Multiplicador máximo é 98x (se apostar Roll Under 1.01)
    'dice': { 
        maxPayoutMultiplier: 98.0, 
        maxBetAmountSOL: 50.0 
    },
    
    // Coinflip: Multiplicador fixo (geralmente 1.98x - 2x)
    'coinflip': { 
        maxPayoutMultiplier: 1.98, 
        maxBetAmountSOL: 100.0 
    },
    
    // Roulette: O máximo é 36x (para apostar no 0)
    'roulette': { 
        maxPayoutMultiplier: 36.0, // 36x (se apostar num único número, 1:35 payout)
        maxBetAmountSOL: 50.0 
    },
    
    // Plinko: Multiplicador máximo depende do número de linhas, mas é limitado
    'plinko': { 
        maxPayoutMultiplier: 110.0, // Multiplicador máximo para Plinko de 16 linhas
        maxBetAmountSOL: 5.0 // Aposta máxima mais baixa devido ao risco de multiplicador alto
    },
    
    // Mines: Multiplicador pode ser muito alto (limite na lógica do jogo)
    'mines': { 
        maxPayoutMultiplier: 1000.0, // Limitado pelo número máximo de minas e revelações
        maxBetAmountSOL: 20.0 
    },
};

/**
 * Função utilitária para obter os limites para um jogo específico.
 * @param game - O nome do jogo.
 * @returns Os limites de risco para esse jogo.
 */
export const getGameLimits = (game: string): RiskLimits => {
    return GAME_LIMITS[game] || GAME_LIMITS['dice']; // Fallback para Dice
};