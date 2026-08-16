import { GameControls, getActionBtnStyle } from '../ui/GameControls';

export const CrashUI = ({ balance, amount, setAmount, autoCashout, setAutoCashout, round, busy, placed, autoBet, setAutoBet, onBet, onCashout }: any) => (
  <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_360px] gap-8">
    <div className="rounded-3xl bg-[#100d20] border border-purple-500/30 min-h-[420px] flex flex-col items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 to-pink-700/10" />
      <span className="z-10 uppercase text-xs tracking-[0.3em] text-gray-500">{round?.status || 'CONNECTING'}</span>
      <strong className={`z-10 mt-3 text-8xl font-black ${round?.status === 'CRASHED' ? 'text-red-500' : 'text-fuchsia-300'}`}>{Number(round?.multiplier || 1).toFixed(2)}×</strong>
      <span className="z-10 mt-5 text-gray-400 font-mono">Round {round?.roundId?.slice(0, 8) || '--------'}</span>
    </div>
    <GameControls balance={balance} betAmount={amount} setBetAmount={setAmount} color="pink" isUsdMode={false} setIsUsdMode={() => undefined}
      actionButton={placed && round?.status === 'RUNNING'
        ? <button disabled={busy || Number(round.multiplier) >= autoCashout} onClick={onCashout} className={getActionBtnStyle('yellow', busy)}>CASH OUT {Number(round.multiplier).toFixed(2)}×</button>
        : <button disabled={busy || placed || round?.status !== 'BETTING'} onClick={onBet} className={getActionBtnStyle('pink', busy || placed || round?.status !== 'BETTING')}>{placed ? 'BET PLACED' : 'BET NEXT ROUND'}</button>}>
      <label className="text-xs text-gray-400 font-bold uppercase">Auto cashout</label>
      <input className="mt-2 w-full rounded-xl bg-[#0f212e] p-4 text-xl text-white" type="number" min="1.01" max="1000" step="0.01" value={autoCashout} onChange={e => setAutoCashout(Number(e.target.value))} />
      <label className="mt-4 flex items-center gap-3 text-sm text-gray-300"><input type="checkbox" checked={autoBet} onChange={e => setAutoBet(e.target.checked)} /> Auto-bet each new round</label>
    </GameControls>
  </div>
);
