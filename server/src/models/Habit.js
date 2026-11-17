import { Schema, model } from 'mongoose';

const HabitSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    colorHex: {
      type: String,
      default: '#7A9A48',
      match: /^#[0-9a-fA-F]{6}$/,
    },
    activeYear: {
      type: Number,
      required: true,
      index: true,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    completionDates: {
      type: Map,
      of: Boolean,
      default: () => new Map(),
    },
  },
  {
    timestamps: true,
  }
);

HabitSchema.index({ userId: 1, activeYear: 1, archived: 1 });

export const Habit = model('Habit', HabitSchema);
