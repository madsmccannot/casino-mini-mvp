import { NormalizedEvent, SportCode } from './SportsbookProvider';
import { sportsId } from '../markets/marketNormalizer';

const SPORTS: SportCode[] = ['football', 'basketball', 'tennis', 'ice_hockey', 'baseball', 'american_football', 'mma', 'boxing', 'motorsport', 'cricket', 'esports'];

export class SandboxFeed {
  private events = new Map<string, NormalizedEvent>();
  constructor(now = new Date()) {
    SPORTS.forEach((sport, index) => {
      const providerEventId = `${sport}-fixture-1`;
      const eventId = sportsId('event', 'sandbox', providerEventId);
      const providerMarketId = `${providerEventId}-moneyline`;
      const marketId = sportsId('market', 'sandbox', providerMarketId);
      const updatedAt = new Date(now);
      this.events.set(eventId, {
        eventId, providerEventId, competitionId: sportsId('competition', 'sandbox', `${sport}-league`), sport,
        name: `${sport.replaceAll('_', ' ')} sandbox fixture`, home: `Home ${index + 1}`, away: `Away ${index + 1}`,
        startsAt: new Date(now.getTime() + (index + 1) * 3_600_000), status: 'SCHEDULED', version: 1, updatedAt,
        markets: [{
          marketId, providerMarketId, eventId, type: 'MONEYLINE', name: 'Match winner', status: 'ACTIVE', version: 1, isLive: false, updatedAt,
          selections: [
            { selectionId: sportsId('selection', 'sandbox', `${providerMarketId}-home`), providerSelectionId: `${providerMarketId}-home`, name: `Home ${index + 1}`, oddsMillionths: 1_900_000n, status: 'ACTIVE' },
            { selectionId: sportsId('selection', 'sandbox', `${providerMarketId}-away`), providerSelectionId: `${providerMarketId}-away`, name: `Away ${index + 1}`, oddsMillionths: 2_000_000n, status: 'ACTIVE' }
          ]
        }]
      });
      const created = this.events.get(eventId)!;
      if (index === 0) {
        created.status = 'LIVE';
        created.startsAt = new Date(now.getTime() - 15 * 60_000);
        created.markets[0].isLive = true;
      }
      const totalsProviderId = `${providerEventId}-totals`;
      created.markets.push({
        marketId: sportsId('market', 'sandbox', totalsProviderId), providerMarketId: totalsProviderId, eventId,
        type: 'TOTALS', name: 'Total points', line: '2.5', status: 'ACTIVE', version: 1, isLive: index === 0, updatedAt,
        selections: [
          { selectionId: sportsId('selection', 'sandbox', `${totalsProviderId}-over`), providerSelectionId: `${totalsProviderId}-over`, name: 'Over 2.5', oddsMillionths: 1_850_000n, originalOddsMillionths: 1_750_000n, boostId: `boost-${sport}-over`, boostLabel: 'BOOST', status: 'ACTIVE' },
          { selectionId: sportsId('selection', 'sandbox', `${totalsProviderId}-under`), providerSelectionId: `${totalsProviderId}-under`, name: 'Under 2.5', oddsMillionths: 1_950_000n, status: 'ACTIVE' }
        ]
      });
      const propProviderId = `${providerEventId}-player-prop`;
      created.markets.push({
        marketId: sportsId('market', 'sandbox', propProviderId), providerMarketId: propProviderId, eventId,
        type: 'PLAYER_PROP', name: 'Player performance', line: '1.5', status: 'ACTIVE', version: 1, isLive: index === 0, updatedAt,
        selections: [
          { selectionId: sportsId('selection', 'sandbox', `${propProviderId}-over`), providerSelectionId: `${propProviderId}-over`, name: 'Over 1.5', participant: `Player ${index + 1}`, oddsMillionths: 2_100_000n, status: 'ACTIVE' },
          { selectionId: sportsId('selection', 'sandbox', `${propProviderId}-under`), providerSelectionId: `${propProviderId}-under`, name: 'Under 1.5', participant: `Player ${index + 1}`, oddsMillionths: 1_700_000n, status: 'ACTIVE' }
        ]
      });
    });
  }
  async snapshot() { return structuredClone([...this.events.values()]); }
  updateOdds(selectionId: string, oddsMillionths: bigint, now = new Date()) {
    if (oddsMillionths < 1_010_000n || oddsMillionths > 1_000_000_000n) throw new Error('Invalid sandbox odds');
    for (const event of this.events.values()) for (const market of event.markets) {
      const selection = market.selections.find(value => value.selectionId === selectionId);
      if (selection) { selection.oddsMillionths = oddsMillionths; market.version++; market.updatedAt = now; event.version++; event.updatedAt = now; return; }
    }
    throw new Error('Sandbox selection not found');
  }
  setMarketStatus(marketId: string, status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED', now = new Date()) {
    for (const event of this.events.values()) {
      const market = event.markets.find(value => value.marketId === marketId);
      if (market) { market.status = status; market.selections.forEach(selection => { selection.status = status === 'ACTIVE' ? 'ACTIVE' : status; }); market.version++; market.updatedAt = now; event.version++; event.updatedAt = now; return; }
    }
    throw new Error('Sandbox market not found');
  }
}

export const sandboxFeed = new SandboxFeed();
