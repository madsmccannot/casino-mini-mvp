import mongoose, { Schema, Document } from 'mongoose';

export interface IDepositReceipt extends Document {
  signature: string;
  walletAddress: string;
  amountSol: number;
  status: 'pending_credit' | 'credited' | 'manual_review';
  creditedAt?: Date;
}

const DepositReceiptSchema = new Schema<IDepositReceipt>({
  signature: { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true, index: true },
  amountSol: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending_credit', 'credited', 'manual_review'],
    default: 'pending_credit',
    required: true
  },
  creditedAt: { type: Date }
}, { timestamps: true });

export const DepositReceipt = mongoose.model<IDepositReceipt>('DepositReceipt', DepositReceiptSchema);
