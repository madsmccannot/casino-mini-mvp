export type SportsProviderName = 'sandbox' | 'sportradar';
export type SportsProviderState = 'HEALTHY' | 'DEGRADED' | 'DISABLED' | 'HALTED';
export type SportCode = 'football' | 'basketball' | 'tennis' | 'ice_hockey' | 'baseball' | 'american_football' | 'mma' | 'boxing' | 'motorsport' | 'cricket' | 'esports';

export interface NormalizedSelection {
  selectionId: string; providerSelectionId: string; name: string;
  oddsMillionths: bigint; status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  participant?: string; boostId?: string; boostLabel?: string; originalOddsMillionths?: bigint;
}
export interface NormalizedMarket {
  marketId: string; providerMarketId: string; eventId: string; type: string; name: string;
  line?: string; status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED'; version: number; isLive: boolean;
  updatedAt: Date; selections: NormalizedSelection[];
}
export interface NormalizedEvent {
  eventId: string; providerEventId: string; competitionId: string; sport: SportCode;
  name: string; home?: string; away?: string; startsAt: Date;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED'; version: number; updatedAt: Date;
  markets: NormalizedMarket[];
}
export interface TicketQuoteLeg {
  selectionId: string; displayedMarketVersion: number; displayedOddsMillionths: bigint;
}
export interface AcceptedLeg extends TicketQuoteLeg {
  eventId: string; marketId: string; marketType: string; selectionName: string;
  acceptedMarketVersion: number; acceptedOddsMillionths: bigint;
}
export interface TicketAcceptance {
  providerTicketId: string; status: 'ACCEPTED' | 'REJECTED'; reason?: string;
  legs: AcceptedLeg[]; combinedOddsMillionths: bigint; maxPayoutMinor: bigint;
}
export interface CashoutQuote {
  quoteId: string; providerTicketId: string; amountMinor: bigint; expiresAt: Date;
}
export interface CashoutAcceptance {
  acceptanceId: string; quoteId: string; providerTicketId: string; amountMinor: bigint;
}
export interface SportsSettlementUpdate {
  providerSettlementId: string; providerTicketId: string;
  legs: Array<{ selectionId: string; result: 'WIN' | 'LOSS' | 'VOID' }>;
  payoutMinor?: bigint;
}
export interface SportsbookProvider {
  readonly name: SportsProviderName;
  getHealth(): Promise<{ provider: SportsProviderName; state: SportsProviderState; checkedAt: Date; reason?: string }>;
  fetchEvents(): Promise<NormalizedEvent[]>;
  acceptTicket(input: { ticketId: string; stakeMinor: bigint; legs: TicketQuoteLeg[]; acceptOddsChange: boolean; product: 'STANDARD' | 'BET_BUILDER' }): Promise<TicketAcceptance>;
  cancelTicket(providerTicketId: string): Promise<void>;
  quoteCashout(input: { providerTicketId: string; ticketId: string }): Promise<CashoutQuote>;
  acceptCashout(input: { providerTicketId: string; quoteId: string }): Promise<CashoutAcceptance>;
  getSettlementUpdates(cursor?: string): Promise<{ updates: SportsSettlementUpdate[]; cursor?: string }>;
}

export class SportsProviderUnavailableError extends Error {}
export class SportsTicketRejectedError extends Error {}
export class SportsCashoutRejectedError extends Error {}
