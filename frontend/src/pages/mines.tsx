import { useState } from 'react';
import MinesUI from '../components/GameUI/MinesUI';
import { useCasinoStore } from '../state/casinoStore';
import { useUIStore } from '../state/uiStore';
import { useWallet } from '@solana/wallet-adapter-react';
import { api } from '../services/api'; 
import { toast } from 'react-hot-toast';

type CellState = 'hidden' | 'gem' | 'bomb';

export default function MinesPage() {
  const { balance, setBalance, getBetAmountInSol } = useCasinoStore();
  const { t } = useUIStore();
  const { connected } = useWallet();
  
  // Estado do Jogo
  const [grid, setGrid] = useState<CellState[]>(Array(25).fill('hidden'));
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [multiplier, setMultiplier] = useState(1.0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Estado dos Inputs
  const [bombCount, setBombCount] = useState(3);
  const [betAmount, setBetAmount] = useState<number>(0.1); 
  const [isUsdMode, setIsUsdMode] = useState(false);

  // 1. Iniciar Jogo (BET)
  const startGame = async () => {
    if (!connected) return toast.error("Connect wallet to play");

    const betInSol = getBetAmountInSol(betAmount, isUsdMode);
    
    if (betInSol <= 0) return toast.error("Invalid wager");
    if (balance < betInSol) return toast.error(t('modal_low_balance'));
    
    try {
        const response = await api.placeBet('mines', betInSol, { bombCount }, 'bet');
        
        setSessionId(response.result.sessionId);
        setBalance(response.newBalance);
        
        // Reset visual
        setIsPlaying(true);
        setGameOver(false);
        setWin(false);
        setMultiplier(1.0);
        setGrid(Array(25).fill('hidden'));

    } catch (error: any) {
        toast.error(error.response?.data?.error || "Error starting game");
    }
  };

  // 2. Revelar Quadrado (REVEAL)
  const handleReveal = async (index: number) => {
    if (!isPlaying || gameOver || win || grid[index] !== 'hidden' || !sessionId) return;
    
    try {
        const response = await api.placeBet('mines', 0, { sessionId, tileIndex: index }, 'reveal');
        
        const outcome = response.result.outcome; 
        const newGrid = [...grid];

        if (outcome.status === 'boom') {
            newGrid[index] = 'bomb';
            // Revelar todas as bombas
            if (outcome.bombs) outcome.bombs.forEach((b: number) => newGrid[b] = 'bomb');
            
            setGrid(newGrid);
            setGameOver(true);
            setIsPlaying(false);
            setSessionId(null);
            toast.error(t('modal_bomb_msg'));
        } else {
            newGrid[index] = 'gem';
            setGrid(newGrid);
            setMultiplier(outcome.multiplier);
        }
    } catch (error) { 
        console.error(error); 
    }
  };

  // 3. Levantar Dinheiro (CASHOUT)
  const handleCashout = async () => {
    if (!isPlaying || gameOver || !sessionId) return;
    
    try {
        const response = await api.placeBet('mines', 0, { sessionId }, 'cashout');
        
        setBalance(response.newBalance);
        setWin(true);
        setIsPlaying(false);
        setSessionId(null);
        
        // Revelar bombas restantes
        const newGrid = [...grid];
        if (response.result.outcome.bombs) {
            response.result.outcome.bombs.forEach((b: number) => {
                if (newGrid[b] === 'hidden') newGrid[b] = 'bomb';
            });
        }
        setGrid(newGrid);

        toast.success(`${t('win')}!`);
        
    } catch (error) { console.error(error); }
  };

  const handleMainAction = () => {
      if (isPlaying) {
          handleCashout();
      } else {
          startGame();
      }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="flex items-center justify-center gap-4 mb-8">
            <span className="text-4xl">💣</span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic">
                SPACE<span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">MINES</span>
            </h1>
        </div>

        <MinesUI 
            grid={grid}
            isPlaying={isPlaying}
            gameOver={gameOver}
            win={win}
            multiplier={multiplier}
            onReveal={handleReveal}
            onAction={handleMainAction}
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            minesCount={bombCount}
            setMinesCount={setBombCount}
            isUsdMode={isUsdMode}
            setIsUsdMode={setIsUsdMode}
        />
    </div>
  );
}