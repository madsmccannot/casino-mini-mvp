import { useCallback, useState } from 'react';
import { useInjectedSolanaWallet } from './useInjectedSolanaWallet';
import { useWalletStore } from '../state/walletStore';
import { useCasinoStore } from '../state/casinoStore';
import { useUIStore } from '../state/uiStore';
import bs58 from 'bs58';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const useWalletAuth = () => {
    // Hooks da Wallet Solana
    const { publicKey, signMessage, disconnect: disconnectWallet } = useInjectedSolanaWallet();
    
    // Hooks das nossas Stores
    const { setWalletSession, disconnect: disconnectStore, token } = useWalletStore();
    const { setAuthenticated, setBalance, isAuthenticated } = useCasinoStore();
    const t = useUIStore((state) => state.t);

    const [isLoggingIn, setIsLoggingIn] = useState(false);

    /**
     * Função Principal de Login
     * 1. Pede assinatura
     * 2. Envia para API
     * 3. Guarda Sessão
     */
    const login = useCallback(async () => {
        // Verificações de segurança básicas
        if (!publicKey || !signMessage) return;
        
        // Se já estamos autenticados no backend, não fazemos nada
        if (isAuthenticated && token) return;

        setIsLoggingIn(true);
        const toastId = toast.loading("Verifying wallet ownership...", { id: 'auth-toast' });

        try {
            const walletAddress = publicKey.toBase58();

            // 1. Obter um desafio curto, único e expirável do backend.
            const challengeResponse = await fetch(
                `${API_URL}/auth/challenge?walletAddress=${encodeURIComponent(walletAddress)}`
            );
            const challenge = await challengeResponse.json();
            if (!challengeResponse.ok) throw new Error(challenge.error || 'Unable to create login challenge');

            const messageString = challenge.message;
            const messageEncoded = new TextEncoder().encode(messageString);

            // 2. Pedir assinatura à Phantom/Solflare
            const signatureUint8 = await signMessage(messageEncoded);
            const signature = bs58.encode(signatureUint8);

            // 3. Enviar para o Backend
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress,
                    signature,
                    message: messageString,
                    nonce: challenge.nonce
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Login failed');

            if (data.success) {
                // 4. Sucesso! Atualizar Stores Globais
                setWalletSession(walletAddress, data.token); // Guarda token no WalletStore (e localStorage)
                setBalance(data.user.balance);               // Atualiza saldo no CasinoStore
                setAuthenticated(true);                      // Marca como autenticado
                
                toast.success("Login successful!", { id: toastId });
                console.log("✅ Auth Success:", walletAddress);
            }

        } catch (error: any) {
            console.error("Auth Error:", error);
            toast.error("Authentication failed. Please try again.", { id: toastId });
            
            // Se falhar o login no backend, desconectamos a carteira visualmente para o user tentar de novo
            disconnectWallet(); 
            disconnectStore();
        } finally {
            setIsLoggingIn(false);
        }
    }, [publicKey, signMessage, isAuthenticated, token, setWalletSession, setBalance, setAuthenticated, disconnectWallet, disconnectStore]);

    /**
     * Função de Logout completa
     */
    const disconnect = useCallback(() => {
        disconnectStore();  // Limpa token e address do store/localstorage
        disconnectWallet(); // Desconecta Phantom
        setAuthenticated(false);
        setBalance(0);
        // toast('Logged out', { icon: '👋' });
    }, [disconnectStore, disconnectWallet, setAuthenticated, setBalance]);

    return {
        login,
        disconnect,
        isLoggingIn,
        isAuthenticated // Exportamos para o Layout saber se deve pedir login
    };
};
