import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { SportsMarket } from '../models/SportsMarket';
import { SandboxSettlement } from '../models/SandboxSettlement';
import { NormalizedEvent, SportsbookProvider, SportsTicketRejectedError, TicketAcceptance, TicketQuoteLeg } from './SportsbookProvider';

const decimal = (value: bigint) => Types.Decimal128.fromString(value.toString());
const stale = (market: any) => Date.now() - market.providerUpdatedAt.getTime() > (market.isLive ? 10_000 : 120_000);

export class SandboxSportsbookProvider implements SportsbookProvider {
  readonly name = 'sandbox' as const;
  constructor(private readonly eventSource: () => Promise<NormalizedEvent[]>) {}
  private assertEnabled() {
    if (process.env.SPORTSBOOK_SANDBOX_MODE !== 'enabled' || process.env.NODE_ENV === 'production') throw new SportsTicketRejectedError('Sportsbook sandbox is restricted to explicit non-production mode');
  }
  async getHealth() {
    const enabled = process.env.SPORTSBOOK_SANDBOX_MODE === 'enabled' && process.env.NODE_ENV !== 'production';
    return { provider: this.name, state: enabled ? 'HEALTHY' as const : 'DISABLED' as const, checkedAt: new Date(), reason: enabled ? undefined : 'sandbox disabled' };
  }
  async fetchEvents() { this.assertEnabled(); return this.eventSource(); }
  async acceptTicket(input: { ticketId: string; stakeMinor: bigint; legs: TicketQuoteLeg[]; acceptOddsChange: boolean }): Promise<TicketAcceptance> {
    this.assertEnabled();
    const accepted: any[] = [];
    const eventIds = new Set<string>();
    let combined = 1_000_000n;
    for (const quote of input.legs) {
      const market = await SportsMarket.findOne({ 'selections.selectionId': quote.selectionId });
      const selection: any = market?.selections.find((value: any) => value.selectionId === quote.selectionId);
      if (!market || !selection || market.status !== 'ACTIVE' || market.providerStatus !== 'ACTIVE' || selection.status !== 'ACTIVE' || stale(market)) throw new SportsTicketRejectedError('Selection is unavailable, suspended, or stale');
      if (eventIds.has(market.eventId)) throw new SportsTicketRejectedError('Correlated same-event accumulators are not supported');
      eventIds.add(market.eventId);
      const currentOdds = BigInt(selection.oddsMillionths.toString());
      const changed = market.version !== quote.displayedMarketVersion || currentOdds !== quote.displayedOddsMillionths;
      if (changed && !input.acceptOddsChange) throw new SportsTicketRejectedError('Odds changed; explicit acceptance is required');
      combined = combined * currentOdds / 1_000_000n;
      accepted.push({ ...quote, eventId: market.eventId, marketId: market.marketId, marketType: market.type, selectionName: selection.name, acceptedMarketVersion: market.version, acceptedOddsMillionths: currentOdds });
    }
    const maxPayoutMinor = input.stakeMinor * combined / 1_000_000n;
    const cap = BigInt(process.env.SPORTSBOOK_SANDBOX_MAX_PAYOUT_MINOR || '10000000000');
    if (maxPayoutMinor > cap) throw new SportsTicketRejectedError('Ticket exceeds sandbox payout limit');
    return { providerTicketId: `sandbox:${input.ticketId}`, status: 'ACCEPTED', legs: accepted, maxPayoutMinor };
  }
  async cancelTicket(_providerTicketId: string) { this.assertEnabled(); }
  async getSettlementUpdates(cursor?: string) {
    this.assertEnabled();
    const after = Number(cursor || 0);
    const rows = await SandboxSettlement.find({ sequence: { $gt: after } }).sort({ sequence: 1 }).limit(500).lean();
    return { updates: rows.map(row => ({ providerSettlementId: row.providerSettlementId, providerTicketId: row.providerTicketId, legs: row.legs as any })), cursor: rows.length ? String(rows[rows.length - 1].sequence) : String(after) };
  }
  static async publishSettlement(providerTicketId: string, legs: Array<{ selectionId: string; result: 'WIN' | 'LOSS' | 'VOID' }>) {
    const latest = await SandboxSettlement.findOne().sort({ sequence: -1 }).select('sequence').lean();
    return SandboxSettlement.create({ sequence: (latest?.sequence || 0) + 1, providerSettlementId: `sandbox-settlement:${randomUUID()}`, providerTicketId, legs });
  }
}
