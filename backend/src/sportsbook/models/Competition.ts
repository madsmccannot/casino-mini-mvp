import { Schema, model } from 'mongoose';

const CompetitionSchema = new Schema({
  competitionId: { type: String, required: true, unique: true, immutable: true },
  provider: { type: String, required: true, immutable: true },
  providerCompetitionId: { type: String, required: true, immutable: true },
  sport: { type: String, required: true, index: true },
  name: { type: String, required: true },
  country: { type: String },
  status: { type: String, enum: ['ACTIVE', 'DISABLED'], required: true, default: 'ACTIVE' }
}, { timestamps: true });
export const Competition = model('Competition', CompetitionSchema);
