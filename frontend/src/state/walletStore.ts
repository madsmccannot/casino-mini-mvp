import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useCasinoStore } from './casinoStore';

// GARANTE QUE A PORTA É 3001 (A mesma do server.ts)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface WalletState {
  address: string | null;
  token: string | null;
  isConnected: boolean;
  isConnecting: boolean;

  connect: (address: string) => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      address: null,
      token: null,
      isConnected: false,
      isConnecting: false,

      connect: async (walletAddress: string) => {
        set({ isConnecting: true });
        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress }),
          });

          if (!response.ok) throw new Error('Login failed');

          const data = await response.json();

          set({
            address: walletAddress,
            token: data.token,
            isConnected: true,
          });

          // Atualiza saldo visual
          useCasinoStore.getState().setBalance(data.user.balance);

        } catch (error) {
          console.error('Wallet connection error:', error);
          // Opcional: toast.error("Login failed")
        } finally {
          set({ isConnecting: false });
        }
      },

      disconnect: () => {
        set({ address: null, token: null, isConnected: false });
        useCasinoStore.getState().setBalance(0);
      },

      refreshBalance: async () => {
        const { token } = get();
        if (!token) return;

        try {
          // Nota: Verifica se tens a rota /auth/me criada no backend. 
          // Se não tiveres, o login já atualiza o saldo, por isso isto é opcional.
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            useCasinoStore.getState().setBalance(data.balance);
          }
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