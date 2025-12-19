import React from 'react';
import { GameControls, getOptionBtnStyle, getActionBtnStyle } from '../ui/GameControls';
import { useCasinoStore } from '../../state/casinoStore';
import { useUIStore } from '../../state/uiStore';

// Ícones (Opcional: Podes substituir por FontAwesome ou SVGs inline)
const BombIcon = () => <span className="text-2xl">💣</span>;
const GemIcon = () => <span className="text-2xl animate-bounce">💎</span>;

interface MinesProps {
  grid: any[]; 
  isPlaying: boolean; 
  gameOver: boolean; 
  win: boolean; 
  multiplier: number; 
  onReveal: (index: number) => void; 
  onAction: () => void;
  betAmount: number; 
  setBetAmount: (val: number) => void; 
  minesCount: number; 
  setMinesCount: (val: number) => void; 
  isUsdMode: boolean; 
  setIsUsdMode: (val: boolean) => void;
}

const MinesUI: React.FC<MinesProps> = ({ 
  grid, isPlaying, gameOver, win, multiplier, 
  onReveal, onAction,
  betAmount, setBetAmount, minesCount, setMinesCount, isUsdMode, setIsUsdMode
}) => {
  const { balance, getDisplayValue } = useCasinoStore();
  const { t } = useUIStore();
  const theme = 'emerald';

  const currentProfit = betAmount * multiplier;

  return (
    <div className="flex flex-col-reverse md:flex-row items-start justify-center gap-8 w-full max-w-6xl mx-auto">
      
      {/* 1. CONTROLS (Esquerda) */}
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
                    disabled={gameOver && isPlaying} // Desativa se jogo acabou mas estado ainda não resetou
                    className={getActionBtnStyle(theme, gameOver)}
                >
                    {isPlaying ? (
                      <div className="flex flex-col items-center leading-none">
                        <span className="whitespace-nowrap">{t('btn_cashout')}</span>
                        <span className="text-xs opacity-80 mt-1 font-mono font-bold text-white/90">
                          {getDisplayValue(currentProfit, isUsdMode)}
                        </span>
                      </div>
                    ) : <span className="whitespace-nowrap">{t('btn_play')}</span>}
                </button>
            }
        >
            {/* INSTRUÇÕES */}
            <div className="mb-6 border-b border-white/5 pb-4">
                 <h3 className="text-emerald-500 text-xs font-bold mb-2 uppercase tracking-widest">
                    {t('how_to_play')}
                 </h3>
                 <p className="text-gray-400 text-sm font-medium leading-relaxed">
                    {t('instr_mines')}
                 </p>
            </div>

            {/* MINES SELECTOR */}
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
      <div className="relative bg-[#131720] p-8 rounded-[40px] border border-white/5 shadow-2xl w-full max-w-[600px] flex flex-col items-center min-h-[500px] justify-center">
         
         {/* Background Glow */}
         <div className={`absolute inset-0 bg-emerald-500/5 transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />

         {/* Multiplier Badge */}
         {isPlaying && (
            <div className="absolute top-6 right-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl font-mono font-bold text-xl shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse">
                {multiplier.toFixed(2)}x
            </div>
         )}

         {/* GRID 5x5 */}
         <div className="grid grid-cols-5 gap-3 w-full aspect-square max-w-[450px] relative z-10">
            {grid.map((cell: any, i: number) => {
               // Estados da Célula:
               // revealed: true/false
               // isMine: true/false (só revelado no fim)
               // exploded: true (se foi a mina que o user clicou)
               
               let content = null;
               let styleClass = "bg-[#1a2c38] hover:bg-[#233a4a] border-b-4 border-[#0f1a21] active:border-b-0 active:translate-y-1";

               if (cell.revealed) {
                   if (cell.isMine) {
                       content = <BombIcon />;
                       styleClass = cell.exploded 
                            ? "bg-red-500 border-red-700 shadow-[0_0_20px_#ef4444] scale-110 z-20" // A mina que explodiu
                            : "bg-[#1a2c38]/50 opacity-50 grayscale"; // Minas reveladas passivamente
                   } else {
                       content = <GemIcon />;
                       styleClass = "bg-[#0f212e] border-transparent shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"; // Gema segura
                   }
               } else if (gameOver) {
                   styleClass = "bg-[#1a2c38] opacity-30 cursor-not-allowed"; // Fim de jogo, células por revelar
               }

               return (
                  <button 
                    key={i} 
                    onClick={() => !cell.revealed && !gameOver && onReveal(i)} 
                    disabled={cell.revealed || gameOver}
                    className={`rounded-xl h-full w-full flex items-center justify-center text-3xl transition-all duration-200 ${styleClass}`}
                  >
                     {content}
                  </button>
               );
            })}
         </div>
      </div>
    </div>
  );
};

export default MinesUI;