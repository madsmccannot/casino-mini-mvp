import { Schema, model } from 'mongoose';
const ExternalCasinoGameSchema = new Schema({
  gameId: { type: String, required: true, unique: true, immutable: true }, provider: { type: String, required: true, immutable: true }, providerGameId: { type: String, required: true, immutable: true },
  name: { type: String, required: true }, studio: { type: String, required: true }, kind: { type: String, enum: ['SLOT', 'LIVE_CASINO'], required: true }, category: { type: String, required: true }, thumbnailUrl: String,
  demoAvailable: { type: Boolean, required: true }, status: { type: String, enum: ['ACTIVE', 'SUSPENDED'], required: true }, sourceHash: { type: String, required: true }, lastSyncedAt: { type: Date, required: true }
}, { timestamps: true });
export const ExternalCasinoGame = model('ExternalCasinoGame', ExternalCasinoGameSchema);
