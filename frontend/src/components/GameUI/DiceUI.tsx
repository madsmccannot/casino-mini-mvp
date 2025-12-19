import React, { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useUIStore } from '../../state/uiStore';
import { useCasinoStore } from '../../state/casinoStore';
import { GameControls, getOptionBtnStyle, getActionBtnStyle } from '../ui/GameControls';

interface DiceProps {
  houseEdge: number; 
  lastRoll: number | null; 
  onPlay: (amount: number, target: number, condition: 'over' | 'under') => Promise<{ win: boolean, result: number, payout: number }>;
}

const DiceUI: React.FC<DiceProps> = ({ houseEdge, lastRoll, onPlay }) => {
  const { t } = useUIStore();
  const { balance, getBetAmountInSol, getDisplayValue, solPrice } = useCasinoStore();

  const [amount, setAmount] = useState<number>(0.1);
  const [isUsdMode, setIsUsdMode] = useState(false); 
  const [target, setTarget] = useState<number>(50);
  const [condition, setCondition] = useState<'over' | 'under'>('over');
  const [isRolling, setIsRolling] = useState(false);

  const theme = 'blue';

  const { winChance, multiplier, potentialProfitSol } = useMemo(() => {
    let chance = condition === 'over' ? (100 - target) : target;
    if (chance < 1) chance = 1;
    if (chance > 98) chance = 98;
    
    const mult = (100 - houseEdge) / chance;
    
    const currentBetSol = getBetAmountInSol(amount, isUsdMode);
    const potentialProfitSol = currentBetSol * mult - currentBetSol;
    
    return { winChance: chance, multiplier: mult.toFixed(4), potentialProfitSol };
  }, [target, condition, houseEdge, amount, isUsdMode, solPrice]);

  const handlePlay = async () => {
    const betInSol = getBetAmountInSol(amount, isUsdMode);
    if (betInSol <= 0 || betInSol > balance) {
      toast.error(t('modal_low_balance'));
      return;
    }
    setIsRolling(true);
    try {
      const { win, result, payout } = await onPlay(betInSol, target, condition);
      if (win) toast.success(`${t('win')} ${result.toFixed(2)}. +${getDisplayValue(payout, isUsdMode)}`);
      else toast.error(`${t('lose')} ${result.toFixed(2)}.`);
    } catch (e) {
      toast.error("Error processing bet");
    } finally {
      setIsRolling(false);
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
                        onClick={handlePlay}
                        disabled={isRolling}
                        className={getActionBtnStyle(theme, isRolling)}
                    >
                        <span className="whitespace-nowrap">{isRolling ? t('btn_rolling') : t('btn_roll')}</span>
                    </button>
                }
            >
                {/* --- INSTRUÇÕES --- */}
                <div className="mb-6 border-b border-white/5 pb-4">
                     <h3 className="text-blue-500 text-xs font-bold mb-2 uppercase tracking-widest">
                        {t('how_to_play')}
                     </h3>
                     <p className="text-gray-400 text-sm font-medium leading-relaxed">
                        {t('instr_dice')}
                     </p>
                </div>

                {/* Condition Selector */}
                <div className="flex bg-[#0f212e] rounded-xl p-1 border border-white/5 mb-6 gap-1">
                  <button
                    onClick={() => setCondition('under')}
                    disabled={isRolling}
                    className={`flex-1 ${getOptionBtnStyle(condition === 'under', theme)}`}
                  >
                    {t('btn_roll_under')}
                  </button>
                  <button
                    onClick={() => setCondition('over')}
                    disabled={isRolling}
                    className={`flex-1 ${getOptionBtnStyle(condition === 'over', theme)}`}
                  >
                    {t('btn_roll_over')}
                  </button>
                </div>
            </GameControls>
        </div>

        {/* 2. ÁREA DE JOGO (Direita) */}
        <div className="flex-1 w-full bg-[#131720] p-8 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[450px]">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-full bg-blue-500/5 radial-gradient pointer-events-none"></div>

            {/* STATS BAR */}
            <div className="grid grid-cols-3 gap-4 bg-[#0c0f17] p-4 rounded-2xl border border-white/10 relative z-10 mb-8 shadow-inner">
               <div className="text-center">
                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{t('lbl_multiplier')}</span>
                 <div className="text-blue-400 font-mono font-bold text-xl md:text-2xl drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">x{multiplier}</div>
               </div>
               <div className="text-center border-x border-white/5">
                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{t('lbl_win_chance')}</span>
                 <div className="text-white font-mono font-bold text-xl md:text-2xl">{winChance.toFixed(0)}%</div>
               </div>
               <div className="text-center">
                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{t('lbl_profit')}</span>
                 <div className="text-emerald-400 font-mono font-bold text-xl md:text-2xl drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                   {getDisplayValue(potentialProfitSol, isUsdMode)}
                 </div>
               </div>
            </div>
            
            {/* SLIDER SECTION */}
            <div className="relative z-10 mb-12 px-4 py-6 mt-auto">
               {/* Resultado do Último Roll */}
               {lastRoll !== null && (
                    <div 
                      className={`absolute -top-12 transition-all duration-500 transform -translate-x-1/2 px-4 py-2 rounded-lg font-black text-xl border-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] z-20 ${
                          (condition === 'over' && lastRoll > target) || (condition === 'under' && lastRoll < target)
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/30' 
                          : 'bg-red-500 text-white border-red-400 shadow-red-500/30'
                       }`}
                      style={{ left: `${lastRoll}%` }}
                    >
                       {lastRoll.toFixed(2)}
                    </div>
               )}

               <input 
                 type="range" 
                 min="2" max="98" 
                 value={target} 
                 onChange={(e) => setTarget(Number(e.target.value))}
                 disabled={isRolling}
                 className="w-full h-4 bg-[#0c0f17] rounded-full appearance-none outline-none cursor-pointer border border-white/10"
                 style={{
                   background: `linear-gradient(to right, ${condition === 'under' ? '#3b82f6' : '#ef4444'} 0%, ${condition === 'under' ? '#3b82f6' : '#ef4444'} ${target}%, #1f2937 ${target}%, #1f2937 100%)`
                 }}
               />
                 
               <div className="flex justify-between text-xs font-bold text-gray-600 mt-3 px-1 font-mono">
                 <span>0</span>
                 <span>25</span>
                 <span>50</span>
                 <span>75</span>
                 <span>100</span>
               </div>
                 
               <div className="absolute top-10 -translate-x-1/2 font-bold text-blue-400 bg-[#0c0f17] px-3 py-1 rounded-lg border border-blue-500/30 text-xs shadow-lg" style={{ left: `${target}%` }}>
                 {target}
               </div>
            </div>
        </div>
    </div>
  );
};
export default DiceUI;