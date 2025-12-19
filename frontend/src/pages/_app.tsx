import type { AppProps } from 'next/app';
import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

// --- 1. CARTEIRAS PADRÃO (Do pacote base) ---
import { 
  PhantomWalletAdapter, 
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';

// --- 2. CARTEIRAS EXTRA (Pacotes individuais) ---
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase';
import { TrustWalletAdapter } from '@solana/wallet-adapter-trust';
import { WalletConnectWalletAdapter } from '@solana/wallet-adapter-walletconnect';

import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';

import Layout from '../components/Shared/Layout'; 

function MyApp({ Component, pageProps }: AppProps) {
  // Configuração da Rede (Devnet para testes)
  const network = WalletAdapterNetwork.Devnet;
  
  // Endpoint RPC (Usa um privado se tiveres, senão usa este público)
  const endpoint = useMemo(() => "https://api.devnet.solana.com", []);
  
  const wallets = useMemo(
    () => [
      /**
       * LISTA DE CARTEIRAS SUPORTADAS
       * O adaptador vai detetar automaticamente quais extensões o utilizador tem instaladas.
       */
      // WalletConnect (Para telemóveis lerem o QR Code)
      new WalletConnectWalletAdapter({
        network,
        options: {
          projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '', 
          metadata: {
            name: 'SolCasino',
            description: 'The Future of Crypto Gaming',
            url: 'https://solcasino.app',
            icons: ['https://avatars.githubusercontent.com/u/37784886']
          },
        },
      }),

      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new TrustWalletAdapter(),
      new CoinbaseWalletAdapter(),
      
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      {/* autoConnect={true} faz com que a Phantom conecte sozinha se já foi autorizada antes */}
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
            
            <Layout>
                {/* Fundo Global com Gradiente e Animação */}
                <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(ellipse_at_top,_#1a1f2b,_#0c0f17)]">
                      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] animate-pulse"></div>
                      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px]"></div>
                </div>

                <Component {...pageProps} />
            </Layout>

            {/* Configuração dos Popups (Toasts) */}
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