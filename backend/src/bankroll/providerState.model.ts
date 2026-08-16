import { Schema, model } from 'mongoose';

const ProviderStateSchema = new Schema({
  provider: { type: String, required: true, unique: true, immutable: true },
  consecutiveFailures: { type: Number, required: true, default: 0, min: 0 },
  circuit: { type: String, enum: ['CLOSED', 'OPEN', 'HALF_OPEN'], required: true, default: 'CLOSED' },
  openUntil: { type: Date },
  lastFailure: { type: String },
  lastCheckedAt: { type: Date, required: true, default: Date.now }
}, { versionKey: 'version', timestamps: true });

export const ProviderState = model('ProviderState', ProviderStateSchema);
