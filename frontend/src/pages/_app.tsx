import type { AppProps } from 'next/app';
import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

// --- 1. CARTEIRAS PADRÃO ---
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';

import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';

import Layout from '../components/Shared/Layout'; 

function MyApp({ Component, pageProps }: AppProps) {
  
  // --- CONFIGURAÇÃO DE REDE (PRODUÇÃO READY) ---
  // Se existir NEXT_PUBLIC_SOLANA_NETWORK no .env usa essa, senão usa Devnet
  const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork) || WalletAdapterNetwork.Devnet;
  
  // Endpoint RPC:
  const endpoint = useMemo(() => {
    if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
        return process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    }
    return clusterApiUrl(network);
  }, [network]);
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
            
            <Layout>
                {/* Fundo Global */}
                <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(ellipse_at_top,_#1a1f2b,_#0c0f17)]">
                      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] animate-pulse"></div>
                      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px]"></div>
                </div>

                <Component {...pageProps} />
            </Layout>

            {/* Toasts */}
            <Toaster 
              position="bottom-center"
              toastOptions={{
                    style: { 
                      background: '#1a1f2b', 
                      color: '#fff', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    },
              }}
            />

        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default MyApp;
