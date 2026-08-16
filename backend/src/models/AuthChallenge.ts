import mongoose, { Schema, Document } from 'mongoose';

export interface IAuthChallenge extends Document {
  walletAddress: string;
  nonce: string;
  message: string;
  expiresAt: Date;
  usedAt?: Date;
}

const AuthChallengeSchema = new Schema<IAuthChallenge>({
  walletAddress: { type: String, required: true, index: true },
  nonce: { type: String, required: true, unique: true },
  message: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
  usedAt: { type: Date }
}, { timestamps: true });

export const AuthChallenge = mongoose.model<IAuthChallenge>('AuthChallenge', AuthChallengeSchema);
