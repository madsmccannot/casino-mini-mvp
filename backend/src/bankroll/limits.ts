import { RiskLimits } from '../types';

// --- CONSTANTES GERAIS ---
export const MIN_BET_SOL = 0.001; 
export const MAX_BET_SOL = 50.0;  // Teto máximo absoluto

// Killswitch: Nenhum jogo pode pagar mais que 1000x (ex: Mines super agressivo)
export const MAX_MULTIPLIER_GLOBAL = 1000; 

// --- LIMITES POR JOGO ---
export const GAME_LIMITS: Record<string, RiskLimits> = {
    'dice': { 
        maxPayoutMultiplier: 99.0,
        maxBetAmountSOL: 20.0 
    },
    'coinflip': { 
        maxPayoutMultiplier: 2.0, 
        maxBetAmountSOL: 20.0 
    },
    'roulette': { 
        maxPayoutMultiplier: 36.0, 
        maxBetAmountSOL: 10.0 
    },
    'plinko': { 
        maxPayoutMultiplier: 1000.0,
        maxBetAmountSOL: 5.0 
    },
    'mines': { 
        maxPayoutMultiplier: 1000.0, 
        maxBetAmountSOL: 10.0 
    },
};

export const getGameLimits = (game: string): RiskLimits => {
    return GAME_LIMITS[game] || GAME_LIMITS['dice'];
};
