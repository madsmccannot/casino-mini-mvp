import mongoose, { Document, Schema, Types } from 'mongoose';
import { LEDGER_CURRENCIES, LedgerCurrency } from './ledger.types';

export interface ILedgerReservation extends Document {
  reservationId: string;
  ownerId: Types.ObjectId;
  currency: LedgerCurrency;
  amountMinor: Types.Decimal128;
  status: 'ACTIVE' | 'COMMITTED' | 'RELEASED';
  referenceType: string;
  referenceId: string;
  reserveJournalId: Types.ObjectId;
  terminalJournalId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LedgerReservationSchema = new Schema<ILedgerReservation>({
  reservationId: { type: String, required: true, unique: true, immutable: true },
  ownerId: { type: Schema.Types.ObjectId, required: true, index: true, immutable: true },
  currency: { type: String, enum: LEDGER_CURRENCIES, required: true, immutable: true },
  amountMinor: { type: Schema.Types.Decimal128, required: true, immutable: true },
  status: { type: String, enum: ['ACTIVE', 'COMMITTED', 'RELEASED'], required: true },
  referenceType: { type: String, required: true, immutable: true },
  referenceId: { type: String, required: true, immutable: true },
  reserveJournalId: { type: Schema.Types.ObjectId, ref: 'JournalTransaction', required: true, immutable: true },
  terminalJournalId: { type: Schema.Types.ObjectId, ref: 'JournalTransaction' }
}, { timestamps: true });

LedgerReservationSchema.index({ referenceType: 1, referenceId: 1 }, { unique: true });

export const LedgerReservation = mongoose.model<ILedgerReservation>('LedgerReservation', LedgerReservationSchema);
