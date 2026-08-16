import mongoose, { Document, Schema } from 'mongoose';
import { ACCOUNT_TYPES, LEDGER_CURRENCIES, LedgerAccountType, LedgerCurrency } from './ledger.types';

export interface ILedgerAccount extends Document {
  code: string;
  type: LedgerAccountType;
  currency: LedgerCurrency;
  ownerId?: mongoose.Types.ObjectId;
  purpose: string;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
}

const LedgerAccountSchema = new Schema<ILedgerAccount>({
  code: { type: String, required: true, unique: true, immutable: true },
  type: { type: String, enum: ACCOUNT_TYPES, required: true, immutable: true },
  currency: { type: String, enum: LEDGER_CURRENCIES, required: true, immutable: true },
  ownerId: { type: Schema.Types.ObjectId, index: true, immutable: true },
  purpose: { type: String, required: true, immutable: true },
  status: { type: String, enum: ['ACTIVE', 'FROZEN', 'CLOSED'], default: 'ACTIVE', required: true }
}, { timestamps: true });

LedgerAccountSchema.index({ ownerId: 1, currency: 1, purpose: 1 }, { unique: true, sparse: true });

export const LedgerAccount = mongoose.model<ILedgerAccount>('LedgerAccount', LedgerAccountSchema);
