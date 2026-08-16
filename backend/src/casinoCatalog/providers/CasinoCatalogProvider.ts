export type CasinoCatalogProviderName = 'sandbox' | 'aggregator';
export type CasinoGameKind = 'SLOT' | 'LIVE_CASINO';

export interface CatalogGame {
  gameId: string; providerGameId: string; name: string; studio: string; kind: CasinoGameKind;
  category: string; thumbnailUrl?: string; demoAvailable: boolean; status: 'ACTIVE' | 'SUSPENDED';
}
export interface LaunchSession { sessionId: string; providerSessionId: string; gameId: string; expiresAt: Date; launchUrl: string; }
export interface CatalogWagerAcceptance { providerWagerId: string; status: 'ACCEPTED' | 'REJECTED'; payoutMinor: bigint; providerOutcome?: string; }

export interface CasinoCatalogProvider {
  readonly name: CasinoCatalogProviderName;
  getHealth(): Promise<{ provider: CasinoCatalogProviderName; state: 'HEALTHY' | 'DISABLED'; checkedAt: Date; reason?: string }>;
  listGames(): Promise<CatalogGame[]>;
  launchGame(input: { gameId: string; userId: string; sessionId: string }): Promise<LaunchSession>;
  acceptWager(input: { wagerId: string; providerSessionId: string; gameId: string; stakeMinor: bigint; idempotencyKey: string }): Promise<CatalogWagerAcceptance>;
}

export class CatalogProviderUnavailableError extends Error {}
export class CatalogWagerRejectedError extends Error {}
