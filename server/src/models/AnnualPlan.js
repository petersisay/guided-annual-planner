import { Schema, model } from 'mongoose';

const AnnualReviewSchema = new Schema(
  {
    celebrations: { type: String, trim: true, maxlength: 2000 },
    obstaclesEncountered: { type: String, trim: true, maxlength: 2000 },
    keyLessonsLearned: { type: String, trim: true, maxlength: 2000 },
    completedAt: { type: String },
  },
  { _id: false }
);

const AnnualPlanSchema = new Schema(
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

AnnualPlanSchema.index({ userId: 1, year: 1 }, { unique: true });

export const AnnualPlan = model('AnnualPlan', AnnualPlanSchema);
