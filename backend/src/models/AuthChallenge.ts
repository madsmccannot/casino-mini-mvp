import mongoose, { Schema, Document } from 'mongoose';

export interface IAuthChallenge extends Document {
  address: string;
  chainFamily: 'EVM';
  chainId: number;
  domain: string;
  uri: string;
  nonce: string;
  message: string;
  expiresAt: Date;
  usedAt?: Date;
}

const AuthChallengeSchema = new Schema<IAuthChallenge>({
  address: { type: String, required: true, index: true },
  chainFamily: { type: String, enum: ['EVM'], required: true, default: 'EVM' },
  chainId: { type: Number, required: true, index: true },
  domain: { type: String, required: true },
  uri: { type: String, required: true },
  nonce: { type: String, required: true, unique: true },
  message: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
  usedAt: { type: Date }
}, { timestamps: true });

export const AuthChallenge = mongoose.model<IAuthChallenge>('AuthChallenge', AuthChallengeSchema);
