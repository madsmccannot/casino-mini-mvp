import { Schema, model } from 'mongoose';

const SportsCashoutQuoteSchema = new Schema({
  quoteId: { type: String, required: true, unique: true, immutable: true },
  providerTicketId: { type: String, required: true, index: true, immutable: true },
  amountMinor: { type: Schema.Types.Decimal128, required: true, immutable: true },
  expiresAt: { type: Date, required: true, immutable: true },
  status: { type: String, enum: ['OPEN', 'ACCEPTED'], required: true, default: 'OPEN' },
  acceptanceId: String
}, { timestamps: true });

export const SportsCashoutQuote = model('SportsCashoutQuote', SportsCashoutQuoteSchema);
