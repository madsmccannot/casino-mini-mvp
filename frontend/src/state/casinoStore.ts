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
  balance: number;       // Saldo em SOL
  solPrice: number;      // Preço simulado ou real (via Oracle)
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
  getDisplayValue: (amountInSol: number, inUsd: boolean) => string;
  getBetAmountInSol: (inputValue: number, isUsdInput: boolean) => number;
}

export const useCasinoStore = create<CasinoState>((set, get) => ({
  balance: 0,        // Starts at 0 until wallet connects
  solPrice: 150,     // Fixed simulated price (or fetch from Oracle in future)
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

  // Formata o valor para exibição (ex: 0.5000 SOL ou $75.00)
  getDisplayValue: (amountInSol, inUsd) => {
    if (inUsd) {
      return `$${(amountInSol * get().solPrice).toFixed(2)}`;
    }
    return `${amountInSol.toFixed(4)} SOL`;
  },

  // Converte input de aposta para SOL
  getBetAmountInSol: (inputValue, isUsdInput) => {
    if (!isUsdInput) return inputValue;
    return inputValue / get().solPrice;
  }
}));
