import React from 'react';
import { useUIStore } from '../../state/uiStore';

interface GameControlsProps {
  balance: number;
  betAmount: number;
  setBetAmount: (val: number) => void;
  color: string;
  actionButton: React.ReactNode; 
  children?: React.ReactNode; 
  isUsdMode: boolean;
  setIsUsdMode: (val: boolean) => void;
}

export function GameControls({ 
  balance, 
  betAmount, 
  setBetAmount, 
  color, 
  actionButton,
  children,
  isUsdMode,
  setIsUsdMode
}: GameControlsProps) {
  const { t } = useUIStore(); 

  const borderColors: Record<string, string> = {
    emerald: "focus-within:border-emerald-500/50",
    pink: "focus-within:border-pink-500/50",
    red: "focus-within:border-red-500/50",
    yellow: "focus-within:border-yellow-500/50",
    blue: "focus-within:border-blue-500/50",
  };

  const bankrollDisplay = `$${balance.toFixed(2)} USDC`;

  return (
    <div className="bg-[#1a2c38] p-6 rounded-3xl w-full max-w-md mx-auto shadow-xl border border-white/5 relative z-20">
      
      {/* HEADER DO INPUT */}
      <div className="mb-6 relative z-30">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-gray-400 tracking-wide uppercase whitespace-nowrap">
             {t('lbl_bet_amount')}
          </span>
          
          <span className="bg-[#243b4a] px-3 py-1 rounded text-[10px] font-bold border border-white/5 text-gray-300 uppercase">USDC ACCOUNT</span>
        </div>

        {/* INPUT CONTAINER */}
        <div className={`relative group flex items-center bg-[#0f212e] rounded-xl border border-transparent transition-colors h-16 px-4 ${borderColors[color] || borderColors.emerald}`}>
            
            {/* Ícone de Moeda */}
            <div className="mr-3 text-gray-500 font-bold select-none flex items-center justify-center w-6">
                $
            </div>

            <input
              type="number"
              value={betAmount || ''}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="bg-transparent text-white font-bold text-2xl w-full outline-none placeholder-gray-600 font-mono"
              placeholder="0.00"
              step={isUsdMode ? "1" : "0.01"}
              min="0"
            />

            {/* LABEL ESTÁTICA (SOL/USD) */}
            <div className="flex items-center gap-2 bg-[#1a2c38] py-2 px-3 rounded-lg border border-white/5 shadow-sm ml-2 select-none">
                <div className={`w-2 h-2 rounded-full ${isUsdMode ? 'bg-green-500' : 'bg-purple-500'} shadow-[0_0_8px_rgba(168,85,247,0.6)]`} />
              <span className="font-bold text-white text-sm">USDC</span>
            </div>
        </div>
        
        {/* BANKROLL INFO */}
        <div className="text-right mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider transition-all duration-300 whitespace-nowrap">
           {t('bankroll_label')}: <span className="text-gray-300">{bankrollDisplay}</span>
        </div>
      </div>

      {/* Conteúdo Extra (Botões de opção, sliders, etc) */}
      {children && (
        <div className="mb-6">
          {children}
        </div>
      )}

      {/* Botão de Ação Principal (JOGAR) */}
      <div className="mt-2">
        {actionButton}
      </div>
    </div>
  );
}

// Helpers de Estilo
export const getOptionBtnStyle = (isActive: boolean, colorName: string) => {
  const base = "py-3 rounded-lg font-bold text-sm transition-all duration-200 border w-full";
  if (!isActive) return `${base} bg-[#0f212e] text-gray-400 border-transparent hover:bg-[#152836] hover:text-gray-200`;

  const activeColors: Record<string, string> = {
    emerald: "border-emerald-500/50 text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
    pink: "border-pink-500/50 text-pink-400 bg-pink-500/10 shadow-[0_0_10px_rgba(236,72,153,0.1)]",
    red: "border-red-500/50 text-red-400 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.1)]",
    yellow: "border-yellow-500/50 text-yellow-400 bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.1)]",
    blue: "border-blue-500/50 text-blue-400 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.1)]",
  };
  return `${base} ${activeColors[colorName] || activeColors.emerald}`;
};

export const getActionBtnStyle = (colorName: string, disabled: boolean = false) => {
    if (disabled) return "w-full py-4 rounded-xl font-black text-white text-xl shadow-none bg-[#243b4a] opacity-50 cursor-not-allowed uppercase tracking-wider";
    const base = "w-full py-4 rounded-xl font-black text-white text-2xl shadow-lg transition-all hover:-translate-y-1 active:translate-y-0 active:shadow-none uppercase tracking-wide";
    const themes: Record<string, string> = {
      emerald: "bg-[#10b981] shadow-[0_5px_0_#059669] hover:bg-[#34d399]",
      pink: "bg-[#ec4899] shadow-[0_5px_0_#db2777] hover:bg-[#f472b6]",
      red: "bg-[#ef4444] shadow-[0_5px_0_#b91c1c] hover:bg-[#f87171]",
      yellow: "bg-[#eab308] text-yellow-950 shadow-[0_5px_0_#ca8a04] hover:bg-[#facc15]",
      blue: "bg-[#3b82f6] shadow-[0_5px_0_#2563eb] hover:bg-[#60a5fa]",
    };
    return `${base} ${themes[colorName] || themes.emerald}`;
}
