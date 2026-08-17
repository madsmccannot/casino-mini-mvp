import type { NextPage } from 'next';
import Link from 'next/link';
import { useMemo } from 'react';
import { useUIStore } from '../state/uiStore';
import { useCasinoStore } from '../state/casinoStore';
import { useEvmWallet } from '../hooks/useEvmWallet';
import { EvmWallet } from '../components/WalletConnect/EvmWallet';

const Home: NextPage = () => {
  const { t, language } = useUIStore();
  const { balance, isAuthenticated } = useCasinoStore();
  const { connected } = useEvmWallet();

  const games = useMemo(() => [
    { id: 'coinflip', name: t('game_coinflip'), desc: t('desc_coinflip'), icon: '🪙', tone: 'amber', accent: 'bg-amber-400' },
    { id: 'dice', name: t('game_dice'), desc: t('desc_dice'), icon: '🎲', tone: 'emerald', accent: 'bg-emerald-400' },
    { id: 'roulette', name: t('game_roulette'), desc: t('desc_roulette'), icon: '🎰', tone: 'rose', accent: 'bg-rose-400' },
    { id: 'plinko', name: t('game_plinko'), desc: t('desc_plinko'), icon: '🎯', tone: 'pink', accent: 'bg-pink-400' },
    { id: 'mines', name: t('game_mines'), desc: t('desc_mines'), icon: '💣', tone: 'blue', accent: 'bg-blue-400' },
    { id: 'crash', name: t('game_crash'), desc: t('desc_crash'), icon: '🚀', tone: 'violet', accent: 'bg-violet-400' },
    { id: 'limbo', name: t('game_limbo'), desc: t('desc_limbo'), icon: '♾️', tone: 'cyan', accent: 'bg-cyan-400' },
    { id: 'blackjack', name: t('game_blackjack'), desc: t('desc_blackjack'), icon: '🂡', tone: 'emerald', accent: 'bg-emerald-400' },
  ], [language, t]);

  return (
    <div className="relative overflow-hidden pb-16">
      <div className="pointer-events-none absolute -top-40 left-1/3 h-[520px] w-[520px] rounded-full bg-blue-600/10 blur-[130px]" />
      <div className="pointer-events-none absolute top-[560px] right-0 h-[420px] w-[420px] rounded-full bg-fuchsia-600/10 blur-[130px]" />

      <section className="mx-auto grid max-w-7xl min-w-0 items-start gap-8 px-4 pt-4 md:px-8 md:pt-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:gap-10">
        <div className="relative z-10">
          <div className="mb-6 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.18em]">
            <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-blue-300">{t('hero_pre')}</span>
            <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-emerald-300">{t('home_fair_badge')}</span>
          </div>
          <h1 data-no-translate className="max-w-full break-words text-6xl font-black leading-[0.9] tracking-[-0.07em] text-white sm:text-8xl lg:text-[6.2rem] xl:text-[7.5rem]">
            <span className="block bg-gradient-to-b from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">{t('hero_line1')}</span>
            <span className="block bg-gradient-to-r from-blue-400 via-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">{t('hero_line2')}</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">{t('hero_description')}</p>
          <div className="mt-8 inline-flex rounded-2xl border border-white/10 bg-slate-950/70 p-1.5 shadow-xl shadow-blue-950/20" role="tablist" aria-label="Product areas">
            <Link href="/casino" role="tab" className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-slate-100"><span className="text-base">◈</span>{t('home_open_casino')}</Link>
            <Link href="/sports" role="tab" className="group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-slate-300 transition hover:bg-blue-600/20 hover:text-white"><span className="text-base">↗</span>{t('home_open_sports')}</Link>
          </div>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-5 border-t border-white/10 pt-5 text-xs text-slate-500">
            <div><strong className="block text-lg text-white">8</strong>{t('home_originals')}</div>
            <div><strong className="block text-lg text-white">USDC</strong>{t('home_currency')}</div>
            <div><strong className="block text-lg text-white">24/7</strong>{t('home_play_anytime')}</div>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-xl min-w-0 rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-xl sm:p-7 lg:justify-self-end">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">{t('home_account')}</p><h2 className="mt-2 text-2xl font-black text-white">{t('home_ready')}</h2></div>
            <Link href="/account" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-white/25 hover:text-white">{t('home_account_link')}</Link>
          </div>
          <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-widest text-slate-500">{t('bankroll_label')}</p>
            <p className="mt-2 text-4xl font-black text-white">${balance.toFixed(2)} <span className="text-sm font-bold text-slate-500">USDC</span></p>
            <p className="mt-2 text-sm text-slate-400">{isAuthenticated ? t('home_authenticated') : connected ? t('home_sign_to_continue') : t('home_connect_to_start')}</p>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="min-w-0 flex-1"><EvmWallet /></div>
            <button type="button" disabled={!isAuthenticated} onClick={() => window.dispatchEvent(new Event('casino:open-deposit'))} className="min-h-12 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-5 text-sm font-extrabold text-emerald-200 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-600">{t('btn_deposit')}</button>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase tracking-wider"><span className="rounded-lg bg-blue-500/15 px-2 py-2 text-blue-200">01 {t('home_step_connect')}</span><span className="rounded-lg bg-white/5 px-2 py-2 text-slate-500">02 {t('home_step_deposit')}</span><span className="rounded-lg bg-white/5 px-2 py-2 text-slate-500">03 {t('home_step_play')}</span></div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-7xl px-4 md:px-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-300">{t('home_games_kicker')}</p><h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">{t('home_games_title')}</h2></div><Link href="/casino" className="text-sm font-bold text-blue-300 hover:text-white">{t('home_view_all')} →</Link></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {games.map((game) => <Link key={game.id} href={`/${game.id}`} className="group relative min-h-[190px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75 p-5 transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-slate-800/90 hover:shadow-xl hover:shadow-blue-950/20"><div className={`absolute -right-6 -top-6 h-28 w-28 rounded-full ${game.accent}/10 blur-2xl transition group-hover:scale-150`} /><div className="relative flex h-full flex-col justify-between"><div className="flex items-start justify-between"><span data-no-translate className="text-4xl transition duration-300 group-hover:scale-110">{game.icon}</span><span data-no-translate className="text-xs text-slate-600 transition group-hover:text-slate-300">↗</span></div><div><h3 data-no-translate className="text-lg font-black tracking-wide text-white">{game.name}</h3><p className="mt-1 text-xs text-slate-500 group-hover:text-slate-400">{game.desc}</p></div></div></Link>)}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4 md:px-8"><div className="grid gap-4 md:grid-cols-3"><Link href="/sports" className="group rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-950/80 to-slate-900 p-6 transition hover:border-blue-300/40"><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">{t('home_sports_label')}</p><h3 className="mt-3 text-2xl font-black text-white">{t('home_sports_title')}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{t('home_sports_description')}</p><span className="mt-5 block text-sm font-bold text-blue-300 group-hover:text-white">{t('home_browse_markets')} →</span></Link><div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">{t('home_fairness_kicker')}</p><h3 className="mt-3 text-2xl font-black text-white">{t('home_fairness_title')}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{t('home_fairness_description')}</p></div><Link href="/account" className="group rounded-2xl border border-white/10 bg-slate-900/60 p-6 transition hover:border-white/25"><p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-300">{t('home_account_label')}</p><h3 className="mt-3 text-2xl font-black text-white">{t('home_account_title')}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{t('home_account_description')}</p><span className="mt-5 block text-sm font-bold text-fuchsia-300 group-hover:text-white">{t('home_open_account')} →</span></Link></div></section>
    </div>
  );
};

export default Home;
