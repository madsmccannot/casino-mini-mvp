import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useUIStore } from '../../state/uiStore';
import { useCasinoStore } from '../../state/casinoStore';
import { GameControls, getOptionBtnStyle, getActionBtnStyle } from '../ui/GameControls';

// Constantes
const ROULETTE_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const getNumberColor = (num: number) => {
  if (num === 0) return 'green';
  return RED_NUMBERS.includes(num) ? 'red' : 'black';
};

interface RouletteProps {
  onPlay: (amount: number, betType: string, specificNumber?: number) => Promise<{ win: boolean, resultNumber: number, payout: number }>;
}

const RouletteUI: React.FC<RouletteProps> = ({ onPlay }) => {
  const { t } = useUIStore();
  const { balance, getBetAmountInSol } = useCasinoStore();
  
  const [amount, setAmount] = useState<number>(0.1);
  const [isUsdMode, setIsUsdMode] = useState(false);
  const [selectedBet, setSelectedBet] = useState<string>('red'); // 'red', 'black', 'green', ou numero
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultNumber, setResultNumber] = useState<number | null>(null);
  
  const theme = 'red';

  const handlePlayClick = async () => {
    const betInSol = getBetAmountInSol(amount, isUsdMode);
    if (betInSol <= 0 || betInSol > balance) {
        toast.error(t('modal_low_balance'));
        return;
    }

    setIsSpinning(true);
    setResultNumber(null);

    try {
        // Enviar aposta (ex: 'red', 'black', ou '0')
        const { win, resultNumber, payout } = await onPlay(betInSol, selectedBet);
        
        // Timeout para simular animação da roda (ajustar conforme necessidade)
        setTimeout(() => {
            setResultNumber(resultNumber);
            setIsSpinning(false);
            
            if (win) toast.success(`${t('win')} ${payout.toFixed(4)} SOL!`);
            else toast.error(`${t('lose')} ${resultNumber} (${getNumberColor(resultNumber)})`);
        }, 3000);

    } catch (e) {
        setIsSpinning(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full justify-center items-start max-w-6xl mx-auto">
        
        {/* 1. PAINEL DE CONTROLO (Esquerda) */}
        <div className="w-full md:w-[350px] shrink-0">
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
                        disabled={isSpinning}
                        className={getActionBtnStyle(theme, isSpinning)}
                    >
                        <span className="whitespace-nowrap">{isSpinning ? t('btn_spinning') : t('btn_spin')}</span>
                    </button>
                }
            >
                {/* --- INSTRUÇÕES --- */}
                <div className="mb-6 border-b border-white/5 pb-4">
                     <h3 className="text-red-500 text-xs font-bold mb-2 uppercase tracking-widest">
                        {t('how_to_play')}
                     </h3>
                     <p className="text-gray-400 text-sm font-medium leading-relaxed">
                        {t('instr_roulette')}
                     </p>
                </div>

                {/* Bet Selection */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-gray-400 tracking-wide uppercase whitespace-nowrap">
                       {t('lbl_select_side')}
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => setSelectedBet('red')}
                            disabled={isSpinning}
                            className={getOptionBtnStyle(selectedBet === 'red', theme)}
                        >
                           <span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-1"></span> {t('lbl_red')}
                        </button>
                        <button
                            onClick={() => setSelectedBet('0')}
                            disabled={isSpinning}
                            className={getOptionBtnStyle(selectedBet === '0', 'emerald')} // Verde para Zero
                        >
                           <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1"></span> {t('lbl_zero')}
                        </button>
                        <button
                            onClick={() => setSelectedBet('black')}
                            disabled={isSpinning}
                            className={getOptionBtnStyle(selectedBet === 'black', 'blue')} // Azul/Cinza para Preto
                        >
                           <span className="w-2 h-2 rounded-full bg-gray-900 inline-block mr-1"></span> {t('lbl_black')}
                        </button>
                    </div>
                </div>
            </GameControls>
        </div>

        {/* 2. ÁREA DE JOGO (Direita - Roda e Histórico) */}
        <div className="flex-1 w-full flex flex-col gap-6">
            
            {/* Roda Visual */}
            <div className="bg-[#131720] p-4 rounded-3xl border border-white/5 relative overflow-hidden h-32 flex items-center shadow-lg">
                <div className="absolute inset-y-0 left-1/2 w-1 bg-yellow-400 z-20 shadow-[0_0_10px_rgba(250,204,21,0.8)]"></div> 
                <div className="absolute inset-0 bg-gradient-to-r from-[#131720] via-transparent to-[#131720] z-10 pointer-events-none"></div>
                
                <div 
                   className="flex gap-1 absolute left-1/2 transition-all duration-[3000ms] ease-out will-change-transform"
                   style={{ 
                     transform: isSpinning && resultNumber === null 
                        ? 'translateX(-5000px)' 
                        : resultNumber !== null
                            ? `translateX(calc(-50% - ${ROULETTE_NUMBERS.indexOf(resultNumber) * 64}px + 32px))` // Ajuste fino da posição
                            : 'translateX(-50%)'
                   }}
                >
                    {/* Renderizamos a lista várias vezes para loop infinito visual */}
                    {[...ROULETTE_NUMBERS, ...ROULETTE_NUMBERS, ...ROULETTE_NUMBERS, ...ROULETTE_NUMBERS, ...ROULETTE_NUMBERS].map((num, i) => {
                        const color = getNumberColor(num);
                        return (
                        <div key={i} className={`w-16 h-24 flex-shrink-0 flex items-center justify-center font-black text-2xl rounded-lg border-2 border-white/10 ${color === 'red' ? 'bg-red-600 text-white' : color === 'black' ? 'bg-gray-900 text-white' : 'bg-emerald-600 text-white'} ${resultNumber === num && !isSpinning ? 'ring-4 ring-yellow-400 z-30 scale-110 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : 'opacity-50'}`}>
                            {num}
                        </div>
                        )
                    })}
                </div>
            </div>

            {/* Grid de Apostas (Opcional - mas bom para preencher o espaço) */}
            <div className="bg-[#131720] p-6 rounded-3xl border border-white/5 shadow-2xl">
                 {/* Aqui poderia ir a grelha de números 1-36 se quiséssemos expandir a funcionalidade no futuro */}
                 <div className="text-center text-gray-500 text-sm italic py-8">
                    Single Number bets coming soon...
                 </div>
            </div>
        </div>
    </div>
  );
};

export default RouletteUI;