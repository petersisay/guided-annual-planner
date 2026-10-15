import { Schema, model, Document, Types } from 'mongoose';

export interface ISessionDocument extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  sessionTokenHash: string;
  previousTokenHash?: string;
  gracePeriodExpiresAt?: Date;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  absoluteExpiresAt: Date;
  lastRotatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISessionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionTokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    previousTokenHash: {
      type: String,
      index: true,
    },
    gracePeriodExpiresAt: {
      type: Date,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    absoluteExpiresAt: {
      type: Date,
      required: true,
    },
    lastRotatedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index for automatic database garbage collection (as secondary cleanup)
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = model<ISessionDocument>('Session', SessionSchema);
