import { Schema, model, Document, Types } from 'mongoose';
import { ChecklistItem, BookEntry } from '@planner/shared';

export interface IMonthlyPlanDocument extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  year: number;
  month: number;
  mustDos: ChecklistItem[];
  newHabits: string[];
  toBuy: ChecklistItem[];
  books: BookEntry[];
  selfChangeReflection: string;
  calendarNotes: Map<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistItemSchema = new Schema<ChecklistItem>(
  {
    id: { type: String, required: true },
    text: { type: String, default: '', maxlength: 300 },
    checked: { type: Boolean, default: false },
  },
  { _id: false }
);

const BookEntrySchema = new Schema<BookEntry>(
  {
    id: { type: String, required: true },
    title: { type: String, default: '', maxlength: 200 },
    author: { type: String, maxlength: 200 },
    colorHex: { type: String, default: '#7A9A48' },
    read: { type: Boolean, default: false },
  },
  { _id: false }
);

const MonthlyPlanSchema = new Schema<IMonthlyPlanDocument>(
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
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    mustDos: {
      type: [ChecklistItemSchema],
      default: () => [],
    },
    newHabits: {
      type: [String],
      default: () => [],
    },
    toBuy: {
      type: [ChecklistItemSchema],
      default: () => [],
    },
    books: {
      type: [BookEntrySchema],
      default: () => [],
    },
    selfChangeReflection: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    calendarNotes: {
      type: Map,
      of: String,
      default: () => new Map(),
    },
  },
  {
    timestamps: true,
  }
);

MonthlyPlanSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

export const MonthlyPlan = model<IMonthlyPlanDocument>('MonthlyPlan', MonthlyPlanSchema);
