import type { NextPage } from 'next';
import { useCasinoStore } from '../state/casinoStore';
import { useUIStore } from '../state/uiStore';
import { useWallet } from '@solana/wallet-adapter-react';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import RouletteUI from '../components/GameUI/RouletteUI';

const RoulettePage: NextPage = () => {
  const { balance, setBalance } = useCasinoStore();
  const { connected } = useWallet();
  const { t } = useUIStore();

  const handlePlay = async (amount: number, betType: string) => {
    if (!connected) {
      toast.error("Connect wallet first");
      throw new Error("Wallet not connected");
    }
    
    if (amount > balance) {
      toast.error(t('modal_low_balance'));
      throw new Error("Insufficient balance");
    }

    try {
        const params = { color: betType }; 

        const data = await api.placeBet('roulette', amount, params);
        
        setBalance(data.newBalance);

        return {
            win: data.result.payout > 0,
            resultNumber: data.result.outcome.number,
            payout: data.result.payout
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
         <span className="text-4xl">🎰</span>
         <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic">
           ROUL<span className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">ETTE</span>
         </h1>
       </div>

       <RouletteUI onPlay={handlePlay} />
    </div>
  );
};

export default RoulettePage;
