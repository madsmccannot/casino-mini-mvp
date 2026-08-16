import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ILedgerBalance extends Document {
  accountId: Types.ObjectId;
  accountCode: string;
  amountMinor: Types.Decimal128;
}

const LedgerBalanceSchema = new Schema<ILedgerBalance>({
  accountId: { type: Schema.Types.ObjectId, ref: 'LedgerAccount', required: true, unique: true, immutable: true },
  accountCode: { type: String, required: true, unique: true, immutable: true },
  amountMinor: { type: Schema.Types.Decimal128, required: true, default: () => Types.Decimal128.fromString('0') }
}, { timestamps: true });

export const LedgerBalance = mongoose.model<ILedgerBalance>('LedgerBalance', LedgerBalanceSchema);
