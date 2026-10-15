import { Schema, model, Document, Types } from 'mongoose';
import { DayPlan, PriorityItem, DayTask } from '@planner/shared';

export interface IWeeklyPlanDocument extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  year: number;
  isoWeek: number;
  days: DayPlan[];
  priorities: PriorityItem[];
  reminder: string;
  nextWeek: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const DayTaskSchema = new Schema<DayTask>(
  {
    id: { type: String, required: true },
    text: { type: String, default: '', maxlength: 300 },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const DayPlanSchema = new Schema<DayPlan>(
  {
    date: { type: String, required: true },
    tasks: {
      type: [DayTaskSchema],
      default: () => [],
    },
  },
  { _id: false }
);

const PriorityItemSchema = new Schema<PriorityItem>(
  {
    id: { type: String, required: true },
    text: { type: String, default: '', maxlength: 300 },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const WeeklyPlanSchema = new Schema<IWeeklyPlanDocument>(
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

export const WeeklyPlan = model<IWeeklyPlanDocument>('WeeklyPlan', WeeklyPlanSchema);
