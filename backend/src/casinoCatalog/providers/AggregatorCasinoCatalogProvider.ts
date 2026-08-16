import { CatalogProviderUnavailableError, CasinoCatalogProvider } from './CasinoCatalogProvider';
export class AggregatorCasinoCatalogProvider implements CasinoCatalogProvider {
  readonly name = 'aggregator' as const;
  private unavailable(): never { throw new CatalogProviderUnavailableError('External casino aggregator agreement, credentials and certified schema are not configured'); }
  async getHealth() { return { provider: this.name, state: 'DISABLED' as const, checkedAt: new Date(), reason: 'verified integration not configured' }; }
  async listGames(): Promise<never> { return this.unavailable(); }
  async launchGame(): Promise<never> { return this.unavailable(); }
  async acceptWager(): Promise<never> { return this.unavailable(); }
}
