import React, { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUIStore } from '../../state/uiStore';
import { useCasinoStore } from '../../state/casinoStore';

// Solana wallet adapter
import { useEvmWallet } from '../../hooks/useEvmWallet';

// Novo Hook de Autenticação (A ponte entre Wallet e Backend)
import { useWalletAuth } from '../../hooks/useWalletAuth';

// Modais (Corrigido: Importa da mesma pasta './')
import { DepositModal } from './DepositModal';
import { WithdrawModal } from './WithdrawModal';

// Sidebar (Assume-se que também está na mesma pasta)
import { Sidebar } from './Sidebar';

// WALLETS
import { EvmWallet } from '../WalletConnect/EvmWallet';
import { supportedEvmChains } from '../../lib/evmConfig';

const LANGUAGES = [
  { code: 'en', countryCode: 'us', label: 'EN' },
  { code: 'pt', countryCode: 'pt', label: 'PT' },
  { code: 'zh', countryCode: 'cn', label: 'ZH' },
  { code: 'es', countryCode: 'es', label: 'ES' },
  { code: 'fr', countryCode: 'fr', label: 'FR' },
  { code: 'de', countryCode: 'de', label: 'DE' },
  { code: 'ru', countryCode: 'ru', label: 'RU' },
  { code: 'hi', countryCode: 'in', label: 'HI' },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { language, setLanguage, t } = useUIStore();
  const { balance } = useCasinoStore();

  // Wallets (Solana)
  const { address, connected, chainId } = useEvmWallet();
  
  // Auth Logic (Backend)
  // Usamos o hook para gerir o login automaticamente sem duplicar lógica
  const { login, disconnect: disconnectBackend, isAuthenticated } = useWalletAuth();
  
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  // --- EFEITO DE LOGIN AUTOMÁTICO ---
  // Se a carteira conectar e ainda não tivermos autenticado no backend -> Login
  // Se a carteira desconectar -> Logout
  useEffect(() => {
    const supportedNetwork = supportedEvmChains.some((chain) => chain.id === chainId);
    if (connected && address && supportedNetwork && !isAuthenticated) {
      login();
    } else if (!connected && isAuthenticated) {
      disconnectBackend();
    }
  }, [connected, address, chainId, isAuthenticated, login, disconnectBackend]);

  useEffect(() => {
    const openDeposit = () => setIsDepositOpen(true);
    window.addEventListener('casino:open-deposit', openDeposit);
    return () => window.removeEventListener('casino:open-deposit', openDeposit);
  }, []);

  const currentLangObj = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  const isSportsArea = router.pathname === '/sports' || router.pathname.startsWith('/sports/');

  return (
    <div className="min-h-screen bg-[#0c0f17] text-white font-sans flex flex-col selection:bg-blue-500/30">
      
      {/* --- HEADER --- */}
      <header className="h-20 border-b border-white/5 bg-[#1a1f2b]/95 backdrop-blur-md fixed top-0 w-full z-50 px-4 md:px-8 flex items-center justify-between shadow-lg shadow-black/20 transition-all duration-300">
         <Link href="/" className="flex items-center gap-3 group relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"></div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 border border-white/10 relative z-10">
               <span className="font-display font-black text-xl text-white drop-shadow-md">S</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight relative z-10 hidden sm:block">
               SOL<span className="text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">CASINO</span>
            </span>
         </Link>

         <div className="flex items-center gap-3 md:gap-6">
            {/* BALANCE */}
            <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-[#0c0f17]/70 px-3 py-1.5 md:flex">
                <div className="pr-2"><span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">{t('balance_label')}</span><span className="font-mono text-sm font-extrabold text-white">${balance.toFixed(2)} <span className="text-[10px] text-slate-500">USDC</span></span></div>
                <div className="h-7 w-px bg-white/10" />
                <button aria-label={t('btn_deposit')} onClick={() => setIsDepositOpen(true)} className="rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-xs font-extrabold text-emerald-300 transition hover:bg-emerald-500/25">+</button>
                <button aria-label={t('btn_withdraw')} onClick={() => setIsWithdrawOpen(true)} className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-extrabold text-slate-400 transition hover:bg-white/10 hover:text-white">−</button>
            </div>

            {/* IDIOMA */}
            <div className="relative">
               <button onClick={() => setIsLangOpen(!isLangOpen)} className="flex items-center gap-2 bg-[#0c0f17] border border-white/10 hover:border-white/20 hover:bg-[#151a25] px-3 py-2 rounded-lg transition-all text-sm font-bold shadow-sm">
                 <img src={`https://flagcdn.com/w40/${currentLangObj.countryCode}.png`} alt={currentLangObj.label} className="w-5 h-auto rounded-sm shadow-sm" />
                 <i className={`fas fa-chevron-down text-xs opacity-50 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`}></i>
               </button>

               {isLangOpen && (
                 <div className="absolute top-full right-0 mt-2 w-36 bg-[#1a1f2b] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 z-50 animate-fade-in-down origin-top-right">
                    {LANGUAGES.map((lang) => (
                       <button key={lang.code} onClick={() => { setLanguage(lang.code as any); setIsLangOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-left transition-colors group">
                          <img src={`https://flagcdn.com/w40/${lang.countryCode}.png`} alt={lang.label} className="w-5 h-auto rounded-sm shadow-sm group-hover:scale-110 transition-transform" />
                          <span className={`text-sm font-bold ${language === lang.code ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-200'}`}>{lang.label}</span>
                       </button>
                    ))}
                 </div>
               )}
            </div>

            {/* WALLET BUTTONS */}
            {mounted && (
                <div className="flex gap-2">
                    <div className="shadow-lg shadow-blue-600/10 rounded-lg border border-blue-500/20 z-50 relative">
                        <EvmWallet />
                    </div>
                </div>
            )}
         </div>
      </header>

      {/* Product navigation stays visible so Casino and Sports are always one click away. */}
      <nav className="fixed left-0 right-0 top-20 z-40 border-b border-white/10 bg-[#111722]/95 px-3 shadow-lg shadow-black/10 backdrop-blur-md md:left-56" aria-label="Product navigation">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-center px-2">
          <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-[#0a0f19]/90 p-1 shadow-inner shadow-black/30">
          <Link
            href="/casino"
            aria-current={!isSportsArea ? 'page' : undefined}
            className={`relative flex h-10 min-w-[132px] items-center justify-center gap-2 rounded-xl px-6 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-200 ${!isSportsArea ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950/50 ring-1 ring-blue-300/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <span className={`text-base ${!isSportsArea ? 'text-blue-100' : 'text-blue-400'}`}>◈</span>Casino
          </Link>
          <Link
            href="/sports"
            aria-current={isSportsArea ? 'page' : undefined}
            className={`relative flex h-10 min-w-[132px] items-center justify-center gap-2 rounded-xl px-6 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-200 ${isSportsArea ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg shadow-fuchsia-950/50 ring-1 ring-fuchsia-300/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <span className={`text-base ${isSportsArea ? 'text-fuchsia-100' : 'text-fuchsia-400'}`}>↗</span>Sports
          </Link>
          </div>
        </div>
      </nav>

      {/* --- SIDEBAR --- */}
      <Sidebar />

      {/* --- CONTENT --- */}
      <main className="pt-36 pb-10 flex-1 relative px-4 md:px-8 md:ml-56 transition-all duration-300">
         <div className="fixed top-20 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent pointer-events-none"></div>
         {children}
      </main>

      {/* MODALS */}
      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
      {isWithdrawOpen && <WithdrawModal isOpen onClose={() => setIsWithdrawOpen(false)} />}

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 py-8 text-center bg-[#0a0d14] md:ml-56 transition-all duration-300">
         <div className="flex flex-col items-center gap-2">
             <div className="text-gray-500 text-xs font-medium tracking-wide">
                 &copy; 2025 <span className="text-gray-300">SolCasino</span>. Provably Fair Gaming.
             </div>
         </div>
      </footer>
    </div>
  );
};

export default Layout;
