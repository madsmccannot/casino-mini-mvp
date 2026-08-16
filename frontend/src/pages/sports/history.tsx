import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { SportsLayout } from '../../components/Sports/SportsLayout';
import { sportsbookClient } from '../../services/sportsbookClient';
import { useCasinoStore } from '../../state/casinoStore';

const TicketCard = ({ ticket, refresh }: { ticket: any; refresh: () => Promise<void> }) => {
  const [quote, setQuote] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const setBalance = useCasinoStore(state => state.setBalance);
  const requestQuote = async () => {
    setBusy(true);
    try { setQuote((await sportsbookClient.cashoutQuote(ticket.ticketId)).quote); }
    catch (error: any) { toast.error(error.response?.data?.error || error.message); }
    finally { setBusy(false); }
  };
  const accept = async () => {
    if (!quote || new Date(quote.expiresAt).getTime() <= Date.now()) return toast.error('Cashout quote expired');
    setBusy(true);
    try { const data = await sportsbookClient.cashout(ticket.ticketId, quote.quoteId); setBalance(data.newBalance); setQuote(null); await refresh(); toast.success('Cashout accepted'); }
    catch (error: any) { setQuote(null); toast.error(error.response?.data?.error || error.message); }
    finally { setBusy(false); }
  };
  return <article className="p-4 mb-3 rounded-xl bg-[#101b27] border border-white/5"><div className="flex justify-between"><b>{ticket.type} {ticket.context === 'LIVE' && <span className="text-red-400 text-xs">● LIVE</span>}</b><span>{ticket.status}</span></div><p className="text-xs text-gray-500">Stake {Number(ticket.stakeMinor)/1e9} SOL · Max {Number(ticket.maxPayoutMinor)/1e9} SOL</p>{ticket.cashoutAmountMinor && <p className="text-emerald-400 text-sm">Cashed out: {Number(ticket.cashoutAmountMinor)/1e9} SOL</p>}{ticket.legs.map((leg: any) => <div key={leg.selectionId} className="text-sm mt-2">{leg.selectionName} · {(Number(leg.oddsMillionths)/1e6).toFixed(2)} · {leg.result}</div>)}{ticket.status === 'ACCEPTED' && !quote && <button disabled={busy} onClick={requestQuote} className="mt-4 w-full bg-emerald-700 disabled:bg-gray-700 rounded-lg py-2 font-bold">REQUEST CASHOUT</button>}{quote && <div className="mt-4 border border-emerald-500/30 rounded-lg p-3"><p className="font-bold">Offer: {(Number(quote.amountMinor)/1e9).toFixed(4)} SOL</p><p className="text-[10px] text-gray-500">Expires {new Date(quote.expiresAt).toLocaleTimeString()}</p><button disabled={busy} onClick={accept} className="mt-2 w-full bg-emerald-600 rounded py-2 font-bold">ACCEPT CASHOUT</button></div>}</article>;
};

export default function SportsHistoryPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const refresh = useCallback(async () => { const data = await sportsbookClient.tickets(); setTickets(data.tickets); }, []);
  useEffect(() => {
    let active = true;
    sportsbookClient.tickets().then(data => { if (active) setTickets(data.tickets); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  return <SportsLayout><h2 className="text-2xl font-black mb-4">MY TICKETS</h2>{tickets.map(ticket => <TicketCard key={ticket.ticketId} ticket={ticket} refresh={refresh} />)}</SportsLayout>;
}
