import { Schema, model } from 'mongoose';
const SandboxSettlementSchema = new Schema({
  sequence: { type: Number, required: true, unique: true }, providerSettlementId: { type: String, required: true, unique: true },
  providerTicketId: { type: String, required: true, index: true },
  legs: [{ _id: false, selectionId: { type: String, required: true }, result: { type: String, enum: ['WIN', 'LOSS', 'VOID'], required: true } }]
}, { timestamps: true });
export const SandboxSettlement = model('SandboxSettlement', SandboxSettlementSchema);
