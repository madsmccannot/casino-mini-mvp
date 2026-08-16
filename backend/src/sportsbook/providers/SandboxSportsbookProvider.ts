import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { SportsMarket } from '../models/SportsMarket';
import { SandboxSettlement } from '../models/SandboxSettlement';
import { SportsCashoutQuote } from '../models/SportsCashoutQuote';
import { SportsTicket } from '../models/SportsTicket';
import { CashoutAcceptance, CashoutQuote, NormalizedEvent, SportsbookProvider, SportsCashoutRejectedError, SportsTicketRejectedError, TicketAcceptance, TicketQuoteLeg } from './SportsbookProvider';

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
  async acceptTicket(input: { ticketId: string; stakeMinor: bigint; legs: TicketQuoteLeg[]; acceptOddsChange: boolean; product: 'STANDARD' | 'BET_BUILDER' }): Promise<TicketAcceptance> {
    this.assertEnabled();
    const accepted: any[] = [];
    const eventIds = new Set<string>();
    let combined = 1_000_000n;
    for (const quote of input.legs) {
      const market = await SportsMarket.findOne({ 'selections.selectionId': quote.selectionId });
      const selection: any = market?.selections.find((value: any) => value.selectionId === quote.selectionId);
      if (!market || !selection || market.status !== 'ACTIVE' || market.providerStatus !== 'ACTIVE' || selection.status !== 'ACTIVE' || stale(market)) throw new SportsTicketRejectedError('Selection is unavailable, suspended, or stale');
      if (eventIds.has(market.eventId) && input.product !== 'BET_BUILDER') throw new SportsTicketRejectedError('Correlated selections require Bet Builder');
      eventIds.add(market.eventId);
      const currentOdds = BigInt(selection.oddsMillionths.toString());
      const changed = market.version !== quote.displayedMarketVersion || currentOdds !== quote.displayedOddsMillionths;
      if (changed && !input.acceptOddsChange) throw new SportsTicketRejectedError('Odds changed; explicit acceptance is required');
      combined = combined * currentOdds / 1_000_000n;
      accepted.push({ ...quote, eventId: market.eventId, marketId: market.marketId, marketType: market.type, selectionName: selection.name, acceptedMarketVersion: market.version, acceptedOddsMillionths: currentOdds });
    }
    if (input.product === 'BET_BUILDER' && (input.legs.length < 2 || eventIds.size !== 1)) throw new SportsTicketRejectedError('Bet Builder requires 2-20 selections from one event');
    if (input.product === 'BET_BUILDER') combined = combined * 900_000n / 1_000_000n;
    const maxPayoutMinor = input.stakeMinor * combined / 1_000_000n;
    const cap = BigInt(process.env.SPORTSBOOK_SANDBOX_MAX_PAYOUT_MINOR || '10000000000');
    if (maxPayoutMinor > cap) throw new SportsTicketRejectedError('Ticket exceeds sandbox payout limit');
    return { providerTicketId: `sandbox:${input.ticketId}`, status: 'ACCEPTED', legs: accepted, combinedOddsMillionths: combined, maxPayoutMinor };
  }
  async cancelTicket(_providerTicketId: string) { this.assertEnabled(); }
  async quoteCashout(input: { providerTicketId: string; ticketId: string }): Promise<CashoutQuote> {
    this.assertEnabled();
    const ticket = await SportsTicket.findOne({ ticketId: input.ticketId, providerTicketId: input.providerTicketId, status: 'ACCEPTED' });
    if (!ticket || ticket.legs.some((leg: any) => leg.result !== 'OPEN')) throw new SportsCashoutRejectedError('Ticket is not eligible for cashout');
    const existing: any = await SportsCashoutQuote.findOne({ providerTicketId: input.providerTicketId, status: 'OPEN', expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
    if (existing) return { quoteId: existing.quoteId, providerTicketId: existing.providerTicketId, amountMinor: BigInt(existing.amountMinor.toString()), expiresAt: existing.expiresAt };
    const amountMinor = BigInt(ticket.stakeMinor.toString()) * 850_000n / 1_000_000n;
    const quoteId = `sandbox-cashout-quote:${randomUUID()}`;
    const expiresAt = new Date(Date.now() + 15_000);
    await SportsCashoutQuote.create({ quoteId, providerTicketId: input.providerTicketId, amountMinor: decimal(amountMinor), expiresAt });
    return { quoteId, providerTicketId: input.providerTicketId, amountMinor, expiresAt };
  }
  async acceptCashout(input: { providerTicketId: string; quoteId: string }): Promise<CashoutAcceptance> {
    this.assertEnabled();
    const acceptanceId = `sandbox-cashout:${input.quoteId}`;
    let quote: any = await SportsCashoutQuote.findOne({ quoteId: input.quoteId, providerTicketId: input.providerTicketId });
    if (!quote || quote.expiresAt.getTime() <= Date.now()) throw new SportsCashoutRejectedError('Cashout quote expired or is invalid');
    if (quote.status === 'OPEN') quote = await SportsCashoutQuote.findOneAndUpdate({ _id: quote._id, status: 'OPEN' }, { $set: { status: 'ACCEPTED', acceptanceId } }, { returnDocument: 'after' }) || await SportsCashoutQuote.findById(quote._id);
    if (!quote || quote.status !== 'ACCEPTED' || quote.acceptanceId !== acceptanceId) throw new SportsCashoutRejectedError('Cashout quote is no longer available');
    return { acceptanceId, quoteId: quote.quoteId, providerTicketId: quote.providerTicketId, amountMinor: BigInt(quote.amountMinor.toString()) };
  }
  async getSettlementUpdates(cursor?: string) {
    this.assertEnabled();
    const after = Number(cursor || 0);
    const rows = await SandboxSettlement.find({ sequence: { $gt: after } }).sort({ sequence: 1 }).limit(500).lean();
    return { updates: rows.map(row => ({ providerSettlementId: row.providerSettlementId, providerTicketId: row.providerTicketId, legs: row.legs as any, payoutMinor: row.payoutMinor ? BigInt(row.payoutMinor.toString()) : undefined })), cursor: rows.length ? String(rows[rows.length - 1].sequence) : String(after) };
  }
  static async publishSettlement(providerTicketId: string, legs: Array<{ selectionId: string; result: 'WIN' | 'LOSS' | 'VOID' }>) {
    const latest = await SandboxSettlement.findOne().sort({ sequence: -1 }).select('sequence').lean();
    const ticket: any = await SportsTicket.findOne({ providerTicketId });
    let payoutMinor: bigint | undefined;
    if (ticket?.product === 'BET_BUILDER') {
      const merged = ticket.legs.map((leg: any) => legs.find(value => value.selectionId === leg.selectionId)?.result || leg.result);
      if (merged.every((result: string) => result !== 'OPEN')) {
        if (merged.includes('LOSS')) payoutMinor = 0n;
        else if (merged.every((result: string) => result === 'WIN')) payoutMinor = BigInt(ticket.stakeMinor.toString()) * BigInt(ticket.acceptedCombinedOddsMillionths.toString()) / 1_000_000n;
        else if (merged.every((result: string) => result === 'VOID')) payoutMinor = BigInt(ticket.stakeMinor.toString());
        else {
          let combined = 1_000_000n;
          ticket.legs.forEach((leg: any, index: number) => { if (merged[index] === 'WIN') combined = combined * BigInt(leg.acceptedOddsMillionths.toString()) / 1_000_000n; });
          payoutMinor = BigInt(ticket.stakeMinor.toString()) * combined * 900_000n / 1_000_000n / 1_000_000n;
        }
      }
    }
    return SandboxSettlement.create({ sequence: (latest?.sequence || 0) + 1, providerSettlementId: `sandbox-settlement:${randomUUID()}`, providerTicketId, legs, payoutMinor: payoutMinor === undefined ? undefined : decimal(payoutMinor) });
  }
}
