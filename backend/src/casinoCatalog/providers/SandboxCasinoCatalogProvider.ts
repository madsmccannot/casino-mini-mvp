import { createHash, randomUUID } from 'node:crypto';
import { CatalogGame, CasinoCatalogProvider, CatalogWagerAcceptance, LaunchSession, CatalogWagerRejectedError } from './CasinoCatalogProvider';

export class SandboxCasinoCatalogProvider implements CasinoCatalogProvider {
  readonly name = 'sandbox' as const;
  private assertEnabled() { if (process.env.CASINO_CATALOG_SANDBOX_MODE !== 'enabled' || process.env.NODE_ENV === 'production') throw new CatalogWagerRejectedError('Casino catalog sandbox is restricted to explicit non-production mode'); }
  async getHealth() { const enabled = process.env.CASINO_CATALOG_SANDBOX_MODE === 'enabled' && process.env.NODE_ENV !== 'production'; return { provider: this.name, state: enabled ? 'HEALTHY' as const : 'DISABLED' as const, checkedAt: new Date(), reason: enabled ? undefined : 'sandbox disabled' }; }
  async listGames(): Promise<CatalogGame[]> { this.assertEnabled(); return [
    { gameId: 'catalog:sandbox:neon-reels', providerGameId: 'neon-reels', name: 'Neon Reels', studio: 'Sandbox Studio', kind: 'SLOT', category: 'Slots', demoAvailable: true, status: 'ACTIVE' },
    { gameId: 'catalog:sandbox:royal-fruits', providerGameId: 'royal-fruits', name: 'Royal Fruits', studio: 'Sandbox Studio', kind: 'SLOT', category: 'Slots', demoAvailable: true, status: 'ACTIVE' },
    { gameId: 'catalog:sandbox:live-roulette', providerGameId: 'live-roulette', name: 'Live Roulette', studio: 'Sandbox Live', kind: 'LIVE_CASINO', category: 'Live Casino', demoAvailable: false, status: 'ACTIVE' },
    { gameId: 'catalog:sandbox:live-blackjack', providerGameId: 'live-blackjack', name: 'Live Blackjack', studio: 'Sandbox Live', kind: 'LIVE_CASINO', category: 'Live Casino', demoAvailable: false, status: 'ACTIVE' }
  ]; }
  async launchGame(input: { gameId: string; userId: string; sessionId: string }): Promise<LaunchSession> { this.assertEnabled(); const games = await this.listGames(); if (!games.some(game => game.gameId === input.gameId)) throw new CatalogWagerRejectedError('Catalog game is unavailable'); const providerSessionId = `sandbox-session:${randomUUID()}`; return { sessionId: input.sessionId, providerSessionId, gameId: input.gameId, expiresAt: new Date(Date.now() + 30 * 60_000), launchUrl: `/casino/catalog/${encodeURIComponent(input.gameId)}?session=${encodeURIComponent(input.sessionId)}` }; }
  async acceptWager(input: { wagerId: string; providerSessionId: string; gameId: string; stakeMinor: bigint; idempotencyKey: string }): Promise<CatalogWagerAcceptance> { this.assertEnabled(); if (input.stakeMinor <= 0n) throw new CatalogWagerRejectedError('Stake must be positive'); const digest = createHash('sha256').update(input.wagerId).digest(); const win = digest[0] % 5 === 0; const payoutMinor = win ? input.stakeMinor * 2n : 0n; return { providerWagerId: `sandbox-wager:${input.wagerId}`, status: 'ACCEPTED', payoutMinor, providerOutcome: win ? 'WIN' : 'LOSS' }; }
}
