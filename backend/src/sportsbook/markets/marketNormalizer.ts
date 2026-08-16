import { createHash } from 'node:crypto';
import { NormalizedEvent, SportsProviderName } from '../providers/SportsbookProvider';

const ID = /^[A-Za-z0-9:_.-]{1,128}$/;
export const sportsId = (type: string, provider: SportsProviderName, providerId: string) =>
  `${type}:${provider}:${createHash('sha256').update(providerId).digest('hex').slice(0, 24)}`;

export const validateNormalizedEvents = (provider: SportsProviderName, events: NormalizedEvent[]) => {
  const eventIds = new Set<string>();
  for (const event of events) {
    if (!ID.test(event.providerEventId) || eventIds.has(event.eventId) || event.eventId !== sportsId('event', provider, event.providerEventId)) throw new Error('Invalid or duplicate normalized event ID');
    eventIds.add(event.eventId);
    if (!Number.isSafeInteger(event.version) || event.version < 1 || !Number.isFinite(event.startsAt.getTime())) throw new Error('Invalid event version or start time');
    const marketIds = new Set<string>();
    for (const market of event.markets) {
      if (market.eventId !== event.eventId || market.marketId !== sportsId('market', provider, market.providerMarketId) || marketIds.has(market.marketId)) throw new Error('Invalid or duplicate normalized market');
      marketIds.add(market.marketId);
      if (!Number.isSafeInteger(market.version) || market.version < 1) throw new Error('Invalid market version');
      const selections = new Set<string>();
      for (const selection of market.selections) {
        if (selection.selectionId !== sportsId('selection', provider, selection.providerSelectionId) || selections.has(selection.selectionId)) throw new Error('Invalid or duplicate normalized selection');
        if (selection.oddsMillionths < 1_010_000n || selection.oddsMillionths > 1_000_000_000n) throw new Error('Odds outside supported range');
        selections.add(selection.selectionId);
      }
      if (selections.size < 2) throw new Error('Market requires at least two selections');
    }
  }
  return events;
};
