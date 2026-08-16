import { randomUUID } from 'node:crypto';
import {
  BankrollProvider, ExposureRequest, ExposureReservation, ProviderHealth,
  ProviderLimitError, ProviderLimits, ProviderSettlement, SettlementRequest
} from '../BankrollProvider';

const positiveBigInt = (name: string, fallback: bigint): bigint => {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = BigInt(raw);
  if (value <= 0n) throw new Error(`${name} must be a positive integer in minor units`);
  return value;
};

export class InternalProvider implements BankrollProvider {
  readonly name = 'internal' as const;
  private readonly reservations = new Map<string, ExposureRequest>();
  private readonly settlements = new Map<string, ProviderSettlement>();

  private assertEnabled(): void {
    if (process.env.BANKROLL_INTERNAL_TEST_MODE !== 'enabled' || process.env.NODE_ENV === 'production') {
      throw new ProviderLimitError('Internal bankroll is restricted to explicit non-production test mode');
    }
  }

  async getHealth(): Promise<ProviderHealth> {
    const enabled = process.env.BANKROLL_INTERNAL_TEST_MODE === 'enabled' && process.env.NODE_ENV !== 'production';
    return { provider: this.name, state: enabled ? 'HEALTHY' : 'DISABLED', checkedAt: new Date(), reason: enabled ? undefined : 'test mode disabled' };
  }

  async getLimits(_game: string, currency: string): Promise<ProviderLimits> {
    this.assertEnabled();
    if (currency !== 'SOL' && currency !== 'USDC') throw new ProviderLimitError('Internal test provider only supports SOL or USDC');
    const liquidity = positiveBigInt('BANKROLL_INTERNAL_LIQUIDITY_MINOR', 100_000_000_000n);
    const reserved = [...this.reservations.values()].reduce((sum, value) => sum + value.maxPayoutMinor, 0n);
    const available = liquidity > reserved ? liquidity - reserved : 0n;
    return {
      currency, availableLiquidityMinor: available,
      maxBetMinor: positiveBigInt('BANKROLL_INTERNAL_MAX_BET_MINOR', 1_000_000_000n),
      maxPayoutMinor: available / 100n,
      maxMultiplierBps: 10_000_000n,
      validUntil: new Date(Date.now() + 5_000), sourceVersion: 'internal-test-v1'
    };
  }

  async reserveExposure(request: ExposureRequest): Promise<ExposureReservation> {
    const limits = await this.getLimits(request.game, request.currency);
    if (request.stakeMinor > limits.maxBetMinor || request.maxPayoutMinor > limits.maxPayoutMinor) {
      throw new ProviderLimitError('Bet exceeds internal provider limits');
    }
    const id = `internal:${request.betId}`;
    const existing = this.reservations.get(id);
    if (existing && JSON.stringify(existing, (_, v) => typeof v === 'bigint' ? v.toString() : v) !== JSON.stringify(request, (_, v) => typeof v === 'bigint' ? v.toString() : v)) {
      throw new ProviderLimitError('Exposure idempotency payload mismatch');
    }
    this.reservations.set(id, request);
    return { providerReservationId: id, expiresAt: new Date(Date.now() + 5 * 60_000) };
  }

  async releaseExposure(providerReservationId: string): Promise<void> { this.reservations.delete(providerReservationId); }

  async submitSettlement(request: SettlementRequest): Promise<ProviderSettlement> {
    this.assertEnabled();
    const id = `internal:${request.betId}`;
    const existing = this.settlements.get(request.betId);
    if (existing) return existing;
    if (!this.reservations.has(id)) throw new ProviderLimitError('Exposure reservation not found');
    this.reservations.delete(id);
    const settlement = { providerSettlementId: `internal-settlement:${request.betId}`, status: 'CONFIRMED' as const };
    this.settlements.set(request.betId, settlement);
    return settlement;
  }

  async getSettlementStatus(providerSettlementId: string): Promise<ProviderSettlement> {
    return { providerSettlementId, status: 'CONFIRMED' };
  }
}
