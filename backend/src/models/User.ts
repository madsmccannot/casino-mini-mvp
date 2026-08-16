import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  accountId: string;
  primaryWallet?: { chainFamily: 'EVM'; chainId: number; address: string };
  walletAddress?: string;
  displayName?: string;
  balance: number;
  totalWagered: number;
  
  // Flags de Permissão e Estado
  isAdmin: boolean;        // Acesso ao Dashboard
  isBankroll: boolean;     // Conta da Banca (Liquidez)
  isTransferEnabled: boolean; // Controlo de Emergência (Global)

  createdAt: Date;
  lastLogin: Date;
  legacyBalanceMigratedAt?: Date;
  legacyBalanceMinor?: string;
}

const UserSchema = new Schema({
  accountId: { type: String, unique: true, sparse: true, index: true },
  primaryWallet: {
    chainFamily: { type: String, enum: ['EVM'] },
    chainId: { type: Number },
    address: { type: String, index: true }
  },
  // Legacy test-data compatibility only. New identities never use this field.
  walletAddress: { type: String, sparse: true, index: true },
  displayName: { type: String, trim: true, maxlength: 32 },
  balance: { type: Number, default: 0 },
  totalWagered: { type: Number, default: 0 },
  
  isAdmin: { type: Boolean, default: false },
  isBankroll: { type: Boolean, default: false },
  
  // Por defeito, as transferências estão ATIVAS (true)
  isTransferEnabled: { type: Boolean, default: true }, 

  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  legacyBalanceMigratedAt: { type: Date },
  legacyBalanceMinor: { type: String }
});

export const User = mongoose.model<IUser>('User', UserSchema);
