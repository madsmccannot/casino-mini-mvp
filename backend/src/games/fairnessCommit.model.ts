import { Schema, model } from 'mongoose';

const FairnessCommitSchema = new Schema({
  commitId: { type: String, required: true, unique: true, immutable: true },
  userId: { type: Schema.Types.ObjectId, required: true, index: true, immutable: true },
  serverSeed: { type: String, required: true, immutable: true, select: false },
  commitHash: { type: String, required: true, immutable: true },
  clientSeed: { type: String, required: true, immutable: true },
  nonce: { type: Number, required: true, immutable: true },
  status: { type: String, enum: ['ISSUED', 'CONSUMED'], required: true, default: 'ISSUED' },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  consumedAt: { type: Date }
}, { timestamps: true });

export const FairnessCommit = model('FairnessCommit', FairnessCommitSchema);
