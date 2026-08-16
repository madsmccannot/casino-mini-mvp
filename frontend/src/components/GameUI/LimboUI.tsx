import { GameControls, getActionBtnStyle } from '../ui/GameControls';

export const LimboUI = ({ balance, amount, setAmount, target, setTarget, playing, result, onPlay }: any) => (
  <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center">
    <div className="rounded-3xl bg-[#0f212e] border border-cyan-500/20 min-h-[320px] flex flex-col items-center justify-center">
      <span className="text-gray-500 uppercase tracking-[0.3em] text-xs">Result multiplier</span>
      <strong className={`text-7xl font-black mt-4 ${result !== null && result >= target ? 'text-emerald-400' : 'text-cyan-300'}`}>{result === null ? '—' : `${result.toFixed(2)}×`}</strong>
      <span className="mt-5 text-gray-400">Target: {target.toFixed(2)}× · Win chance: {(99 / target).toFixed(2)}%</span>
    </div>
    <GameControls balance={balance} betAmount={amount} setBetAmount={setAmount} color="blue" isUsdMode={false} setIsUsdMode={() => undefined}
      actionButton={<button disabled={playing} onClick={onPlay} className={getActionBtnStyle('blue', playing)}>{playing ? 'PLAYING…' : 'PLAY LIMBO'}</button>}>
      <label className="text-xs text-gray-400 font-bold uppercase">Target multiplier</label>
      <input className="mt-2 w-full rounded-xl bg-[#0f212e] p-4 text-xl text-white" type="number" min="1.01" max="1000" step="0.01" value={target} onChange={e => setTarget(Number(e.target.value))} />
    </GameControls>
  </div>
);
