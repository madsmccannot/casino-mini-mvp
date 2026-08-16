import { useState } from 'react';
import toast from 'react-hot-toast';
import { LimboUI } from '../components/GameUI/LimboUI';
import { api } from '../services/api';
import { useCasinoStore } from '../state/casinoStore';

export default function LimboPage() {
  const { balance, setBalance } = useCasinoStore();
  const [amount, setAmount] = useState(0.001);
  const [target, setTarget] = useState(2);
  const [result, setResult] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const play = async () => {
    setPlaying(true);
    try {
      const data = await api.placeBet('limbo', amount, { targetMultiplier: target });
      setResult(data.result.outcome.resultMultiplier);
      setBalance(data.newBalance);
      toast[data.result.won ? 'success' : 'error'](data.result.won ? `Won ${data.result.payout.toFixed(4)} SOL` : 'Not high enough');
    } catch (error: any) { toast.error(error.response?.data?.error || error.message); }
    finally { setPlaying(false); }
  };
  return <main className="container mx-auto px-4 py-10"><h1 className="text-center text-5xl font-black mb-10">LIM<span className="text-cyan-400">BO</span></h1><LimboUI {...{ balance, amount, setAmount, target, setTarget, playing, result, onPlay: play }} /></main>;
}
