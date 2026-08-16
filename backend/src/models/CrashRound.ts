import { Schema, model } from 'mongoose';

const CrashRoundSchema = new Schema({
  roundId: { type: String, required: true, unique: true, immutable: true },
  serverSeed: { type: String, required: true, immutable: true, select: false },
  commitHash: { type: String, required: true, immutable: true },
  crashMultiplier: { type: Number, required: true, immutable: true, select: false },
  activeSlot: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ['BETTING', 'RUNNING', 'CRASHED'], required: true, index: true },
  bettingClosesAt: { type: Date, required: true },
  startedAt: { type: Date },
  crashedAt: { type: Date }
}, { timestamps: true });

export const CrashRound = model('CrashRound', CrashRoundSchema);
