import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../state/uiStore';
import { useCasinoStore } from '../../state/casinoStore';
import { GameControls, getOptionBtnStyle, getActionBtnStyle } from '../ui/GameControls';
import { toast } from 'react-hot-toast';

export interface VisualBall {
  id: number;
  path: number[]; 
  finalMultiplier: number;
  payout: number;
}

interface PlinkoUIProps {
  balls: VisualBall[]; 
  onAnimationComplete: (id: number, payout: number, mult: number) => void; 
  onDrop: (rows: number, risk: string, bet: number) => void; 
  getMultipliers: (rows: number, risk: string) => number[];
}

// --- COMPONENTE BOLA (Física Simulada) ---
const Ball = ({ data, onFinish, rows }: { data: VisualBall, onFinish: () => void, rows: number }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let startTime = Date.now();
    const durationPerRow = 250; // Velocidade da queda
    const totalDuration = rows * durationPerRow;
    
    // Dimensões Virtuais do Tabuleiro (Devem bater certo com o CSS)
    const BOARD_HEIGHT = 420; 
    const MAX_WIDTH_SPREAD = 360; 

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);

      if (progress >= 1) {
        onFinish();
        return;
      }

      // Física simples (Ease Quadratic para simular gravidade)
      const easeProgress = progress * progress; 
      const currentY = easeProgress * BOARD_HEIGHT;
      
      // Calcular posição X baseada no caminho
      // Se path=[0,1,0], na linha 2 (index 1) a bola foi para a direita
      const currentRowIndex = Math.floor(progress * rows);
      
      // Quantas vezes foi para a direita até agora?
      const movesRight = data.path.slice(0, currentRowIndex + 1).filter(p => p === 1).length;
      
      // Largura da pirâmide nesta altura
      const currentSpread = (currentY / BOARD_HEIGHT) * MAX_WIDTH_SPREAD;
      
      // Posição normalizada (-0.5 esquerda, +0.5 direita)
      // Evitamos divisão por zero na primeira linha
      const normalizedPos = currentRowIndex === 0 ? 0 : (movesRight / currentRowIndex) - 0.5;
      const safePos = isNaN(normalizedPos) ? 0 : normalizedPos;

      // Adicionamos um pequeno "jitter" aleatório para parecer mais natural
      const jitter = Math.sin(progress * 20) * 2;

      setPos({ 
        x: (safePos * currentSpread * 2) + jitter, 
        y: currentY 
      });
      
      requestAnimationFrame(animate);
    };

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div 
      className="absolute w-3 h-3 md:w-4 md:h-4 rounded-full shadow-[0_0_10px_#ec4899] border-2 border-white z-20 pointer-events-none"
      style={{ 
        backgroundColor: '#ec4899',
        transform: `translate(calc(-50% + ${pos.x}px), ${pos.y}px)` 
      }}
    />
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function PlinkoUI({ balls, onAnimationComplete, onDrop, getMultipliers }: PlinkoUIProps) {
  const { t } = useUIStore();
  const { balance, getBetAmountInSol } = useCasinoStore();
  
  const [betAmount, setBetAmount] = useState(0.1);
  const [isUsdMode, setIsUsdMode] = useState(false);
  const [rows, setRows] = useState(16); 
  const [risk, setRisk] = useState('Medium'); 

  const theme = 'pink';
  const multipliers = getMultipliers(rows, risk);

  const riskOptions = [
      { value: 'Low', label: t('lbl_low') },
      { value: 'Medium', label: t('lbl_medium') },
      { value: 'High', label: t('lbl_high') }
  ];

  const handleDropClick = () => {
      const betInSol = getBetAmountInSol(betAmount, isUsdMode);
      if (betInSol <= 0) return toast.error(t('msg_invalid_amount'));
      if (betInSol > balance) return toast.error(t('modal_low_balance'));
      
      onDrop(rows, risk, betInSol);
  };

  const renderPins = () => {
    const pins = [];
    // Ajustamos o espaçamento vertical dinamicamente
    const verticalGap = rows === 16 ? 18 : rows === 12 ? 24 : 32;

    for (let i = 0; i < rows; i++) {
      const itemsInRow = i + 3; 
      pins.push(
        <div 
          key={i} 
          className="flex justify-center"
          style={{ marginBottom: verticalGap + 'px', gap: (400 / rows) + 'px' }} 
        > 
          {Array(itemsInRow).fill(0).map((_, j) => (
             <div 
               key={`${i}-${j}`} 
               className="w-1.5 h-1.5 bg-white/20 rounded-full shadow-[0_0_2px_rgba(255,255,255,0.1)]" 
             />
          ))}
        </div>
      );
    }
    return pins;
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full justify-center items-start max-w-6xl mx-auto">
        
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
                    <button onClick={handleDropClick} className={getActionBtnStyle(theme)}>
                        <span className="whitespace-nowrap">{t('btn_drop')}</span>
                    </button>
                }
            >
                <div className="mb-6 border-b border-white/5 pb-4">
                     <h3 className="text-pink-500 text-xs font-bold mb-2 uppercase tracking-widest">
                        {t('how_to_play')}
                     </h3>
                     <p className="text-gray-400 text-sm font-medium leading-relaxed">
                        {t('instr_plinko')}
                     </p>
                </div>

                {/* Risk Selector */}
                <div className="mb-6">
                    <span className="text-xs font-bold text-gray-400 tracking-wide uppercase block mb-2 whitespace-nowrap">
                        {t('lbl_risk')}
                    </span>
                    <div className="bg-[#0f212e] p-1 rounded-xl flex gap-1">
                        {riskOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setRisk(opt.value)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${risk === opt.value ? 'bg-[#1a2c38] text-white shadow-lg border border-white/10' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Rows Selector */}
                <div className="mb-2">
                    <span className="text-xs font-bold text-gray-400 tracking-wide uppercase block mb-2 whitespace-nowrap">
                        {t('lbl_rows')}
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                        {[8, 12, 16].map((r) => (
                            <button key={r} onClick={() => setRows(r)} className={getOptionBtnStyle(rows === r, theme)}>
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            </GameControls>
        </div>

        {/* 2. TABULEIRO (Direita) */}
        <div className="relative bg-[#131720] pt-8 pb-2 px-4 rounded-[40px] border border-white/5 shadow-2xl flex flex-col items-center overflow-hidden min-h-[500px] w-full max-w-[600px]">
             
             {/* Gradient Overlay */}
             <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-pink-500/10 to-transparent pointer-events-none" />

             {/* Área das Bolas */}
             <div className="absolute top-8 left-1/2 w-0 h-0 z-20">
               {balls.map(ball => (
                 <Ball 
                   key={ball.id} 
                   data={ball} 
                   rows={rows} 
                   onFinish={() => onAnimationComplete(ball.id, ball.payout, ball.finalMultiplier)} 
                 />
               ))}
             </div>

             {/* Pinos */}
             <div className="relative z-10 mt-4 scale-90 origin-top w-full">
                {renderPins()}
             </div>

             {/* Multiplicadores (Buckets) */}
             <div className="flex justify-center gap-1 md:gap-2 mt-auto relative z-10 w-full px-2 mb-4">
               {multipliers.map((m, i) => {
                 let colorClass = 'bg-[#243b4a] text-gray-400 shadow-none'; 
                 
                 // Cores baseadas no multiplicador
                 if (m >= 10) colorClass = 'bg-pink-600 text-white shadow-[0_0_15px_#db2777] animate-pulse'; 
                 else if (m >= 2) colorClass = 'bg-pink-500 text-white shadow-[0_0_10px_#ec4899]'; 
                 else if (m > 0.5) colorClass = 'bg-[#3b4a5a] text-gray-200';
                 
                 return (
                   <div key={i} className={`flex-1 h-8 md:h-10 flex items-center justify-center text-[9px] md:text-xs font-bold rounded-md transition-all duration-300 ${colorClass}`}>
                     {m}x
                   </div>
                 )
               })}
             </div>
        </div>
    </div>
  );
}