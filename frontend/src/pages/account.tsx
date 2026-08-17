import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { accountClient } from '../services/accountClient';
import { useEvmWallet } from '../hooks/useEvmWallet';

const originalGames = ['coinflip', 'dice', 'mines', 'plinko', 'roulette', 'crash', 'limbo', 'blackjack'];

export default function AccountPage() {
  const { connected, address } = useEvmWallet();
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [bets, setBets] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [retention, setRetention] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const favoriteIds = useMemo(() => new Set(favorites.filter((item) => item.itemType === 'original').map((item) => item.itemId)), [favorites]);

  useEffect(() => {
    if (!connected) return;
    Promise.all([accountClient.profile(), accountClient.bets(), accountClient.favorites(), accountClient.retention()])
      .then(([nextProfile, nextBets, nextFavorites, nextRetention]) => {
        setProfile(nextProfile); setName(nextProfile.displayName ?? ''); setBets(nextBets.bets ?? []); setFavorites(nextFavorites.favorites ?? []); setRetention(nextRetention);
      })
      .catch((error: any) => toast.error(error.message || 'Account unavailable'))
      .finally(() => setLoading(false));
  }, [connected, address]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    try { const next = await accountClient.updateProfile(name.trim() || null); setProfile(next); toast.success('Profile saved'); } catch (error: any) { toast.error(error.message || 'Unable to save profile'); }
  };

  const toggleFavorite = async (game: string) => {
    try {
      if (favoriteIds.has(game)) { await accountClient.removeFavorite('original', game); setFavorites((items) => items.filter((item) => !(item.itemType === 'original' && item.itemId === game))); }
      else { const result = await accountClient.addFavorite('original', game); setFavorites((items) => [result.favorite, ...items]); }
    } catch (error: any) { toast.error(error.message || 'Unable to update favorites'); }
  };

  if (!connected) return <main className="max-w-3xl mx-auto px-4 py-16"><div className="rounded-2xl border border-white/10 bg-[#101827] p-8 text-center"><h1 className="text-3xl font-black">ACCOUNT</h1><p className="text-gray-400 mt-3">Connect your wallet to view your account.</p></div></main>;

  return <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
    <header><p className="text-xs uppercase tracking-[0.25em] text-blue-300 font-bold">Account</p><h1 className="text-4xl font-black">Your player hub</h1><p className="text-gray-400 mt-2">Profile, history and preferences are linked to your internal account — never to custody keys.</p></header>
    <section className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
      <form onSubmit={saveProfile} className="rounded-2xl border border-white/10 bg-[#101827] p-6"><h2 className="text-xl font-black">Profile</h2><label className="block text-xs text-gray-400 mt-5 mb-2">Display name</label><input value={name} onChange={(event) => setName(event.target.value)} maxLength={32} placeholder="Your name" className="w-full rounded-lg bg-black/20 border border-white/10 px-3 py-3 outline-none focus:border-blue-400"/><p className="text-xs text-gray-500 mt-2">2–32 characters. No private information is required.</p><button disabled={loading} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-bold disabled:opacity-50">Save profile</button>{profile?.primaryWallet && <p className="mt-5 text-xs text-gray-500 font-mono break-all">{profile.primaryWallet.address} · chain {profile.primaryWallet.chainId}</p>}</form>
      <div className="rounded-2xl border border-white/10 bg-[#101827] p-6"><h2 className="text-xl font-black">Retention status</h2><p className="text-sm text-gray-400 mt-3">Referral, VIP and promotional rewards remain disabled until compliance and funding rules are approved.</p><div className="mt-5 space-y-2 text-sm"><div className="flex justify-between"><span className="text-gray-400">VIP tier</span><span>{retention?.vip?.tier ?? 'STANDARD'}</span></div><div className="flex justify-between"><span className="text-gray-400">Cashback</span><span className="text-amber-300">Disabled</span></div><div className="flex justify-between"><span className="text-gray-400">Referral code</span><span className="font-mono">{retention?.referral?.code ?? '—'}</span></div></div></div>
    </section>
    <section className="rounded-2xl border border-white/10 bg-[#101827] p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-black">Favorite Originals</h2><Link href="/" className="text-xs text-blue-300 hover:text-white">Browse games</Link></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">{originalGames.map((game) => <button type="button" key={game} onClick={() => toggleFavorite(game)} className={`rounded-lg px-3 py-3 text-left text-sm font-bold border ${favoriteIds.has(game) ? 'border-blue-400/50 bg-blue-500/15 text-blue-200' : 'border-white/10 bg-black/10 text-gray-400 hover:text-white'}`}>{favoriteIds.has(game) ? '★ ' : '☆ '}{game}</button>)}</div></section>
    <section className="rounded-2xl border border-white/10 bg-[#101827] p-6"><h2 className="text-xl font-black">Bet history</h2><div className="overflow-x-auto mt-4">{bets.length === 0 ? <p className="text-sm text-gray-500">No bets recorded yet.</p> : <table className="w-full text-sm"><thead className="text-left text-xs uppercase tracking-wider text-gray-500"><tr><th className="py-2">Game</th><th>Stake</th><th>Result</th><th>Status</th><th>Date</th></tr></thead><tbody>{bets.map((bet) => <tr key={bet.betId} className="border-t border-white/5"><td className="py-3 font-bold">{bet.game}</td><td>{Number(bet.wager).toFixed(2)} USDC</td><td className={bet.profit >= 0 ? 'text-emerald-300' : 'text-red-300'}>{bet.profit >= 0 ? '+' : ''}{Number(bet.profit).toFixed(2)}</td><td>{bet.status}</td><td className="text-gray-500">{new Date(bet.timestamp).toLocaleString()}</td></tr>)}</tbody></table>}</div></section>
  </main>;
}
