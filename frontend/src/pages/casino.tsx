import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { casinoCatalogClient } from '../services/casinoCatalogClient';
import { useCasinoStore } from '../state/casinoStore';
import { useUIStore } from '../state/uiStore';

type CatalogGame = { gameId: string; name: string; studio: string; kind: 'SLOT' | 'LIVE_CASINO'; category: string };

export default function CasinoCatalogPage() {
  const { t } = useUIStore();
  const [games, setGames] = useState<CatalogGame[]>([]);
  const [category, setCategory] = useState<'ALL' | 'SLOT' | 'LIVE_CASINO'>('ALL');
  const [launch, setLaunch] = useState<any>(null);
  const [catalogDisabled, setCatalogDisabled] = useState(false);
  const [catalogError, setCatalogError] = useState(false);
  const [loading, setLoading] = useState(false);
  const setBalance = useCasinoStore(state => state.setBalance);

  useEffect(() => {
    casinoCatalogClient.games()
      .then(data => { setGames(data.games); setCatalogDisabled(false); setCatalogError(false); })
      .catch(error => {
        const disabled = error.response?.status === 503 || /disabled/i.test(error.response?.data?.error || '');
        setCatalogDisabled(disabled);
        setCatalogError(!disabled);
        toast.error(disabled ? t('catalog_disabled_title') : (error.response?.data?.error || t('catalog_unavailable')));
      });
  }, [t]);

  const visible = category === 'ALL' ? games : games.filter(game => game.kind === category);
  const originals = [
    { id: 'coinflip', name: t('game_coinflip'), desc: t('desc_coinflip'), icon: '🪙' },
    { id: 'dice', name: t('game_dice'), desc: t('desc_dice'), icon: '🎲' },
    { id: 'roulette', name: t('game_roulette'), desc: t('desc_roulette'), icon: '🎰' },
    { id: 'plinko', name: t('game_plinko'), desc: t('desc_plinko'), icon: '🎯' },
    { id: 'mines', name: t('game_mines'), desc: t('desc_mines'), icon: '💣' },
    { id: 'crash', name: t('game_crash'), desc: t('desc_crash'), icon: '🚀' },
    { id: 'limbo', name: t('game_limbo'), desc: t('desc_limbo'), icon: '♾️' },
    { id: 'blackjack', name: t('game_blackjack'), desc: t('desc_blackjack'), icon: '🂡' },
  ];

  const open = async (game: CatalogGame) => {
    setLoading(true);
    try {
      setLaunch((await casinoCatalogClient.launch(game.gameId)).launch);
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const wager = async () => {
    if (!launch) return;
    setLoading(true);
    try {
      const data = await casinoCatalogClient.wager({ wagerId: crypto.randomUUID(), sessionId: launch.sessionId, stakeSol: 0.001 });
      setBalance(data.newBalance);
      toast.success(`${t('catalog_result')}: ${data.wager.outcome}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterButton = (value: 'ALL' | 'SLOT' | 'LIVE_CASINO', label: string) => (
    <button
      type="button"
      onClick={() => setCategory(value)}
      aria-pressed={category === value}
      className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition ${category === value ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/40' : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <section className="mb-8 flex flex-col items-start gap-5 rounded-3xl border border-white/10 bg-gradient-to-br from-blue-950/60 via-slate-900/80 to-fuchsia-950/30 p-6 shadow-2xl shadow-blue-950/20 md:p-8">
        <div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">{t('catalog_title')}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{t('catalog_subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4" role="tablist" aria-label={t('catalog_title')}>
          {filterButton('ALL', t('catalog_all'))}
          {filterButton('SLOT', t('catalog_slots'))}
          {filterButton('LIVE_CASINO', t('catalog_live'))}
        </div>
      </section>

      {category === 'ALL' && (
        <section className="mb-8">
          <div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">{t('home_games_kicker')}</p><h2 className="mt-1 text-2xl font-black text-white">{t('home_games_title')}</h2></div></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {originals.map(game => <a key={game.id} href={`/${game.id}`} className="group rounded-2xl border border-white/10 bg-slate-900/75 p-5 transition hover:-translate-y-1 hover:border-blue-400/30 hover:bg-slate-800/90"><div className="text-4xl transition group-hover:scale-110">{game.icon}</div><h3 data-no-translate className="mt-5 font-black text-white">{game.name}</h3><p className="mt-1 text-xs text-slate-500">{game.desc}</p></a>)}
          </div>
        </section>
      )}

      {catalogDisabled && category === 'ALL' ? (
        <div className="mb-8 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-5 text-sm text-slate-400"><strong className="text-amber-200">{t('catalog_disabled_title')}</strong><span className="ml-2">{t('catalog_disabled_message')}</span></div>
      ) : catalogDisabled ? (
        <div className="rounded-3xl border border-amber-400/20 bg-amber-400/[0.06] p-10 text-center shadow-xl shadow-amber-950/10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-2xl">⏸</div>
          <h2 className="mt-5 text-2xl font-black text-white">{t('catalog_disabled_title')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">{t('catalog_disabled_message')}</p>
        </div>
      ) : catalogError ? (
        <div className="rounded-3xl border border-red-400/20 bg-red-400/[0.06] p-10 text-center">
          <h2 className="text-xl font-black text-white">{t('catalog_unavailable')}</h2>
          <p className="mt-2 text-sm text-slate-400">{t('catalog_disabled_message')}</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-12 text-center text-sm text-slate-500">{t('catalog_empty')}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map(game => (
            <article key={game.gameId} className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75 p-5 transition hover:-translate-y-1 hover:border-blue-400/30 hover:bg-slate-800/90 hover:shadow-xl hover:shadow-blue-950/20">
              <div className="mb-5 flex items-start justify-between">
                <span className="text-4xl transition group-hover:scale-110">{game.kind === 'SLOT' ? '🎰' : '🃏'}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{game.kind === 'SLOT' ? t('catalog_slots') : t('catalog_live')}</span>
              </div>
              <h2 data-no-translate className="font-black text-white">{game.name}</h2>
              <p data-no-translate className="mt-1 text-xs text-slate-500">{game.studio}</p>
              <button type="button" disabled={loading} onClick={() => open(game)} className="mt-6 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700">{t('catalog_open')}</button>
            </article>
          ))}
        </div>
      )}

      {launch && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="catalog-session-title">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#101b27] p-6 shadow-2xl shadow-black/50">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">{t('catalog_live')}</p>
            <h2 id="catalog-session-title" data-no-translate className="mt-2 text-xl font-black text-white">{launch.gameId}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">{t('catalog_session')} {t('catalog_test_wager')}</p>
            <button type="button" disabled={loading} onClick={wager} className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-700">{t('catalog_place')}</button>
            <button type="button" onClick={() => setLaunch(null)} className="mt-2 w-full rounded-xl bg-white/10 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/15 hover:text-white">{t('catalog_close')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
