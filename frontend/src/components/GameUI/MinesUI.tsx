import React from 'react';
import { GameControls, getOptionBtnStyle, getActionBtnStyle } from '../ui/GameControls';
import { useCasinoStore } from '../../state/casinoStore';
import { useUIStore } from '../../state/uiStore';

// ... (Imports de icones GemIcon/BombIcon mantêm-se iguais) ...

const MinesUI: React.FC<any> = ({ 
  grid, isPlaying, gameOver, win, multiplier, 
  onReveal, onAction,
  betAmount, setBetAmount, minesCount, setMinesCount, isUsdMode, setIsUsdMode
}) => {
  const { balance } = useCasinoStore();
  const { t } = useUIStore();
  const theme = 'emerald';

  return (
    <div className="flex flex-col-reverse md:flex-row items-start justify-center gap-8 w-full max-w-6xl mx-auto">
      
      {/* 1. CONTROLS */}
      <div className="w-full md:w-[350px] shrink-0">
        <GameControls
            balance={balance}
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            isUsdMode={isUsdMode}
            setIsUsdMode={setIsUsdMode}
            color={theme}
            actionButton={
                <button 
                    onClick={onAction}
                    disabled={gameOver && isPlaying} 
                    className={getActionBtnStyle(theme, gameOver)}
                >
                    {isPlaying ? (
                      <div className="flex flex-col items-center leading-none">
                        <span className="whitespace-nowrap">{t('btn_cashout')}</span>
                        <span className="text-[10px] opacity-70 mt-1 font-mono">
                          {(betAmount * multiplier).toFixed(4)}
                        </span>
                      </div>
                    ) : <span className="whitespace-nowrap">{t('btn_play')}</span>}
                </button>
            }
        >
            {/* --- INSTRUÇÕES (NOVO LUGAR: TOPO DA ESQUERDA) --- */}
            <div className="mb-6 border-b border-white/5 pb-4">
                 <h3 className="text-emerald-500 text-xs font-bold mb-2 uppercase tracking-widest">
                    {t('how_to_play')}
                 </h3>
                 <p className="text-gray-400 text-sm font-medium leading-relaxed">
                    {t('instr_mines')}
                 </p>
            </div>
            {/* ----------------------------------------------- */}

            <div className="flex flex-col gap-2 mb-4">
                <span className="text-xs font-bold text-gray-400 tracking-wide uppercase whitespace-nowrap">
                    {t('lbl_mines')}
                </span>
                <div className="grid grid-cols-5 gap-2">
                    {[1, 3, 5, 10, 20].map((num) => (
                        <button
                            key={num}
                            onClick={() => !isPlaying && setMinesCount(num)}
                            disabled={isPlaying}
                            className={getOptionBtnStyle(minesCount === num, theme)}
                        >
                            {num}
                        </button>
                    ))}
                </div>
            </div>
        </GameControls>
      </div>

      {/* 2. GRID DO JOGO (Direita) */}
      <div className="relative bg-[#131720] p-8 rounded-[40px] border border-white/5 shadow-2xl w-full max-w-[600px] flex flex-col items-center">
         {/* ... (Lógica da grelha de minas igual) ... */}
         {/* APENAS PARA EXEMPLO VISUAL DO CORPO */}
         <div className="grid grid-cols-5 gap-3 w-full aspect-square max-w-[450px] mt-8">
            {grid.map((cell: any, i: number) => (
               <button key={i} onClick={() => onReveal(i)} className="bg-[#1a2c38] rounded-xl h-full w-full"></button>
            ))}
         </div>
      </div>
    </div>
  );
};

export default MinesUI;