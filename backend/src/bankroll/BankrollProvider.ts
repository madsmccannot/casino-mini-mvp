export type ProviderName = 'internal' | 'winr';
export type ProviderHealthState = 'HEALTHY' | 'DEGRADED' | 'HALTED' | 'DISABLED';

export interface ProviderHealth {
  provider: ProviderName;
  state: ProviderHealthState;
  checkedAt: Date;
  reason?: string;
}

export interface ProviderLimits {
  currency: string;
  availableLiquidityMinor: bigint;
  maxBetMinor: bigint;
  maxPayoutMinor: bigint;
  maxMultiplierBps: bigint;
  validUntil: Date;
  sourceVersion: string;
}

export interface ExposureRequest {
  betId: string;
  game: string;
  currency: string;
  stakeMinor: bigint;
  maxPayoutMinor: bigint;
}

export interface ExposureReservation {
  providerReservationId: string;
  expiresAt: Date;
}

export interface SettlementRequest extends ExposureRequest {
  payoutMinor: bigint;
  resultHash: string;
}

export interface ProviderSettlement {
  providerSettlementId: string;
  status: 'CONFIRMED' | 'PENDING' | 'REJECTED';
}

export interface BankrollProvider {
  readonly name: ProviderName;
  getHealth(): Promise<ProviderHealth>;
  getLimits(game: string, currency: string): Promise<ProviderLimits>;
  reserveExposure(request: ExposureRequest): Promise<ExposureReservation>;
  releaseExposure(providerReservationId: string): Promise<void>;
  submitSettlement(request: SettlementRequest): Promise<ProviderSettlement>;
  getSettlementStatus(providerSettlementId: string): Promise<ProviderSettlement>;
}

export class ProviderUnavailableError extends Error {}
export class ProviderLimitError extends Error {}
export class ProviderSettlementError extends Error {}
