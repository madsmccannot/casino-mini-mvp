import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCasinoStore } from '../state/casinoStore';
import { toast } from 'react-hot-toast';
import bs58 from 'bs58';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const useWalletAuth = () => {
  const { publicKey, connected, signMessage, disconnect } = useWallet();
  const { setBalance, setAuthenticated } = useCasinoStore(); // Assume que adicionaste setAuthenticated à store, se não, ignora
  
  // Ref para evitar loops infinitos de login se o useEffect disparar várias vezes
  const isLoggingIn = useRef(false);

  useEffect(() => {
    const login = async () => {
      // Só tentamos logar se estiver conectado, tivermos chave pública e função de assinar
      if (connected && publicKey && signMessage && !isLoggingIn.current) {
        
        // Verifica se já temos token válido para não pedir assinatura sempre (Melhora UX)
        const savedToken = localStorage.getItem('token');
        const savedWallet = localStorage.getItem('walletAddress');
        
        // Se a carteira mudou ou não há token, fazemos login novo
        if (savedWallet !== publicKey.toString() || !savedToken) {
            
            try {
                isLoggingIn.current = true;
                const walletAddress = publicKey.toString();
                
                // 1. Mensagem para assinar (Pode incluir timestamp para evitar replay attacks)
                const messageContent = `Login to SolCasino: ${new Date().getTime()}`;
                const messageEncoded = new TextEncoder().encode(messageContent);

                toast.loading("Please sign the message to login...", { id: 'auth-toast' });

                // 2. Pedir Assinatura à Phantom/Solflare
                const signatureUint8 = await signMessage(messageEncoded);
                const signature = bs58.encode(signatureUint8); // Envia como string base58

                // 3. Enviar para Backend
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        walletAddress,
                        message: messageContent,
                        signature 
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    // 4. Sucesso: Guardar Token e Estado
                    localStorage.setItem('token', data.token); // O "Passaporte"
                    localStorage.setItem('walletAddress', walletAddress);
                    
                    setBalance(data.user.balance);
                    // setAuthenticated(true); // Se tiveres este estado na store
                    
                    toast.success("Login successful!", { id: 'auth-toast' });
                    console.log("✅ Authenticated as:", walletAddress);
                } else {
                    throw new Error(data.error || "Login failed");
                }

            } catch (error: any) {
                console.error("Auth Error:", error);
                toast.error(error.message || "Authentication failed", { id: 'auth-toast' });
                disconnect(); // Desliga a carteira se falhar a assinatura para tentar de novo
                localStorage.removeItem('token');
            } finally {
                isLoggingIn.current = false;
            }
        } else {
             // Lógica opcional: Validar se o token antigo ainda é válido (ex: fetch /me)
             // Por agora, assumimos que sim para o MVP
             console.log("♻️ Session restored for:", publicKey.toString());
        }
      }
    };

    login();
  }, [connected, publicKey, signMessage, setBalance, disconnect]);
};