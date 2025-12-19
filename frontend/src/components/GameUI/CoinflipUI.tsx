import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useUIStore } from '../../state/uiStore';
import { useCasinoStore } from '../../state/casinoStore';
import { GameControls, getOptionBtnStyle, getActionBtnStyle } from '../ui/GameControls';

interface CoinflipProps {
    onPlay: (amount: number, choice: 'heads' | 'tails') => Promise<{ win: boolean, result: 'heads' | 'tails', payout: number }>;
}

const CoinflipUI: React.FC<CoinflipProps> = ({ onPlay }) => {
  const { t } = useUIStore();
  const { balance, getBetAmountInSol, getDisplayValue } = useCasinoStore();
  
  const [amount, setAmount] = useState<number>(0.1);
  const [isUsdMode, setIsUsdMode] = useState(false);
  const [selectedSide, setSelectedSide] = useState<'heads' | 'tails'>('heads');
  const [isFlipping, setIsFlipping] = useState(false);
  const [lastResult, setLastResult] = useState<'heads' | 'tails' | null>(null);

  const theme = 'yellow';

  const handlePlayClick = async () => {
    const betInSol = getBetAmountInSol(amount, isUsdMode);
    
    if (betInSol <= 0) return toast.error(t('msg_invalid_amount'));
    if (betInSol > balance) return toast.error(t('modal_low_balance'));

    setIsFlipping(true);
    setLastResult(null); // Reseta animação

    try {
        const { win, result, payout } = await onPlay(betInSol, selectedSide);
        
        // Pequeno delay para a animação da moeda terminar (opcional)
        setTimeout(() => {
            setLastResult(result);
            if (win) {
                toast.success(`${t('win')}! +${getDisplayValue(payout, isUsdMode)}`);
            } else {
                toast.error(t('lose'));
            }
            setIsFlipping(false);
        }, 1000); // 1 segundo de suspense

    } catch (error) {
        console.error(error);
        toast.error("Game error. Try again.");
        setIsFlipping(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full max-w-4xl mx-auto">
        
        {/* Instruções */}
        <div className="text-center max-w-lg mx-auto mb-2 opacity-80">
             <p className="text-gray-400 text-sm font-medium">
                {t('instr_coin')}
             </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-8 w-full">
            
            {/* MOEDA (Area Visual) */}
            <div className="w-full flex flex-col items-center justify-center min-h-[250px] perspective-1000">
               <div className={`relative w-48 h-48 transition-transform duration-700 transform-style-3d ${isFlipping ? 'animate-spin-fast' : ''}`}>
                    {/* Frente (Heads) ou Verso (Tails) dependendo do resultado */}
                    <div className={`w-full h-full rounded-full flex items-center justify-center border-4 border-yellow-600 shadow-2xl ${
                        lastResult === 'tails' ? 'bg-gray-300' : 'bg-yellow-500'
                    }`}>
                       {/* Se não houver resultado ou for Heads -> Mostra SOL */}
                       {(!lastResult || lastResult === 'heads') && (
                           <img src="https://cryptologos.cc/logos/solana-sol-logo.png" alt="Heads" className="w-24 h-24 opacity-80" />
                       )}
                       {/* Se for Tails -> Mostra Texto ou outra imagem */}
                       {lastResult === 'tails' && (
                           <span className="text-4xl font-black text-gray-600">TAILS</span>
                       )}
                    </div>
               </div>
               
               {/* Status Text */}
               {lastResult && !isFlipping && (
                   <div className={`mt-6 text-2xl font-black uppercase tracking-widest animate-bounce ${
                       selectedSide === lastResult ? 'text-emerald-400' : 'text-red-400'
                   }`}>
                       {selectedSide === lastResult ? 'YOU WON!' : 'YOU LOST!'}
                   </div>
               )}
            </div>

            {/* CONTROLS */}
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