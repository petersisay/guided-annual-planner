import { Schema, model, Document, Types } from 'mongoose';
import { AnnualReviewData } from '@planner/shared';

export interface IAnnualPlanDocument extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  year: number;
  themeOrWord?: string;
  annualIntentions: string[];
  annualReview: AnnualReviewData;
  createdAt: Date;
  updatedAt: Date;
}

const AnnualReviewSchema = new Schema<AnnualReviewData>(
  {
    celebrations: { type: String, trim: true, maxlength: 2000 },
    obstaclesEncountered: { type: String, trim: true, maxlength: 2000 },
    keyLessonsLearned: { type: String, trim: true, maxlength: 2000 },
    completedAt: { type: String },
  },
  { _id: false }
);

const AnnualPlanSchema = new Schema<IAnnualPlanDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
    },
    themeOrWord: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    annualIntentions: {
      type: [String],
      default: [],
    },
    annualReview: {
      type: AnnualReviewSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

// Guarantee tenant isolation and one annual plan per user per year
AnnualPlanSchema.index({ userId: 1, year: 1 }, { unique: true });

export const AnnualPlan = model<IAnnualPlanDocument>('AnnualPlan', AnnualPlanSchema);
