import crypto from 'crypto';
import { Schema, model } from 'mongoose';

const DayTaskSubdocSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, default: '', maxlength: 300 },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const ScheduleBlockSubdocSchema = new Schema(
  {
    id: { type: String, required: true },
    timeSlot: { type: String, required: true, maxlength: 50 },
    activity: { type: String, default: '', maxlength: 300 },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const DailyJournalSubdocSchema = new Schema(
  {
    gratitude: {
      type: [String],
      default: ['', '', ''],
      validate: [(val) => val.length === 3, 'Must have exactly 3 gratitude lines'],
    },
    wins: { type: String, default: '', maxlength: 3000 },
    challengesAndLessons: { type: String, default: '', maxlength: 3000 },
    freeWriting: { type: String, default: '', maxlength: 8000 },
  },
  { _id: false }
);

const DailyPlanSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    isoWeek: { type: Number, required: true },
    intention: { type: String, default: '', maxlength: 500 },
    primaryPriorities: {
      type: [DayTaskSubdocSchema],
      default: () => [
        { id: crypto.randomUUID(), text: '', done: false },
        { id: crypto.randomUUID(), text: '', done: false },
        { id: crypto.randomUUID(), text: '', done: false },
      ],
      validate: [(val) => val.length === 3, 'Must have exactly 3 primary priorities'],
    },
    additionalTasks: {
      type: [DayTaskSubdocSchema],
      default: [],
    },
    schedule: {
      type: [ScheduleBlockSubdocSchema],
      default: [],
    },
    reflection: { type: String, default: '', maxlength: 3000 },
    journal: {
      type: DailyJournalSubdocSchema,
      default: () => ({
        gratitude: ['', '', ''],
        wins: '',
        challengesAndLessons: '',
        freeWriting: '',
      }),
    },
  },
  { timestamps: true }
);

DailyPlanSchema.index({ userId: 1, date: 1 }, { unique: true });
DailyPlanSchema.index({ userId: 1, year: 1, month: 1 });

export const DailyPlan = model('DailyPlan', DailyPlanSchema);
