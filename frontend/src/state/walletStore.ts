import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useCasinoStore } from './casinoStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface WalletState {
  address: string | null;
  token: string | null;
  isConnected: boolean;

  // Ações de Estado (Sync)
  setWalletSession: (address: string, token: string) => void;
  disconnect: () => void;
  
  // Ações Async (Helpers)
  refreshBalance: () => Promise<void>;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      address: null,
      token: null,
      isConnected: false,

      // 1. Define a sessão (Chamado pelo useWalletAuth após login com sucesso)
      setWalletSession: (address, token) => {
        set({ 
            address, 
            token, 
            isConnected: true 
        });
      },

      // 2. Logout / Limpeza
      disconnect: () => {
        set({ address: null, token: null, isConnected: false });
        useCasinoStore.getState().setBalance(0);
        useCasinoStore.getState().setAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('walletAddress');
      },

      // 3. Atualizar saldo usando o Token guardado
      refreshBalance: async () => {
        const { token } = get();
        if (!token) return;

        try {
          // Se tiveres a rota /auth/me implementada:
          /*
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            useCasinoStore.getState().setBalance(data.balance);
          }
          */
         // Por enquanto, como o backend retorna saldo no login e nos jogos,
         // isto fica preparado para o futuro.
        } catch (error) {
          console.error('Balance refresh error:', error);
        }
      },
    }),
    {
      name: 'casino-wallet-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        address: state.address, 
        token: state.token, 
        isConnected: state.isConnected 
      }),
    }
  )
);