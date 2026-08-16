import mongoose, { Document, Schema, Types } from 'mongoose';
import { LEDGER_CURRENCIES, LedgerCurrency, PostingSide } from './ledger.types';

export interface IJournalPosting {
  accountId: Types.ObjectId;
  accountCode: string;
  side: PostingSide;
  amountMinor: Types.Decimal128;
  memo?: string;
}

export interface IJournalTransaction extends Document {
  idempotencyKey: string;
  payloadHash: string;
  transactionType: string;
  currency: LedgerCurrency;
  referenceType: string;
  referenceId: string;
  postings: IJournalPosting[];
  metadata?: Record<string, unknown>;
  status: 'POSTED';
  postedAt: Date;
}

const PostingSchema = new Schema<IJournalPosting>({
  accountId: { type: Schema.Types.ObjectId, ref: 'LedgerAccount', required: true, immutable: true },
  accountCode: { type: String, required: true, immutable: true },
  side: { type: String, enum: ['DEBIT', 'CREDIT'], required: true, immutable: true },
  amountMinor: { type: Schema.Types.Decimal128, required: true, immutable: true },
  memo: { type: String, maxlength: 500, immutable: true }
}, { _id: false });

const JournalTransactionSchema = new Schema<IJournalTransaction>({
  idempotencyKey: { type: String, required: true, unique: true, immutable: true },
  payloadHash: { type: String, required: true, immutable: true },
  transactionType: { type: String, required: true, immutable: true },
  currency: { type: String, enum: LEDGER_CURRENCIES, required: true, immutable: true },
  referenceType: { type: String, required: true, immutable: true },
  referenceId: { type: String, required: true, immutable: true },
  postings: { type: [PostingSchema], required: true, immutable: true },
  metadata: { type: Schema.Types.Mixed, immutable: true },
  status: { type: String, enum: ['POSTED'], default: 'POSTED', required: true, immutable: true },
  postedAt: { type: Date, default: Date.now, required: true, immutable: true }
}, { timestamps: true });

JournalTransactionSchema.index({ referenceType: 1, referenceId: 1 });
JournalTransactionSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne'], function () {
  throw new Error('Posted journal transactions are immutable');
});
JournalTransactionSchema.pre(['deleteOne', 'deleteMany', 'findOneAndDelete'], function () {
  throw new Error('Posted journal transactions cannot be deleted');
});

export const JournalTransaction = mongoose.model<IJournalTransaction>('JournalTransaction', JournalTransactionSchema);
