import { Schema, model } from 'mongoose';

const ChecklistItemSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, default: '', maxlength: 300 },
    checked: { type: Boolean, default: false },
  },
  { _id: false }
);

const BookEntrySchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, default: '', maxlength: 200 },
    author: { type: String, maxlength: 200 },
    colorHex: { type: String, default: '#7A9A48' },
    read: { type: Boolean, default: false },
  },
  { _id: false }
);

const MonthlyPlanSchema = new Schema(
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

export const MonthlyPlan = model('MonthlyPlan', MonthlyPlanSchema);
