import { Schema, model } from 'mongoose';

const CrashWagerSchema = new Schema({
  betId: { type: String, required: true, unique: true, immutable: true },
  roundId: { type: String, required: true, index: true, immutable: true },
  userId: { type: Schema.Types.ObjectId, required: true, index: true, immutable: true },
  wager: { type: Number, required: true, immutable: true },
  autoCashout: { type: Number, required: true, immutable: true },
  settledMultiplier: { type: Number },
  status: { type: String, enum: ['PREPARING', 'ACTIVE', 'SETTLING', 'SETTLED'], required: true, default: 'PREPARING', index: true }
}, { timestamps: true, optimisticConcurrency: true });

CrashWagerSchema.index({ roundId: 1, status: 1, autoCashout: 1 });
export const CrashWager = model('CrashWager', CrashWagerSchema);
