import { useState } from 'react';
import toast from 'react-hot-toast';
import { BlackjackUI } from '../components/GameUI/BlackjackUI';
import { api } from '../services/api';
import { useCasinoStore } from '../state/casinoStore';

export default function BlackjackPage() {
  const { balance, setBalance } = useCasinoStore();
  const [amount, setAmount] = useState(0.001);
  const [game, setGame] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const apply = (data: any) => {
    setGame(data.result.outcome); setSessionId(data.result.sessionId); setBalance(data.newBalance);
    if (data.result.outcome.status !== 'active') toast[data.result.won ? 'success' : data.result.outcome.status === 'push' ? 'success' : 'error'](data.result.outcome.status.toUpperCase());
  };
  const act = async (action: 'bet' | 'hit' | 'stand') => {
    setBusy(true);
    try { apply(await api.placeBet('blackjack', action === 'bet' ? amount : 0, action === 'bet' ? {} : { sessionId }, action)); }
    catch (error: any) { toast.error(error.response?.data?.error || error.message); }
    finally { setBusy(false); }
  };
  return <main className="container mx-auto px-4 py-10"><h1 className="text-center text-5xl font-black mb-10">BLACK<span className="text-emerald-400">JACK</span></h1><BlackjackUI {...{ balance, amount, setAmount, game, busy, onDeal: () => act('bet'), onHit: () => act('hit'), onStand: () => act('stand') }} /></main>;
}
