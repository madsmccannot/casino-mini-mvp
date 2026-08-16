import { Schema, model } from 'mongoose';

const SelectionSchema = new Schema({
  selectionId: { type: String, required: true }, providerSelectionId: { type: String, required: true },
  name: { type: String, required: true }, oddsMillionths: { type: Schema.Types.Decimal128, required: true },
  status: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'CLOSED'], required: true }
}, { _id: false });

const SportsMarketSchema = new Schema({
  marketId: { type: String, required: true, unique: true, immutable: true },
  provider: { type: String, required: true, immutable: true }, providerMarketId: { type: String, required: true, immutable: true },
  eventId: { type: String, required: true, index: true }, type: { type: String, required: true, index: true },
  name: { type: String, required: true }, line: String, isLive: { type: Boolean, required: true, index: true },
  status: { type: String, enum: ['ACTIVE', 'STALE', 'SUSPENDED', 'CLOSED'], required: true, index: true },
  providerStatus: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'CLOSED'], required: true },
  version: { type: Number, required: true, min: 1 }, providerUpdatedAt: { type: Date, required: true },
  sourceHash: { type: String, required: true },
  lastIngestedAt: { type: Date, required: true, default: Date.now }, selections: { type: [SelectionSchema], required: true }
}, { timestamps: true });
SportsMarketSchema.index({ provider: 1, providerMarketId: 1 }, { unique: true });
SportsMarketSchema.index({ 'selections.selectionId': 1 });
export const SportsMarket = model('SportsMarket', SportsMarketSchema);
