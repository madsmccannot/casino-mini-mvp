import { GameControls, getActionBtnStyle } from '../ui/GameControls';

const Hand = ({ title, cards, value }: any) => <div><p className="text-xs uppercase tracking-widest text-gray-500 mb-3">{title} {value !== undefined ? `· ${value}` : ''}</p><div className="flex gap-2">{(cards || []).map((card: string, i: number) => <div key={`${card}-${i}`} className="w-16 h-24 bg-white text-slate-900 rounded-lg flex items-center justify-center font-black text-xl shadow-lg">{card === 'hidden' ? '?' : card}</div>)}</div></div>;

export const BlackjackUI = ({ balance, amount, setAmount, game, busy, onDeal, onHit, onStand }: any) => (
  <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_360px] gap-8">
    <div className="rounded-3xl bg-emerald-950/60 border border-emerald-500/20 p-8 min-h-[430px] flex flex-col justify-between">
      <Hand title="Dealer" cards={game?.dealerCards || []} value={game?.dealerValue} />
      <div className="text-center text-2xl font-black uppercase text-amber-300">{game?.status || 'Place your bet'}</div>
      <Hand title="Player" cards={game?.playerCards || []} value={game?.playerValue} />
    </div>
    <GameControls balance={balance} betAmount={amount} setBetAmount={setAmount} color="emerald" isUsdMode={false} setIsUsdMode={() => undefined}
      actionButton={game?.status === 'active' ? <div className="grid grid-cols-2 gap-3"><button disabled={busy} onClick={onHit} className={getActionBtnStyle('blue', busy)}>HIT</button><button disabled={busy} onClick={onStand} className={getActionBtnStyle('yellow', busy)}>STAND</button></div> : <button disabled={busy} onClick={onDeal} className={getActionBtnStyle('emerald', busy)}>DEAL</button>} />
  </div>
);
