import { Schema, model } from 'mongoose';

const TicketLegSchema = new Schema({
  selectionId: { type: String, required: true }, eventId: { type: String, required: true }, marketId: { type: String, required: true },
  marketType: { type: String, required: true }, selectionName: { type: String, required: true },
  acceptedMarketVersion: { type: Number, required: true }, acceptedOddsMillionths: { type: Schema.Types.Decimal128, required: true },
  result: { type: String, enum: ['OPEN', 'WIN', 'LOSS', 'VOID'], required: true, default: 'OPEN' }
}, { _id: false });
const QuoteLegSchema = new Schema({
  selectionId: { type: String, required: true }, displayedMarketVersion: { type: Number, required: true }, displayedOddsMillionths: { type: Schema.Types.Decimal128, required: true }
}, { _id: false });

const SportsTicketSchema = new Schema({
  ticketId: { type: String, required: true, unique: true, immutable: true }, userId: { type: Schema.Types.ObjectId, required: true, index: true, immutable: true },
  provider: { type: String, required: true, immutable: true }, providerTicketId: { type: String, sparse: true, unique: true },
  type: { type: String, enum: ['SINGLE', 'ACCUMULATOR'], required: true }, currency: { type: String, required: true, default: 'SOL' },
  stakeMinor: { type: Schema.Types.Decimal128, required: true, immutable: true }, maxPayoutMinor: { type: Schema.Types.Decimal128, required: true },
  payoutMinor: { type: Schema.Types.Decimal128 }, status: { type: String, enum: ['FUNDS_RESERVED', 'ACCEPTED', 'REJECTED', 'SETTLEMENT_PENDING', 'SETTLED', 'VOIDED', 'MANUAL_REVIEW'], required: true, index: true },
  legs: { type: [TicketLegSchema], required: true }, acceptedAt: Date, settledAt: Date,
  acceptancePayloadHash: { type: String, required: true }, providerSettlementIds: { type: [String], default: [] }
  ,quoteLegs: { type: [QuoteLegSchema], required: true }, acceptOddsChange: { type: Boolean, required: true }
}, { timestamps: true, optimisticConcurrency: true });
export const SportsTicket = model('SportsTicket', SportsTicketSchema);
