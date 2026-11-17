import { Schema, model } from 'mongoose';

const DayTaskSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, default: '', maxlength: 300 },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const DayPlanSchema = new Schema(
  {
    date: { type: String, required: true },
    tasks: {
      type: [DayTaskSchema],
      default: () => [],
    },
  },
  { _id: false }
);

const PriorityItemSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, default: '', maxlength: 300 },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const WeeklyPlanSchema = new Schema(
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
    isoWeek: {
      type: Number,
      required: true,
      min: 1,
      max: 53,
    },
    days: {
      type: [DayPlanSchema],
      default: () => [],
    },
    priorities: {
      type: [PriorityItemSchema],
      default: () => [],
    },
    reminder: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    nextWeek: {
      type: [String],
      default: () => [],
    },
    notes: {
      type: String,
      default: '',
      maxlength: 5000,
    },
  },
  {
    timestamps: true,
  }
);

WeeklyPlanSchema.index({ userId: 1, year: 1, isoWeek: 1 }, { unique: true });

export const WeeklyPlan = model('WeeklyPlan', WeeklyPlanSchema);
