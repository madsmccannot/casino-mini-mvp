import { create } from 'zustand';
export interface SportsSelection { selectionId: string; name: string; oddsMillionths: string; status: string }
export interface SportsMarket { marketId: string; eventId: string; type: string; name: string; isLive: boolean; status: string; version: number; updatedAt: string; selections: SportsSelection[] }
export interface SportsEvent { eventId: string; sport: string; name: string; home?: string; away?: string; startsAt: string; status: string; markets: SportsMarket[] }
interface SportsState { events: SportsEvent[]; connected: boolean; setEvents: (events: SportsEvent[]) => void; setConnected: (value: boolean) => void; updateMarkets: (markets: SportsMarket[]) => void }
export const useSportsStore = create<SportsState>(set => ({
  events: [], connected: false, setEvents: events => set({ events }), setConnected: connected => set({ connected }),
  updateMarkets: markets => set(state => ({ events: state.events.map(event => ({ ...event, markets: event.markets.map(current => markets.find(next => next.marketId === current.marketId && next.version >= current.version) || current) })) }))
}));
