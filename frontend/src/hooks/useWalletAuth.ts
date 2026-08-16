import { useCallback, useState } from 'react';
import { useEvmWallet } from './useEvmWallet';
import { useWalletStore } from '../state/walletStore';
import { useCasinoStore } from '../state/casinoStore';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const useWalletAuth = () => {
  const { address, chainId, signMessage, disconnect: disconnectWallet } = useEvmWallet();
  const { setWalletSession, disconnect: disconnectStore, token } = useWalletStore();
  const { setBalance, setAuthenticated, isAuthenticated } = useCasinoStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const login = useCallback(async () => {
    if (!address || !chainId || isLoggingIn) return;
    if (isAuthenticated && token) return;

    setIsLoggingIn(true);
    const toastId = toast.loading('Verifying wallet ownership...', { id: 'auth-toast' });
    try {
      const challengeResponse = await fetch(
        `${API_URL}/auth/challenge?address=${encodeURIComponent(address)}&chainId=${chainId}`,
      );
      const challenge = await challengeResponse.json();
      if (!challengeResponse.ok) throw new Error(challenge.error || 'Unable to create login challenge');

      const signature = await signMessage(challenge.message);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, chainId, signature, message: challenge.message, nonce: challenge.nonce }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');

      setWalletSession(address, data.token, chainId);
      setBalance(Number(data.user.balanceUsdc ?? data.user.balance ?? 0));
      setAuthenticated(true);
      toast.success('Wallet connected', { id: toastId });
    } catch (error) {
      console.error('EVM auth error:', error);
      toast.error(error instanceof Error ? error.message : 'Authentication failed', { id: toastId });
      await disconnectWallet().catch(() => undefined);
      disconnectStore();
    } finally {
      setIsLoggingIn(false);
    }
  }, [address, chainId, disconnectStore, disconnectWallet, isAuthenticated, isLoggingIn, setAuthenticated, setBalance, setWalletSession, signMessage, token]);

  const disconnect = useCallback(async () => {
    disconnectStore();
    await disconnectWallet().catch(() => undefined);
    setAuthenticated(false);
    setBalance(0);
  }, [disconnectStore, disconnectWallet, setAuthenticated, setBalance]);

  return { login, disconnect, isLoggingIn, isAuthenticated };
};
