import { Schema, model } from 'mongoose';
const ExternalCasinoWagerSchema = new Schema({
  wagerId: { type: String, required: true, unique: true, immutable: true }, userId: { type: Schema.Types.ObjectId, required: true, immutable: true }, provider: { type: String, required: true, immutable: true }, providerWagerId: { type: String, sparse: true, unique: true }, providerSessionId: { type: String, required: true, immutable: true }, gameId: { type: String, required: true, immutable: true }, stakeMinor: { type: Schema.Types.Decimal128, required: true, immutable: true }, payoutMinor: Schema.Types.Decimal128, outcome: String,
  status: { type: String, enum: ['FUNDS_RESERVED', 'ACCEPTED', 'SETTLED', 'REJECTED'], required: true, index: true }, payloadHash: { type: String, required: true, immutable: true }, acceptedAt: Date, settledAt: Date
}, { timestamps: true });
export const ExternalCasinoWager = model('ExternalCasinoWager', ExternalCasinoWagerSchema);
