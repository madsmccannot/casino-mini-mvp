import { Document, Schema, model, Types } from 'mongoose';

export interface IBlackjackSession extends Document {
  userId: Types.ObjectId; betId: string; sessionId: string; wager: number; active: boolean;
  deck: string[]; deckIndex: number; playerCards: string[]; dealerCards: string[];
  serverSeed: string; commitHash: string; clientSeed: string; nonce: number;
  commitId: string; committedAt: Date;
  terminalResult?: any;
}

const BlackjackSessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, index: true, immutable: true },
  betId: { type: String, required: true, unique: true, immutable: true },
  sessionId: { type: String, required: true, unique: true, immutable: true },
  wager: { type: Number, required: true, immutable: true },
  active: { type: Boolean, required: true, default: true, index: true },
  deck: { type: [String], required: true, select: false },
  deckIndex: { type: Number, required: true, default: 4 },
  playerCards: { type: [String], required: true },
  dealerCards: { type: [String], required: true },
  serverSeed: { type: String, required: true, select: false },
  commitHash: { type: String, required: true },
  clientSeed: { type: String, required: true },
  nonce: { type: Number, required: true },
  commitId: { type: String, required: true, immutable: true },
  committedAt: { type: Date, required: true, immutable: true },
  terminalResult: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now, expires: '24h' }
}, { optimisticConcurrency: true });

export const BlackjackSession = model<IBlackjackSession>('BlackjackSession', BlackjackSessionSchema);
