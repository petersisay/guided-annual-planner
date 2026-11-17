import { Schema, model } from 'mongoose';

const ProcessedMutationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mutationId: {
      type: String,
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
    },
    requestHash: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'failed'],
      default: 'in_progress',
      required: true,
    },
    statusCode: {
      type: Number,
      required: false,
    },
    responseBody: {
      type: Schema.Types.Mixed,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      // Automatic TTL expiration after 7 days
      expires: 60 * 60 * 24 * 7,
    },
  },
  { versionKey: false }
);

ProcessedMutationSchema.index({ userId: 1, mutationId: 1 }, { unique: true });

export const ProcessedMutation = model('ProcessedMutation', ProcessedMutationSchema);
