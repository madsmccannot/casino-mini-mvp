import { Schema, model } from 'mongoose';

const ExposureSchema = new Schema({
  betId: { type: String, required: true, unique: true, immutable: true },
  provider: { type: String, required: true, immutable: true },
  game: { type: String, required: true, immutable: true },
  currency: { type: String, required: true, immutable: true },
  stakeMinor: { type: Schema.Types.Decimal128, required: true, immutable: true },
  maxPayoutMinor: { type: Schema.Types.Decimal128, required: true, immutable: true },
  payoutMinor: { type: Schema.Types.Decimal128 },
  providerReservationId: { type: String, required: true, immutable: true },
  providerSettlementId: { type: String },
  resultHash: { type: String },
  expiresAt: { type: Date, required: true, index: true },
  status: {
    type: String,
    enum: ['RESERVED', 'SETTLEMENT_PENDING', 'SETTLED', 'RELEASED', 'MANUAL_REVIEW'],
    required: true,
    index: true
  }
}, { timestamps: true, versionKey: 'version' });

ExposureSchema.index({ provider: 1, status: 1, game: 1 });

export const Exposure = model('Exposure', ExposureSchema);
