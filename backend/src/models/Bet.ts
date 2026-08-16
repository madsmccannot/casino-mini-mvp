import mongoose, { Schema, Document } from 'mongoose';

export interface IBet extends Document {
  betId: string;
  userId: mongoose.Types.ObjectId;
  game: string;
  wager: number;
  payout: number;
  multiplier: number;
  profit: number;
  outcome: 'win' | 'loss' | 'pending';
  details: any;
  stats?: any;
  timestamp: Date;
  status: 'FUNDS_RESERVED' | 'RESULT_READY' | 'SETTLED' | 'REFUNDED' | 'FAILED';
}

const BetSchema = new Schema({
  betId: { type: String, required: true, unique: true, immutable: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  game: { type: String, required: true }, // ex: 'coinflip', 'mines'
  wager: { type: Number, required: true },
  payout: { type: Number, default: 0 },
  multiplier: { type: Number, default: 0 },
  profit: { type: Number, required: true }, // Payout - Wager
  outcome: { type: String, enum: ['win', 'loss', 'pending'], required: true },
  
  // Guardamos o resultado técnico (ex: número do dado, caminho do plinko)
  details: { type: Schema.Types.Mixed }, 
  stats: { type: Schema.Types.Mixed },
  
  status: { type: String, enum: ['FUNDS_RESERVED', 'RESULT_READY', 'SETTLED', 'REFUNDED', 'FAILED'], required: true },
  timestamp: { type: Date, default: Date.now, index: -1 } // Ordenar do mais recente para o antigo
});

export const Bet = mongoose.model<IBet>('Bet', BetSchema);
