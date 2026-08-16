import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { evmConfig, primarySettlementChain } from '../lib/evmConfig';

export function EvmProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 10_000, retry: 2 } } }),
  );

  return (
    <WagmiProvider config={evmConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={primarySettlementChain}
          theme={darkTheme({
            accentColor: '#4169e1',
            accentColorForeground: '#ffffff',
            borderRadius: 'small',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
