import type { NextPage } from 'next';
import CoinflipUI from '../components/GameUI/CoinflipUI';
import { api } from '../services/api';
import { useCasinoStore } from '../state/casinoStore';
import { useEvmWallet } from '../hooks/useEvmWallet';
import { toast } from 'react-hot-toast';

const CoinflipPage: NextPage = () => {
  const { balance, setBalance } = useCasinoStore();
  const { connected } = useEvmWallet();

  const handlePlay = async (amount: number, side: 'heads' | 'tails') => {
    if (!connected) {
      toast.error("Connect wallet to play");
      throw new Error("Wallet not connected");
    }
    
    if (amount > balance) {
      toast.error("Insufficient balance");
      throw new Error("Insufficient balance");
    }

    try {
      // 1. Chamar API
      const data = await api.placeBet('coinflip', amount, { side });

      // 2. Atualizar o saldo global
      setBalance(data.newBalance);

      // 3. Retornar o resultado para a UI (FORMATO CORRIGIDO)
      return {
        win: data.result.payout > 0,
        result: data.result.outcome.result,
        payout: data.result.payout
      };

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || 'Error processing bet';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
       <div className="flex items-center justify-center gap-4 mb-12">
         <span className="text-4xl">🪙</span>
         <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic">
           COIN<span className="text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">FLIP</span>
         </h1>
       </div>
       <CoinflipUI onPlay={handlePlay} />
    </div>
  );
};

export default CoinflipPage;
