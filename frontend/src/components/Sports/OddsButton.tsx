import { useBetSlipStore } from '../../state/betSlipStore';
export const OddsButton = ({ event, market, selection }: any) => {
  const { legs, add, remove } = useBetSlipStore(); const selected = legs.some(leg => leg.selectionId === selection.selectionId);
  const disabled = market.status !== 'ACTIVE' || selection.status !== 'ACTIVE';
  return <button disabled={disabled} onClick={() => selected ? remove(selection.selectionId) : add({ selectionId: selection.selectionId, selectionName: selection.name, eventId: event.eventId, eventName: event.name, marketId: market.marketId, marketName: market.name, displayedMarketVersion: market.version, displayedOddsMillionths: selection.oddsMillionths })} className={`rounded-lg p-3 text-left border ${selected ? 'bg-blue-600 border-blue-400' : 'bg-[#172533] border-white/5 hover:border-blue-500/50'} disabled:opacity-40`}><span className="block text-xs text-gray-300">{selection.name}</span><strong>{(Number(selection.oddsMillionths) / 1e6).toFixed(2)}</strong></button>;
};
