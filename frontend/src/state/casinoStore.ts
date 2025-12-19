import { create } from 'zustand';

// Interface for Game Result
export interface GameResult {
  id: string;
  game: 'coinflip' | 'dice' | 'roulette' | 'mines' | 'plinko';
  wager: number;
  payout: number;
  win: boolean;
  timestamp: Date;
  outcomeString: string; 
}

// Interface for Global State
interface CasinoState {
  balance: number;       // Real SOL Balance
  solPrice: number;      // USD Price (Simulated)
  isSoundEnabled: boolean;
  isAuthenticated: boolean; // <--- NOVO: Estado de autenticação
  recentGames: GameResult[];
  
  // Actions
  setBalance: (amount: number) => void;
  addToBalance: (amount: number) => void;
  toggleSound: () => void;
  setAuthenticated: (status: boolean) => void; // <--- NOVO: Ação para mudar o estado
  addGameResult: (result: Omit<GameResult, 'id' | 'timestamp'>) => void;
  
  // Helpers
  getDisplayValue: (amountInSol: number, inUsd: boolean) => string;
  getBetAmountInSol: (inputValue: number, isUsdInput: boolean) => number;
}

export const useCasinoStore = create<CasinoState>((set, get) => ({
  balance: 0,       // Starts at 0 until wallet connects
  solPrice: 150,    // Fixed simulated price
  isSoundEnabled: true,
  isAuthenticated: false, // <--- NOVO: Começa como falso
  recentGames: [],

  setBalance: (amount) => set({ balance: amount }),
  
  addToBalance: (amount) => set((state) => ({ 
    balance: state.balance + amount 
  })),

  toggleSound: () => set((state) => ({ 
    isSoundEnabled: !state.isSoundEnabled 
  })),

  // <--- NOVO: Função para atualizar a autenticação
  setAuthenticated: (status) => set({ isAuthenticated: status }),

  addGameResult: (result) => set((state) => ({
    recentGames: [
        { 
          ...result, 
          id: Math.random().toString(36).substr(2, 9), 
          timestamp: new Date() 
        }, 
        ...state.recentGames
    ].slice(0, 10)
  })),

  getDisplayValue: (amountInSol, inUsd) => {
    if (inUsd) {
      return `$${(amountInSol * get().solPrice).toFixed(2)}`;
    }
    return `${amountInSol.toFixed(4)} SOL`;
  },

  getBetAmountInSol: (inputValue, isUsdInput) => {
    if (!isUsdInput) return inputValue;
    return inputValue / get().solPrice;
  }
}));