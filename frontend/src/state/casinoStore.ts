import { create } from 'zustand';

// Interface for Game Result
export interface GameResult {
  id: string;
  game: 'coinflip' | 'dice' | 'roulette' | 'mines' | 'plinko' | 'crash' | 'limbo' | 'blackjack';
  wager: number;
  payout: number;
  win: boolean;
  timestamp: Date;
  outcomeString: string; 
}

// Interface for Global State
interface CasinoState {
  balance: number;       // Canonical account balance in USDC
  solPrice: number;      // Deprecated compatibility alias; USDC is USD-pegged
  isSoundEnabled: boolean;
  isAuthenticated: boolean; // Estado de login
  recentGames: GameResult[];
  
  // Actions
  setBalance: (amount: number) => void;
  addToBalance: (amount: number) => void;
  toggleSound: () => void;
  setAuthenticated: (status: boolean) => void;
  addGameResult: (result: Omit<GameResult, 'id' | 'timestamp'>) => void;
  
  // Helpers
  getDisplayValue: (amountInUsdc: number, inUsd: boolean) => string;
  getBetAmountInSol: (inputValue: number, isUsdInput: boolean) => number;
}

export const useCasinoStore = create<CasinoState>((set, get) => ({
  balance: 0,        // Starts at 0 until wallet connects
  solPrice: 1,
  isSoundEnabled: true,
  isAuthenticated: false,
  recentGames: [],

  setBalance: (amount) => set({ balance: amount }),
  
  addToBalance: (amount) => set((state) => ({ 
    balance: state.balance + amount 
  })),

  toggleSound: () => set((state) => ({ 
    isSoundEnabled: !state.isSoundEnabled 
  })),

  setAuthenticated: (status) => set({ isAuthenticated: status }),

  addGameResult: (result) => set((state) => ({
    recentGames: [
        { 
          ...result, 
          id: Math.random().toString(36).substr(2, 9), 
          timestamp: new Date() 
        }, 
        ...state.recentGames
    ].slice(0, 10) // Mantém apenas os últimos 10
  })),

  // USDC is the accounting unit; the compatibility name remains for game components.
  getDisplayValue: (amountInUsdc, inUsd) => {
    if (inUsd) return `$${amountInUsdc.toFixed(2)}`;
    return `${amountInUsdc.toFixed(2)} USDC`;
  },

  // Converts a display amount to the canonical USDC amount.
  getBetAmountInSol: (inputValue) => {
    return inputValue;
  }
}));
