import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { CrashUI } from '../components/GameUI/CrashUI';
import { api } from '../services/api';
import { useCasinoStore } from '../state/casinoStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const WS_URL = API_URL.replace(/^http/, 'ws').replace(/\/api\/?$/, '/api/crash/stream');

export default function CrashPage() {
  const { balance, setBalance } = useCasinoStore();
  const [amount, setAmount] = useState(0.001);
  const [autoCashout, setAutoCashout] = useState(2);
  const [round, setRound] = useState<any>();
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [autoBet, setAutoBet] = useState(false);
  const autoBetRef = useRef(false);
  const settingsRef = useRef({ amount, autoCashout });
  const placedRound = useRef<string>();
  const placedBetId = useRef<string>();
  useEffect(() => { autoBetRef.current = autoBet; settingsRef.current = { amount, autoCashout }; }, [autoBet, amount, autoCashout]);
  useEffect(() => {
    let socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout>;
    let active = true;
    const connect = () => {
      socket = new WebSocket(WS_URL);
      socket.onmessage = async event => {
        const next = JSON.parse(event.data); setRound(next);
        if (next.status === 'CRASHED' && placedRound.current === next.roundId) {
          const funds = await api.get('account/balance').catch(() => null);
          if (funds) setBalance(Number(funds.availableMinor) / 1e9);
        }
        if (placedRound.current && next.roundId !== placedRound.current) { placedRound.current = undefined; setPlaced(false); }
        if (autoBetRef.current && !placedRound.current && next.status === 'BETTING') {
          const betId = crypto.randomUUID();
          placedRound.current = next.roundId;
          placedBetId.current = betId;
          api.post('crash/bet', { roundId: next.roundId, betAmount: settingsRef.current.amount, autoCashout: settingsRef.current.autoCashout, idempotencyKey: betId })
            .then(() => setPlaced(true))
            .catch(() => { placedRound.current = undefined; placedBetId.current = undefined; autoBetRef.current = false; setAutoBet(false); });
        }
      };
      socket.onclose = () => { if (active) retry = setTimeout(connect, 1500); };
    };
    api.get('crash/round').then(setRound).catch(() => undefined); connect();
    return () => { active = false; clearTimeout(retry); socket?.close(); };
  }, [setBalance]);
  const bet = async () => {
    setBusy(true);
    try {
      const betId = crypto.randomUUID();
      await api.post('crash/bet', { roundId: round.roundId, betAmount: amount, autoCashout, idempotencyKey: betId });
      setPlaced(true); placedRound.current = round.roundId; placedBetId.current = betId; toast.success('Crash bet placed');
    } catch (error: any) { toast.error(error.response?.data?.error || error.message); }
    finally { setBusy(false); }
  };
  const cashout = async () => {
    if (!placedRound.current || !placedBetId.current) return;
    setBusy(true);
    try {
      const data = await api.post('crash/cashout', { betId: placedBetId.current });
      toast.success(`Cashed out at ${data.multiplier.toFixed(2)}×`); setPlaced(false);
    } catch (error: any) { toast.error(error.response?.data?.error || error.message); }
    finally { setBusy(false); }
  };
  return <main className="container mx-auto px-4 py-10"><h1 className="text-center text-5xl font-black mb-10">CR<span className="text-fuchsia-400">ASH</span></h1><CrashUI {...{ balance, amount, setAmount, autoCashout, setAutoCashout, round, busy, placed, autoBet, setAutoBet, onBet: bet, onCashout: cashout }} /></main>;
}
