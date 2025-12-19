import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCasinoStore } from '../state/casinoStore';
import { toast } from 'react-hot-toast';

const API_URL = 'http://localhost:3001/api';

export const useWalletAuth = () => {
  const { publicKey, connected } = useWallet();
  const { setBalance } = useCasinoStore();

  useEffect(() => {
    const login = async () => {
      if (connected && publicKey) {
        try {
          const walletAddress = publicKey.toString();
          
          // --- LINHA NOVA: Guardar no LocalStorage para a API usar ---
          localStorage.setItem('walletAddress', walletAddress);

          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress }),
          });

          const data = await response.json();

          if (data.success) {
            setBalance(data.user.balance);
            console.log("✅ Login Backend:", data.user.balance, "SOL");
          } else {
             toast.error("Falha ao carregar perfil");
          }

        } catch (error) {
          console.error("Erro de Auth:", error);
        }
      }
    };

    login();
  }, [connected, publicKey, setBalance]);
};