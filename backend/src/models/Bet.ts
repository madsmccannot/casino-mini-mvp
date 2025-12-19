import mongoose, { Schema, Document } from 'mongoose';

export interface IBet extends Document {
  userId: mongoose.Types.ObjectId;
  game: string;
  wager: number;
  payout: number;
  multiplier: number;
  profit: number;
  outcome: 'win' | 'loss';
  details: any;
  timestamp: Date;
}

const BetSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  game: { type: String, required: true }, // ex: 'coinflip', 'mines'
  wager: { type: Number, required: true },
  payout: { type: Number, default: 0 },
  multiplier: { type: Number, default: 0 },
  profit: { type: Number, required: true }, // Payout - Wager
  outcome: { type: String, enum: ['win', 'loss'], required: true },
  
  // Guardamos o resultado técnico (ex: número do dado, caminho do plinko)
  details: { type: Schema.Types.Mixed }, 
  
  timestamp: { type: Date, default: Date.now, index: -1 } // Ordenar do mais recente para o antigo
});

export const Bet = mongoose.model<IBet>('Bet', BetSchema);