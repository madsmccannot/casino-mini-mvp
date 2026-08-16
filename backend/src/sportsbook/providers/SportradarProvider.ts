import { SportsProviderUnavailableError, SportsbookProvider } from './SportsbookProvider';

export class SportradarProvider implements SportsbookProvider {
  readonly name = 'sportradar' as const;
  private unavailable(): never { throw new SportsProviderUnavailableError('Sportradar operator agreement, credentials, schemas, and sandbox are not configured'); }
  async getHealth() { return { provider: this.name, state: 'DISABLED' as const, checkedAt: new Date(), reason: 'verified integration not configured' }; }
  async fetchEvents(): Promise<any> { return this.unavailable(); }
  async acceptTicket(): Promise<any> { return this.unavailable(); }
  async cancelTicket(): Promise<void> { return this.unavailable(); }
  async getSettlementUpdates(): Promise<any> { return this.unavailable(); }
}
