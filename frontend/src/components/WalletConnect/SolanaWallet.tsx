import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWalletAuth } from '../../hooks/useWalletAuth'; // Usamos o hook apenas para disconnect
import { toast } from 'react-hot-toast';

export const SolanaWallet = () => {
  // --- HOOKS ---
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal(); // Para abrir o modal de escolha de carteira
  
  // Usamos o hook de auth para fazer o logout completo (Store + Wallet)
  const { disconnect } = useWalletAuth();

  // Estados locais para o Menu Dropdown
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // --- LÓGICA DO MENU (Fechar ao clicar fora) ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- FUNÇÕES AUXILIARES ---

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      toast.success("Address copied!");
      setShowMenu(false);
    }
  };

  const handleChangeWallet = () => {
    setVisible(true); // Abre o modal oficial da Solana
    setShowMenu(false);
  };

  const handleDisconnect = () => {
    disconnect(); // Chama o logout completo do nosso hook
    setShowMenu(false);
    // toast.success("Wallet disconnected"); // Opcional
  };

  const shortAddress = publicKey 
    ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`
    : '';

  // --- RENDERIZAÇÃO ---

  // CASO 1: NÃO CONECTADO -> Botão de Conectar
  if (!connected || !publicKey) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="flex items-center gap-2 bg-[#512da8] hover:bg-[#4527a0] text-white px-4 py-2 rounded-lg font-bold transition-all text-sm h-10 shadow-lg shadow-purple-900/20"
      >
        <img src="https://cryptologos.cc/logos/solana-sol-logo.png" alt="SOL" className="w-4 h-4" />
        Connect SOL
      </button>
    );
  }

  // CASO 2: CONECTADO -> Botão com Dropdown
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 bg-[#1c1f2e] hover:bg-[#252836] border border-[#512da8]/50 text-white px-4 py-2 rounded-lg font-bold transition-all text-sm h-10"
      >
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <img src="https://cryptologos.cc/logos/solana-sol-logo.png" alt="SOL" className="w-4 h-4" />
        <span className="font-mono">{shortAddress}</span>
        <i className={`fas fa-chevron-down text-xs transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`}></i>
      </button>

      {/* DROPDOWN MENU */}
      {showMenu && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1f2b] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in-down origin-top-right">
          
          <div className="p-3 border-b border-white/5 bg-white/5">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Solana Wallet</p>
          </div>

          <button 
            onClick={copyAddress}
            className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3"
          >
            <i className="fas fa-copy text-xs opacity-70"></i> Copy Address
          </button>

          <button 
            onClick={handleChangeWallet}
            className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3"
          >
            <i className="fas fa-wallet text-xs opacity-70"></i> Change Wallet
          </button>

          <div className="h-px bg-white/5 my-1"></div>

          <button 
            onClick={handleDisconnect}
            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3"
          >
            <i className="fas fa-sign-out-alt text-xs opacity-70"></i> Disconnect
          </button>
        </div>
      )}
    </div>
  );
};