import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  walletAddress: string;
  balance: number;
  totalWagered: number;
  
  // Flags de Permissão e Estado
  isAdmin: boolean;        // Acesso ao Dashboard
  isBankroll: boolean;     // Conta da Banca (Liquidez)
  isTransferEnabled: boolean; // Controlo de Emergência (Global)

  createdAt: Date;
  lastLogin: Date;
}

const UserSchema = new Schema({
  // Solana base58 addresses are case-sensitive. Never normalize their case.
  walletAddress: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  totalWagered: { type: Number, default: 0 },
  
  isAdmin: { type: Boolean, default: false },
  isBankroll: { type: Boolean, default: false },
  
  // Por defeito, as transferências estão ATIVAS (true)
  isTransferEnabled: { type: Boolean, default: true }, 

  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

export const User = mongoose.model<IUser>('User', UserSchema);
