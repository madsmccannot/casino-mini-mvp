import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore } from 'react';

type ProviderName = 'phantom' | 'solflare';

interface InjectedProvider {
  publicKey?: { toString(): string };
  isConnected?: boolean;
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey?: { toString(): string } }>;
  disconnect(): Promise<void>;
  signMessage(message: Uint8Array, encoding?: string): Promise<{ signature: Uint8Array } | Uint8Array>;
  on?(event: 'accountChanged' | 'disconnect', handler: () => void): void;
  removeListener?(event: 'accountChanged' | 'disconnect', handler: () => void): void;
}

interface WalletContextValue {
  address: string | null;
  publicKey: { toString(): string; toBase58(): string } | null;
  connected: boolean;
  providerName: ProviderName | null;
  availableProviders: ProviderName[];
  connect(name: ProviderName): Promise<void>;
  disconnect(): Promise<void>;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

function getProvider(name: ProviderName): InjectedProvider | null {
  if (typeof window === 'undefined') return null;
  const browser = window as typeof window & {
    phantom?: { solana?: InjectedProvider };
    solflare?: InjectedProvider;
  };
  return name === 'phantom' ? browser.phantom?.solana ?? null : browser.solflare ?? null;
}

export function InjectedSolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const providerRef = useRef<InjectedProvider | null>(null);
  const invalidationHandlerRef = useRef<(() => void) | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [providerName, setProviderName] = useState<ProviderName | null>(null);

  const availableKey = useSyncExternalStore(
    () => () => undefined,
    () => (['phantom', 'solflare'] as ProviderName[]).filter(name => getProvider(name)).join(','),
    () => '',
  );
  const availableProviders = useMemo(() => availableKey ? availableKey.split(',') as ProviderName[] : [], [availableKey]);

  const connect = useCallback(async (name: ProviderName) => {
    const provider = getProvider(name);
    if (!provider) throw new Error(`${name} wallet extension is not available`);
    const result = await provider.connect();
    const nextAddress = result.publicKey?.toString() ?? provider.publicKey?.toString();
    if (!nextAddress) throw new Error('Wallet did not return a public key');
    const invalidate = () => {
      providerRef.current = null;
      setProviderName(null);
      setAddress(null);
    };
    providerRef.current = provider;
    invalidationHandlerRef.current = invalidate;
    provider.on?.('accountChanged', invalidate);
    provider.on?.('disconnect', invalidate);
    setProviderName(name);
    setAddress(nextAddress);
  }, []);

  const disconnect = useCallback(async () => {
    const provider = providerRef.current;
    const invalidate = invalidationHandlerRef.current;
    providerRef.current = null;
    invalidationHandlerRef.current = null;
    setProviderName(null);
    setAddress(null);
    if (provider && invalidate) {
      provider.removeListener?.('accountChanged', invalidate);
      provider.removeListener?.('disconnect', invalidate);
    }
    if (provider) await provider.disconnect().catch(() => undefined);
  }, []);

  const signMessage = useCallback(async (message: Uint8Array) => {
    const provider = providerRef.current;
    if (!provider || !address) throw new Error('Wallet is not connected');
    const signed = await provider.signMessage(message, 'utf8');
    return signed instanceof Uint8Array ? signed : signed.signature;
  }, [address]);

  const publicKey = useMemo(() => address ? ({ toString: () => address, toBase58: () => address }) : null, [address]);
  const value = useMemo(() => ({ address, publicKey, connected: !!address, providerName, availableProviders, connect, disconnect, signMessage }), [address, publicKey, providerName, availableProviders, connect, disconnect, signMessage]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useInjectedSolanaWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error('useInjectedSolanaWallet must be used inside InjectedSolanaWalletProvider');
  return value;
}
