import { Types } from 'mongoose';
import { appendAuditEvent } from '../../observability/auditLog';
import { sportsbookRouter } from '../SportsbookRouter';
import { validateNormalizedEvents } from '../markets/marketNormalizer';
import { Competition } from '../models/Competition';
import { SportsEvent } from '../models/SportsEvent';
import { SportsMarket } from '../models/SportsMarket';
import { SportsProviderState } from '../models/SportsProviderState';
import { createHash } from 'node:crypto';

const decimal = (value: bigint) => Types.Decimal128.fromString(value.toString());
const stable = (value: any): any => typeof value === 'bigint' ? value.toString() : value instanceof Date ? value.toISOString() : Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.keys(value).sort().reduce((out, key) => ({ ...out, [key]: stable(value[key]) }), {}) : value;
const sourceHash = (value: unknown) => createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');

export const ingestSportsFeed = async () => {
  const provider = sportsbookRouter.selected();
  const health = await provider.getHealth();
  if (health.state !== 'HEALTHY') throw new Error(`Sports provider is ${health.state.toLowerCase()}`);
  try {
    const events = validateNormalizedEvents(provider.name, await provider.fetchEvents());
    let marketsUpdated = 0;
    for (const event of events) {
      await Competition.updateOne({ competitionId: event.competitionId }, { $setOnInsert: {
        competitionId: event.competitionId, provider: provider.name, providerCompetitionId: event.competitionId, sport: event.sport,
        name: `${event.sport.replaceAll('_', ' ')} sandbox competition`, status: 'ACTIVE'
      } }, { upsert: true });
      const eventHash = sourceHash({ ...event, markets: undefined });
      const storedEvent = await SportsEvent.findOne({ eventId: event.eventId });
      if (storedEvent && storedEvent.version === event.version && storedEvent.sourceHash !== eventHash) throw new Error(`Provider mutated event ${event.eventId} without incrementing version`);
      if (!storedEvent) await SportsEvent.create({ provider: provider.name, providerEventId: event.providerEventId, competitionId: event.competitionId, sport: event.sport, name: event.name, home: event.home, away: event.away, startsAt: event.startsAt, status: event.status, version: event.version, sourceHash: eventHash, providerUpdatedAt: event.updatedAt, lastIngestedAt: new Date(), eventId: event.eventId });
      else if (storedEvent.version < event.version) await SportsEvent.updateOne({ _id: storedEvent._id, version: { $lt: event.version } }, { $set: { name: event.name, home: event.home, away: event.away, startsAt: event.startsAt, status: event.status, version: event.version, sourceHash: eventHash, providerUpdatedAt: event.updatedAt, lastIngestedAt: new Date() } });
      for (const market of event.markets) {
        const marketHash = sourceHash(market);
        const stored = await SportsMarket.findOne({ marketId: market.marketId });
        if (stored && stored.version === market.version && stored.sourceHash !== marketHash) throw new Error(`Provider mutated market ${market.marketId} without incrementing version`);
        const values = { provider: provider.name, providerMarketId: market.providerMarketId, eventId: market.eventId, type: market.type, name: market.name, line: market.line, isLive: market.isLive, status: market.status, providerStatus: market.status, version: market.version, sourceHash: marketHash, providerUpdatedAt: market.updatedAt, lastIngestedAt: new Date(), selections: market.selections.map(selection => ({ ...selection, oddsMillionths: decimal(selection.oddsMillionths), originalOddsMillionths: selection.originalOddsMillionths ? decimal(selection.originalOddsMillionths) : undefined })) };
        if (!stored) { await SportsMarket.create({ marketId: market.marketId, ...values }); marketsUpdated++; }
        else if (stored.version < market.version) { const result = await SportsMarket.updateOne({ _id: stored._id, version: { $lt: market.version } }, { $set: values }); marketsUpdated += result.modifiedCount; }
      }
    }
    await SportsProviderState.updateOne({ provider: provider.name }, { $set: { state: 'HEALTHY', lastSuccessAt: new Date(), consecutiveFailures: 0, eventsIngested: events.length }, $unset: { lastError: 1 } }, { upsert: true });
    return { provider: provider.name, events: events.length, marketsUpdated };
  } catch (error: any) {
    await SportsProviderState.updateOne({ provider: provider.name }, { $set: { state: 'DEGRADED', lastFailureAt: new Date(), lastError: error.message.slice(0, 500) }, $inc: { consecutiveFailures: 1 } }, { upsert: true });
    await appendAuditEvent({ eventId: crypto.randomUUID(), actorWallet: 'system', action: 'SPORTS_FEED_INGEST_FAILED', targetType: 'sports_provider', targetId: provider.name, correlationId: crypto.randomUUID(), outcome: 'FAILED', metadata: { error: error.message.slice(0, 500) } });
    throw error;
  }
};

export const markStaleMarkets = async (now = new Date()) => {
  const liveCutoff = new Date(now.getTime() - 10_000);
  const prematchCutoff = new Date(now.getTime() - 120_000);
  const live = await SportsMarket.updateMany({ isLive: true, providerStatus: 'ACTIVE', providerUpdatedAt: { $lt: liveCutoff }, status: 'ACTIVE' }, { $set: { status: 'STALE' } });
  const prematch = await SportsMarket.updateMany({ isLive: false, providerStatus: 'ACTIVE', providerUpdatedAt: { $lt: prematchCutoff }, status: 'ACTIVE' }, { $set: { status: 'STALE' } });
  return live.modifiedCount + prematch.modifiedCount;
};
