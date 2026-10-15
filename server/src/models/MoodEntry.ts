import { Schema, model, Document, Types } from 'mongoose';

export interface IMoodEntryDocument extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  year: number;
  moodKey: string;
  colorHex: string;
  label: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MoodEntrySchema = new Schema<IMoodEntryDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    moodKey: {
      type: String,
      required: true,
      trim: true,
    },
    colorHex: {
      type: String,
      required: true,
      match: /^#[0-9a-fA-F]{6}$/,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index: one mood entry per user per calendar day
MoodEntrySchema.index({ userId: 1, date: 1 }, { unique: true });
// Fast annual lookup index
MoodEntrySchema.index({ userId: 1, year: 1 });

export const MoodEntry = model<IMoodEntryDocument>('MoodEntry', MoodEntrySchema);
