import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';
import Layout from '../components/Shared/Layout'; 
import { InjectedSolanaWalletProvider } from '../hooks/useInjectedSolanaWallet';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <InjectedSolanaWalletProvider>
            
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

    </InjectedSolanaWalletProvider>
  );
}

export default MyApp;
