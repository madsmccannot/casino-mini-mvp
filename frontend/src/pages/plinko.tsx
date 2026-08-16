import type { NextPage } from 'next';
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useCasinoStore } from '../state/casinoStore';
import { useEvmWallet } from '../hooks/useEvmWallet';
import { api } from '../services/api';
import PlinkoUI, { VisualBall } from '../components/GameUI/PlinkoUI';

const MULTIPLIERS: Record<string, Record<number, number[]>> = {
  'Low': {
    8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    12: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16]
  },
  'Medium': { 
    8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    12: [33, 11, 4, 2, 1.1, 0.5, 0.472, 0.5, 1.1, 2, 4, 11, 33],
    16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
  },
  'High': {
    8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    12: [170, 24, 8, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8, 24, 170],
    16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
  }
};

let nextVisualBallId = 0;

const PlinkoPage: NextPage = () => {
  const { balance, setBalance } = useCasinoStore();
  const { connected } = useEvmWallet();
  const [activeBalls, setActiveBalls] = useState<VisualBall[]>([]);

  const handleDrop = async (rows: number, risk: string, betAmount: number) => {
    if (!connected) return toast.error("Connect wallet first");
    if (betAmount > balance) return toast.error("Insufficient balance");

    try {
      const data = await api.placeBet('plinko', betAmount, { rows, risk });

      setBalance(data.newBalance);

      const newBall: VisualBall = {
        id: Date.now() * 1000 + (nextVisualBallId++ % 1000),
        path: data.result.outcome.path || [], 
        finalMultiplier: data.result.multiplier,
        payout: data.result.payout
      };

      setActiveBalls((prev) => [...prev, newBall]);

    } catch (error: any) {
      const msg = error.response?.data?.error || 'Bet failed';
      toast.error(msg);
    }
  };

  const handleAnimationComplete = useCallback((ballId: number, payout: number, mult: number) => {
    setActiveBalls((prev) => prev.filter(b => b.id !== ballId));
    
    if (payout > 0) {
      toast.success(`+${payout.toFixed(4)} (${mult}x)`, { 
        position: 'bottom-right',
        duration: 2000,
        style: { background: '#10B981', color: 'white' }
      });
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in max-w-6xl">
       <div className="flex items-center gap-4 mb-8 justify-center">
         <span className="text-4xl">🎯</span>
         <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic">
           NEON<span className="text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">PLINKO</span>
         </h1>
       </div>

       <PlinkoUI 
          balls={activeBalls}
          onDrop={handleDrop}
          onAnimationComplete={handleAnimationComplete}
          getMultipliers={(rows, risk) => MULTIPLIERS[risk]?.[rows] || MULTIPLIERS['Low'][8]}
       />
    </div>
  );
};

export default PlinkoPage;
