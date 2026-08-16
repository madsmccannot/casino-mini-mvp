import type { NextPage } from 'next';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useCasinoStore } from '../state/casinoStore';
import { useUIStore } from '../state/uiStore';
import { useWallet } from '@solana/wallet-adapter-react';
import { api } from '../services/api';
import DiceUI from '../components/GameUI/DiceUI'; 
import { rngClient } from '../services/rngClient'; 

const HOUSE_EDGE = 1; 

const DicePage: NextPage = () => {
  const { balance, setBalance } = useCasinoStore();
  const { t } = useUIStore();
  const { connected } = useWallet();
  
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [nonce, setNonce] = useState(1);
  
  // Client Seed
  const [clientSeed] = useState(() => rngClient.generateClientSeed());

  const handlePlay = async (amount: number, target: number, condition: 'over' | 'under') => {
    if (!connected) {
       toast.error("Connect wallet to play");
       throw new Error("Wallet not connected");
    }

    if (amount <= 0 || amount > balance) {
      toast.error(t('modal_low_balance'));
      throw new Error(t('modal_low_balance'));
    }
    
    const currentNonce = nonce;

    try {
      const data = await api.placeBet('dice', amount, { 
        target, 
        condition,
        clientSeed,
        nonce: currentNonce,
      }); 
      
      // Robustez: Backend pode chamar 'rolled' ou 'outcome'
      const rollResult = data.result.rolled ?? data.result.outcome ?? 0;
      const payoutValue = data.result.payout || 0;
      
      setLastRoll(rollResult); 
      setBalance(data.newBalance);

      setNonce(current => current + 1);
      
      return {
        win: payoutValue > 0,
        result: rollResult,
        payout: payoutValue
      };
      
    } catch (error: any) {
      const msg = error.response?.data?.error || "Error processing bet";
      toast.error(msg);
      throw error;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in max-w-6xl">
       <div className="flex items-center justify-center gap-4 mb-12">
         <span className="text-4xl">🎲</span>
         <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic">
           CYBER<span className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">DICE</span>
         </h1>
       </div>

       <DiceUI 
          houseEdge={HOUSE_EDGE}
          lastRoll={lastRoll}
          onPlay={handlePlay}
       />
       
       <div className="mt-8 text-center text-[10px] text-gray-600 font-mono opacity-50">
           Client Seed: {clientSeed.slice(0, 8)}... | Nonce: {nonce}
       </div>
    </div>
  );
};

export default DicePage;
