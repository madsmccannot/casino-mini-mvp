import { create } from 'zustand';
export interface BetSlipLeg { selectionId: string; selectionName: string; eventId: string; eventName: string; marketId: string; marketName: string; displayedMarketVersion: number; displayedOddsMillionths: string }
interface BetSlipState { legs: BetSlipLeg[]; stake: number; acceptOddsChange: boolean; add: (leg: BetSlipLeg) => void; remove: (id: string) => void; clear: () => void; setStake: (value: number) => void; setAcceptOddsChange: (value: boolean) => void }
export const useBetSlipStore = create<BetSlipState>(set => ({
  legs: [], stake: 0.001, acceptOddsChange: false,
  add: leg => set(state => state.legs.some(value => value.selectionId === leg.selectionId) ? state : { legs: [...state.legs, leg] }),
  remove: id => set(state => ({ legs: state.legs.filter(value => value.selectionId !== id) })), clear: () => set({ legs: [] }),
  setStake: stake => set({ stake }), setAcceptOddsChange: acceptOddsChange => set({ acceptOddsChange })
}));
