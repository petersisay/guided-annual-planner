import { Schema, model, Document, Types } from 'mongoose';

export interface IDayTaskSubdoc {
  id: string;
  text: string;
  done: boolean;
}

export interface IScheduleBlockSubdoc {
  id: string;
  timeSlot: string;
  activity: string;
  done: boolean;
}

export interface IDailyJournalSubdoc {
  gratitude: [string, string, string];
  wins: string;
  challengesAndLessons: string;
  freeWriting: string;
}

export interface IDailyPlanDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  year: number;
  month: number;
  isoWeek: number;
  intention: string;
  primaryPriorities: IDayTaskSubdoc[];
  additionalTasks: IDayTaskSubdoc[];
  schedule: IScheduleBlockSubdoc[];
  reflection: string;
  journal: IDailyJournalSubdoc;
  createdAt: Date;
  updatedAt: Date;
}

const DayTaskSubdocSchema = new Schema<IDayTaskSubdoc>(
  {
    id: { type: String, required: true },
    text: { type: String, default: '', maxlength: 300 },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const ScheduleBlockSubdocSchema = new Schema<IScheduleBlockSubdoc>(
  {
    id: { type: String, required: true },
    timeSlot: { type: String, required: true, maxlength: 50 },
    activity: { type: String, default: '', maxlength: 300 },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const DailyJournalSubdocSchema = new Schema<IDailyJournalSubdoc>(
  {
    gratitude: {
      type: [String],
      default: ['', '', ''],
      validate: [(val: string[]) => val.length === 3, 'Must have exactly 3 gratitude lines'],
    },
    wins: { type: String, default: '', maxlength: 3000 },
    challengesAndLessons: { type: String, default: '', maxlength: 3000 },
    freeWriting: { type: String, default: '', maxlength: 8000 },
  },
  { _id: false }
);

const DailyPlanSchema = new Schema<IDailyPlanDocument>(
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
      validate: [(val: IDayTaskSubdoc[]) => val.length === 3, 'Must have exactly 3 primary priorities'],
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

// Compound unique index ensuring one daily plan per user per canonical date
DailyPlanSchema.index({ userId: 1, date: 1 }, { unique: true });
DailyPlanSchema.index({ userId: 1, year: 1, month: 1 });

export const DailyPlan = model<IDailyPlanDocument>('DailyPlan', DailyPlanSchema);
