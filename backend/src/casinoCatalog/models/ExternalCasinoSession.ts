import { Schema, model } from 'mongoose';
const ExternalCasinoSessionSchema = new Schema({
  sessionId: { type: String, required: true, unique: true, immutable: true }, provider: { type: String, required: true, immutable: true }, providerSessionId: { type: String, required: true, immutable: true }, gameId: { type: String, required: true, immutable: true }, userId: { type: Schema.Types.ObjectId, required: true, immutable: true }, expiresAt: { type: Date, required: true }, status: { type: String, enum: ['ACTIVE', 'EXPIRED'], required: true, default: 'ACTIVE' }
}, { timestamps: true });
ExternalCasinoSessionSchema.index({ userId: 1, gameId: 1, status: 1 });
export const ExternalCasinoSession = model('ExternalCasinoSession', ExternalCasinoSessionSchema);
