import { Schema, model } from 'mongoose';
const SportsSettlementReceiptSchema = new Schema({
  providerSettlementId: { type: String, required: true, unique: true, immutable: true },
  providerTicketId: { type: String, required: true, immutable: true }, payloadHash: { type: String, required: true, immutable: true },
  status: { type: String, enum: ['PROCESSING', 'APPLIED'], required: true, default: 'PROCESSING' }, appliedAt: Date
}, { timestamps: true });
export const SportsSettlementReceipt = model('SportsSettlementReceipt', SportsSettlementReceiptSchema);
