import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuditEvent extends Document {
  eventId: string;
  actorId?: Types.ObjectId;
  actorWallet?: string;
  action: string;
  targetType: string;
  targetId?: string;
  correlationId: string;
  outcome: 'SUCCESS' | 'DENIED' | 'FAILED';
  metadata?: Record<string, unknown>;
  occurredAt: Date;
}

const AuditEventSchema = new Schema<IAuditEvent>({
  eventId: { type: String, required: true, unique: true, immutable: true },
  actorId: { type: Schema.Types.ObjectId, immutable: true },
  actorWallet: { type: String, immutable: true },
  action: { type: String, required: true, immutable: true },
  targetType: { type: String, required: true, immutable: true },
  targetId: { type: String, immutable: true },
  correlationId: { type: String, required: true, index: true, immutable: true },
  outcome: { type: String, enum: ['SUCCESS', 'DENIED', 'FAILED'], required: true, immutable: true },
  metadata: { type: Schema.Types.Mixed, immutable: true },
  occurredAt: { type: Date, default: Date.now, required: true, immutable: true }
}, { timestamps: true });

AuditEventSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne'], function () {
  throw new Error('Audit events are immutable');
});
AuditEventSchema.pre(['deleteOne', 'deleteMany', 'findOneAndDelete'], function () {
  throw new Error('Audit events cannot be deleted');
});

export const AuditEvent = mongoose.model<IAuditEvent>('AuditEvent', AuditEventSchema);

export const appendAuditEvent = (event: Omit<IAuditEvent, keyof Document | 'eventId' | 'occurredAt'> & { eventId: string }) =>
  AuditEvent.create({ ...event, occurredAt: new Date() });
