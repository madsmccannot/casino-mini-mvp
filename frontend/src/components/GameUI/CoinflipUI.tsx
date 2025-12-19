import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useUIStore } from '../../state/uiStore';
import { useCasinoStore } from '../../state/casinoStore';
import { GameControls, getOptionBtnStyle, getActionBtnStyle } from '../ui/GameControls';

const CoinflipUI: React.FC<any> = ({ onPlay }) => {
  const { t } = useUIStore();
  const { balance, getBetAmountInSol } = useCasinoStore();
  
  const [amount, setAmount] = useState<number>(0.1);
  const [isUsdMode, setIsUsdMode] = useState(false);
  const [selectedSide, setSelectedSide] = useState<'heads' | 'tails'>('heads');
  const [isFlipping, setIsFlipping] = useState(false);
  const [gameResult, setGameResult] = useState<{win: boolean, outcome: string} | null>(null);

  const theme = 'yellow';

  const handlePlayClick = async () => {
    // ... (Lógica de aposta igual) ...
    setIsFlipping(true);
    // Simulação
    setTimeout(() => setIsFlipping(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full max-w-4xl mx-auto">
        
        {/* --- INSTRUÇÕES (FORA DO BLOCO DE CONTROLO) --- */}
        {/* Estão aqui no topo, centradas e discretas */}
        <div className="text-center max-w-lg mx-auto mb-2 opacity-80">
             <p className="text-gray-400 text-sm font-medium">
                {t('instr_coin')}
             </p>
        </div>
        {/* ----------------------------------------------- */}

        <div className="flex flex-col items-center justify-center gap-8 w-full">
            
            {/* MOEDA (Area Visual) */}
            <div className="w-full flex flex-col items-center justify-center min-h-[300px] perspective-1000">
               {/* ... (Animação da moeda) ... */}
               <div className="w-56 h-56 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-4xl font-black text-yellow-900 opacity-50">SOL</span>
               </div>
            </div>

            {/* CONTROLS (SEM Instruções lá dentro) */}
            <GameControls
                balance={balance}
                betAmount={amount}
                setBetAmount={setAmount}
                isUsdMode={isUsdMode}
                setIsUsdMode={setIsUsdMode}
                color={theme}
                actionButton={
                    <button 
                        onClick={handlePlayClick}
                        disabled={isFlipping}
                        className={getActionBtnStyle(theme, isFlipping)}
                    >
                        <span className="whitespace-nowrap">
                          {isFlipping ? t('btn_flipping') : t('btn_flip')}
                        </span>
                    </button>
                }
            >
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-gray-400 tracking-wide uppercase whitespace-nowrap">
                       {t('lbl_select_side')}
                    </span>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setSelectedSide('heads')}
                            disabled={isFlipping}
                            className={getOptionBtnStyle(selectedSide === 'heads', theme)}
                        >
                           {t('lbl_heads')}
                        </button>
                        <button
                            onClick={() => setSelectedSide('tails')}
                            disabled={isFlipping}
                            className={getOptionBtnStyle(selectedSide === 'tails', theme)}
                        >
                           {t('lbl_tails')}
                        </button>
                    </div>
                </div>
            </GameControls>
        </div>
    </div>
  );
};
export default CoinflipUI;