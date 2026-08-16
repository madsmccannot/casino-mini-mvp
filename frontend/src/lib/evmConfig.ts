import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { cookieStorage, createConfig, createStorage, http } from 'wagmi';
import type { Chain } from 'viem';
import { coinbaseWallet, injected } from 'wagmi/connectors';

const definePublicChain = (chain: Chain): Chain => chain;
const arbitrum = definePublicChain({ id: 42161, name: 'Arbitrum One', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://arb1.arbitrum.io/rpc'] }, public: { http: ['https://arb1.arbitrum.io/rpc'] } }, blockExplorers: { default: { name: 'Arbiscan', url: 'https://arbiscan.io' } } });
const mainnet = definePublicChain({ id: 1, name: 'Ethereum', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://eth.merkle.io'] }, public: { http: ['https://eth.merkle.io'] } }, blockExplorers: { default: { name: 'Etherscan', url: 'https://etherscan.io' } } });
const base = definePublicChain({ id: 8453, name: 'Base', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://mainnet.base.org'] }, public: { http: ['https://mainnet.base.org'] } }, blockExplorers: { default: { name: 'Basescan', url: 'https://basescan.org' } } });
const optimism = definePublicChain({ id: 10, name: 'OP Mainnet', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://mainnet.optimism.io'] }, public: { http: ['https://mainnet.optimism.io'] } }, blockExplorers: { default: { name: 'Optimism Explorer', url: 'https://optimistic.etherscan.io' } } });
const polygon = definePublicChain({ id: 137, name: 'Polygon', nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 }, rpcUrls: { default: { http: ['https://polygon-rpc.com'] }, public: { http: ['https://polygon-rpc.com'] } }, blockExplorers: { default: { name: 'PolygonScan', url: 'https://polygonscan.com' } } });

export const supportedEvmChains = [arbitrum, mainnet, base, optimism, polygon] as const;
export const primarySettlementChain = arbitrum;

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID?.trim();
const hasWalletConnect = Boolean(
  projectId && projectId !== 'replace-with-walletconnect-project-id' && projectId.length >= 20,
);
const storage = createStorage({ storage: cookieStorage });

export const evmConfig = hasWalletConnect
  ? getDefaultConfig({
      appName: 'SolCasino',
      projectId: projectId!,
      chains: supportedEvmChains,
      ssr: true,
      storage,
    })
  : createConfig({
      chains: supportedEvmChains,
      connectors: [injected({ shimDisconnect: true }), coinbaseWallet({ appName: 'SolCasino' })],
      transports: {
        [arbitrum.id]: http(),
        [mainnet.id]: http(),
        [base.id]: http(),
        [optimism.id]: http(),
        [polygon.id]: http(),
      },
      ssr: true,
      storage,
    });
