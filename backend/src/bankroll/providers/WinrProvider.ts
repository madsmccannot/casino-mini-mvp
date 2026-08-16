import {
  BankrollProvider, ExposureRequest, ExposureReservation, ProviderHealth,
  ProviderLimits, ProviderSettlement, ProviderUnavailableError, SettlementRequest
} from '../BankrollProvider';

export interface WinrTransport {
  getHealth(): Promise<ProviderHealth>;
  getLimits(game: string, currency: string): Promise<ProviderLimits>;
  reserveExposure(request: ExposureRequest): Promise<ExposureReservation>;
  releaseExposure(providerReservationId: string): Promise<void>;
  submitSettlement(request: SettlementRequest): Promise<ProviderSettlement>;
  getSettlementStatus(providerSettlementId: string): Promise<ProviderSettlement>;
}

class UnconfiguredWinrTransport implements WinrTransport {
  private unavailable(): never {
    throw new ProviderUnavailableError('WINR operator transport is not configured with a verified API/contract interface');
  }
  getHealth(): Promise<ProviderHealth> { return Promise.resolve({ provider: 'winr', state: 'DISABLED', checkedAt: new Date(), reason: 'verified transport not configured' }); }
  async getLimits(): Promise<ProviderLimits> { return this.unavailable(); }
  async reserveExposure(): Promise<ExposureReservation> { return this.unavailable(); }
  async releaseExposure(): Promise<void> { return this.unavailable(); }
  async submitSettlement(): Promise<ProviderSettlement> { return this.unavailable(); }
  async getSettlementStatus(): Promise<ProviderSettlement> { return this.unavailable(); }
}

export class WinrProvider implements BankrollProvider {
  readonly name = 'winr' as const;
  constructor(private readonly transport: WinrTransport = new UnconfiguredWinrTransport()) {}
  getHealth() { return this.transport.getHealth(); }
  getLimits(game: string, currency: string) { return this.transport.getLimits(game, currency); }
  reserveExposure(request: ExposureRequest) { return this.transport.reserveExposure(request); }
  releaseExposure(id: string) { return this.transport.releaseExposure(id); }
  submitSettlement(request: SettlementRequest) { return this.transport.submitSettlement(request); }
  getSettlementStatus(id: string) { return this.transport.getSettlementStatus(id); }
}
