import mongoose, { Schema, Document } from 'mongoose';

export interface IReferralCode extends Document {
  userId: mongoose.Types.ObjectId;
  code: string;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: Date;
}

const ReferralCodeSchema = new Schema<IReferralCode>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  code: { type: String, required: true, unique: true, uppercase: true, immutable: true },
  status: { type: String, enum: ['ACTIVE', 'DISABLED'], default: 'ACTIVE' },
  createdAt: { type: Date, default: Date.now }
});

export const ReferralCode = mongoose.model<IReferralCode>('ReferralCode', ReferralCodeSchema);
