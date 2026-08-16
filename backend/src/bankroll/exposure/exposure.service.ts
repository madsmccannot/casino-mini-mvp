import { createHash } from 'node:crypto';
import { Types } from 'mongoose';
import { bankrollRouter } from '../BankrollRouter';
import { ProviderLimitError, ProviderSettlementError } from '../BankrollProvider';
import { Exposure } from './exposure.model';

const decimal = (value: bigint) => Types.Decimal128.fromString(value.toString());
const bigint = (value: Types.Decimal128) => BigInt(value.toString());
const canonical = (value: any): any => {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => ({ ...result, [key]: canonical(value[key]) }), {});
  }
  return value;
};
const stableHash = (value: unknown) => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');

export interface AuthorizeExposureInput {
  betId: string;
  game: string;
  currency: string;
  stakeMinor: bigint;
  maxPayoutMinor: bigint;
}

export const authorizeExposure = async (input: AuthorizeExposureInput) => {
  const existing = await Exposure.findOne({ betId: input.betId });
  if (existing) {
    if (existing.game !== input.game || existing.currency !== input.currency || bigint(existing.stakeMinor) !== input.stakeMinor || bigint(existing.maxPayoutMinor) !== input.maxPayoutMinor) {
      throw new ProviderLimitError('Exposure idempotency payload mismatch');
    }
    if (existing.status === 'RELEASED' || existing.status === 'MANUAL_REVIEW') throw new ProviderLimitError(`Exposure is ${existing.status.toLowerCase()}`);
    return existing;
  }

  return bankrollRouter.execute(async provider => {
    const limits = await provider.getLimits(input.game, input.currency);
    if (limits.validUntil.getTime() <= Date.now()) throw new ProviderLimitError('Provider limits have expired');
    if (input.stakeMinor > limits.maxBetMinor) throw new ProviderLimitError('Bet exceeds provider maximum stake');
    if (input.maxPayoutMinor > limits.maxPayoutMinor) throw new ProviderLimitError('Maximum payout exceeds provider exposure limit');
    const reservation = await provider.reserveExposure(input);
    try {
      return await Exposure.create({
        ...input,
        provider: provider.name,
        stakeMinor: decimal(input.stakeMinor),
        maxPayoutMinor: decimal(input.maxPayoutMinor),
        providerReservationId: reservation.providerReservationId,
        expiresAt: reservation.expiresAt,
        status: 'RESERVED'
      });
    } catch (error: any) {
      if (error?.code === 11000) return Exposure.findOne({ betId: input.betId });
      await provider.releaseExposure(reservation.providerReservationId).catch(() => undefined);
      throw error;
    }
  });
};

export const releaseExposure = async (betId: string): Promise<void> => {
  const exposure = await Exposure.findOne({ betId });
  if (!exposure || exposure.status === 'RELEASED') return;
  if (exposure.status !== 'RESERVED') throw new ProviderSettlementError(`Cannot release exposure in ${exposure.status} state`);
  await bankrollRouter.execute(async provider => {
    if (provider.name !== exposure.provider) throw new ProviderSettlementError('Configured provider differs from reserved provider');
    await provider.releaseExposure(exposure.providerReservationId);
  });
  await Exposure.updateOne({ _id: exposure._id, status: 'RESERVED' }, { $set: { status: 'RELEASED' } });
};

export const settleExposure = async (betId: string, payoutMinor: bigint, result: unknown) => {
  const exposure = await Exposure.findOne({ betId });
  if (!exposure) throw new ProviderSettlementError('Exposure reservation not found');
  if (exposure.status === 'SETTLED') {
    if (bigint(exposure.payoutMinor!) !== payoutMinor) throw new ProviderSettlementError('Settlement idempotency payload mismatch');
    return exposure;
  }
  if (exposure.status !== 'RESERVED' && exposure.status !== 'SETTLEMENT_PENDING') {
    throw new ProviderSettlementError(`Cannot settle exposure in ${exposure.status} state`);
  }
  if (payoutMinor > bigint(exposure.maxPayoutMinor)) throw new ProviderSettlementError('Actual payout exceeds reserved maximum payout');
  const resultHash = stableHash(result);
  if (exposure.resultHash && exposure.resultHash !== resultHash) throw new ProviderSettlementError('Settlement result hash mismatch');

  const settlement = await bankrollRouter.execute(async provider => {
    if (provider.name !== exposure.provider) throw new ProviderSettlementError('Configured provider differs from reserved provider');
    if (exposure.status === 'SETTLEMENT_PENDING' && exposure.providerSettlementId) {
      return provider.getSettlementStatus(exposure.providerSettlementId);
    }
    return provider.submitSettlement({
      betId, game: exposure.game, currency: exposure.currency,
      stakeMinor: bigint(exposure.stakeMinor), maxPayoutMinor: bigint(exposure.maxPayoutMinor),
      payoutMinor, resultHash
    });
  });
  const status = settlement.status === 'CONFIRMED' ? 'SETTLED' : settlement.status === 'PENDING' ? 'SETTLEMENT_PENDING' : 'MANUAL_REVIEW';
  await Exposure.updateOne(
    { _id: exposure._id, status: { $in: ['RESERVED', 'SETTLEMENT_PENDING'] } },
    { $set: { payoutMinor: decimal(payoutMinor), resultHash, providerSettlementId: settlement.providerSettlementId, status } }
  );
  if (status !== 'SETTLED') throw new ProviderSettlementError(`Provider settlement is ${settlement.status.toLowerCase()}`);
  return Exposure.findById(exposure._id);
};

export const getAggregatedExposure = async () => Exposure.aggregate([
  { $match: { status: { $in: ['RESERVED', 'SETTLEMENT_PENDING'] } } },
  { $group: { _id: { provider: '$provider', game: '$game', currency: '$currency' }, reservedPayoutMinor: { $sum: '$maxPayoutMinor' }, count: { $sum: 1 } } }
]);
