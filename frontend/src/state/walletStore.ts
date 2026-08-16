import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useCasinoStore } from './casinoStore';

interface WalletState {
  address: string | null;
  chainId: number | null;
  token: string | null;
  isConnected: boolean; // Indica se está logado no BACKEND

  // Ações
  setWalletSession: (address: string, token: string, chainId: number) => void;
  disconnect: () => void;
  
  // Helpers
  getAuthHeaders: () => { Authorization?: string };
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      address: null,
      chainId: null,
      token: null,
      isConnected: false,

      // 1. Define a sessão (Chamado pelo useWalletAuth após login com sucesso)
      setWalletSession: (address, token, chainId) => {
        set({ 
            address,
            chainId,
            token,
            isConnected: true,
        });
      },

      // 2. Logout / Limpeza Completa
      disconnect: () => {
        set({ address: null, chainId: null, token: null, isConnected: false });
        
        // Limpa também o estado do Casino (Saldo e Auth Flag)
        useCasinoStore.getState().setBalance(0);
        useCasinoStore.getState().setAuthenticated(false);
        
        // Limpeza de segurança do LocalStorage
        localStorage.removeItem('token');
        localStorage.removeItem('walletAddress');
      },

      // 3. Helper para cabeçalhos de API
      getAuthHeaders: () => {
        const { token } = get();
        return token ? { Authorization: `Bearer ${token}` } : {};
      }
    }),
    {
      name: 'casino-wallet-storage', // Nome da chave no localStorage
      storage: createJSONStorage(() => localStorage),
      // Apenas persistimos o que é essencial
      partialize: (state) => ({ 
        address: state.address, 
        chainId: state.chainId,
        token: state.token, 
        isConnected: state.isConnected 
      }),
    }
  )
);
