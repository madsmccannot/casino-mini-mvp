import { Schema, model } from 'mongoose';

const SportsEventSchema = new Schema({
  eventId: { type: String, required: true, unique: true, immutable: true },
  provider: { type: String, required: true, immutable: true },
  providerEventId: { type: String, required: true, immutable: true },
  competitionId: { type: String, required: true, index: true },
  sport: { type: String, required: true, index: true },
  name: { type: String, required: true }, home: String, away: String,
  startsAt: { type: Date, required: true, index: true },
  status: { type: String, enum: ['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED'], required: true, index: true },
  version: { type: Number, required: true, min: 1 }, providerUpdatedAt: { type: Date, required: true },
  sourceHash: { type: String, required: true },
  lastIngestedAt: { type: Date, required: true, default: Date.now }
}, { timestamps: true });
SportsEventSchema.index({ provider: 1, providerEventId: 1 }, { unique: true });
export const SportsEvent = model('SportsEvent', SportsEventSchema);
