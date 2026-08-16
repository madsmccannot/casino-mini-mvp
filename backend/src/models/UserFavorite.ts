import mongoose, { Schema, Document } from 'mongoose';

export interface IUserFavorite extends Document {
  userId: mongoose.Types.ObjectId;
  itemType: 'original' | 'catalog' | 'sports';
  itemId: string;
  createdAt: Date;
}

const UserFavoriteSchema = new Schema<IUserFavorite>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  itemType: { type: String, enum: ['original', 'catalog', 'sports'], required: true },
  itemId: { type: String, required: true, trim: true, maxlength: 128 },
  createdAt: { type: Date, default: Date.now }
});
UserFavoriteSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });

export const UserFavorite = mongoose.model<IUserFavorite>('UserFavorite', UserFavoriteSchema);
