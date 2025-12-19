import mongoose, { Schema, Document } from 'mongoose';

export interface IGameSession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  game: string;
  wager: number;
  active: boolean;
  state: {
    bombs: number[];
    revealed: number[];
    bombCount: number;
  };
  serverSeed: string;
  commitHash: string;
  clientSeed?: string;
  createdAt: Date;
}

const GameSessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true, unique: true, index: true },
  game: { type: String, required: true }, // ex: 'mines'
  wager: { type: Number, required: true },
  active: { type: Boolean, default: true },
  
  // Estado específico do jogo (Bombas e Jogadas)
  state: { 
    bombs: { type: [Number], required: true },
    revealed: { type: [Number], default: [] },
    bombCount: { type: Number, required: true }
  },

  // Provably Fair data
  serverSeed: { type: String, required: true },
  commitHash: { type: String, required: true },
  clientSeed: { type: String },

  // Auto-limpeza: Jogos abandonados são apagados após 24h
  createdAt: { type: Date, default: Date.now, expires: '24h' } 
});

export const GameSession = mongoose.model<IGameSession>('GameSession', GameSessionSchema);