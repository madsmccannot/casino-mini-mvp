import { Schema, model } from 'mongoose';
const SportsProviderStateSchema = new Schema({
  provider: { type: String, required: true, unique: true }, state: { type: String, enum: ['HEALTHY', 'DEGRADED', 'DISABLED', 'HALTED'], required: true },
  lastSuccessAt: Date, lastFailureAt: Date, lastError: String, feedCursor: String,
  consecutiveFailures: { type: Number, required: true, default: 0 }, eventsIngested: { type: Number, required: true, default: 0 }
}, { timestamps: true });
export const SportsProviderState = model('SportsProviderState', SportsProviderStateSchema);
