import { Schema, model, Document, Types } from 'mongoose';
import { UserPreferences } from '@planner/shared';

export interface IUserDocument extends Document<Types.ObjectId> {
  googleSub: string;
  email: string;
  name: string;
  avatarUrl?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

const UserPreferencesSchema = new Schema<UserPreferences>(
  {
    weekStart: {
      type: String,
      enum: ['monday', 'sunday'],
      default: 'monday',
      required: true,
    },
    weeklyViewDefault: {
      type: String,
      enum: ['7day', '5day'],
      default: '7day',
      required: true,
    },
    defaultCurrency: {
      type: String,
      default: 'USD',
      required: true,
      trim: true,
      maxlength: 5,
    },
    theme: {
      type: String,
      enum: ['paper-warm', 'paper-editorial'],
      default: 'paper-warm',
      required: true,
    },
    prefersReducedMotion: {
      type: Boolean,
      default: false,
      required: true,
    },
    onboardingStatus: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'skipped'],
      default: 'not_started',
      required: true,
    },
    onboardingStep: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
      required: true,
    },
    defaultYear: {
      type: Number,
      default: new Date().getFullYear(),
      required: true,
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUserDocument>(
  {
    googleSub: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    preferences: {
      type: UserPreferencesSchema,
      default: () => ({}),
      required: true,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<IUserDocument>('User', UserSchema);
