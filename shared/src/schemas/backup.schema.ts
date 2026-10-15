import { z } from 'zod';
import { BACKUP_FORMAT_IDENTIFIER, BACKUP_SCHEMA_VERSION } from '../types/backup';
import { userPreferencesSchema } from './user.schema';
import { annualReviewSchema } from './annual.schema';
import { checklistItemSchema, bookEntrySchema } from './monthly.schema';
import { dayPlanSchema, priorityItemSchema, dayTaskSchema } from './weekly.schema';
import { scheduleBlockSchema, dailyJournalSchema } from './daily.schema';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Rejects any forbidden keys that might indicate credential or secret leaks
const FORBIDDEN_KEYS = [
  'password',
  'googlesub',
  'session',
  'secret',
  'token',
  'credential',
  'cookie',
  'privatekey',
];

function containsForbiddenKeys(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  for (const key of Object.keys(obj)) {
    const lower = key.toLowerCase();
    if (FORBIDDEN_KEYS.some((fk) => lower.includes(fk))) {
      return true;
    }
    if (typeof obj[key] === 'object' && containsForbiddenKeys(obj[key])) {
      return true;
    }
  }
  return false;
}

export const backupMetadataSchema = z.object({
  format: z.literal(BACKUP_FORMAT_IDENTIFIER, {
    errorMap: () => ({ message: `Invalid backup format. Must be '${BACKUP_FORMAT_IDENTIFIER}'` }),
  }),
  version: z.literal(BACKUP_SCHEMA_VERSION, {
    errorMap: () => ({ message: `Unsupported backup version. Supported version: '${BACKUP_SCHEMA_VERSION}'` }),
  }),
  exportedAt: z.string().datetime({ message: 'exportedAt must be a valid ISO 8601 string' }),
  appVersion: z.string().default('1.0.0'),
  counts: z.object({
    annualPlans: z.number().int().nonnegative(),
    monthlyPlans: z.number().int().nonnegative(),
    weeklyPlans: z.number().int().nonnegative(),
    dailyPlans: z.number().int().nonnegative(),
    moods: z.number().int().nonnegative(),
    habits: z.number().int().nonnegative(),
  }),
});

export const backupAnnualPlanSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  themeOrWord: z.string().max(100).optional(),
  annualIntentions: z.array(z.string().max(500)).max(50).default([]),
  annualReview: annualReviewSchema.optional(),
});

export const backupMonthlyPlanSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  mustDos: z.array(checklistItemSchema).max(50).default([]),
  newHabits: z.array(z.string().max(200)).max(20).default([]),
  toBuy: z.array(checklistItemSchema).max(50).default([]),
  books: z.array(bookEntrySchema).max(20).default([]),
  selfChangeReflection: z.string().max(3000).optional(),
  calendarNotes: z.record(z.string().max(2000)).optional(),
});

export const backupWeeklyPlanSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  isoWeek: z.number().int().min(1).max(53),
  days: z.array(dayPlanSchema).max(7).default([]),
  priorities: z.array(priorityItemSchema).max(20).default([]),
  reminder: z.string().max(1000).optional(),
  nextWeek: z.array(z.string().max(300)).max(20).default([]),
  notes: z.string().max(5000).optional(),
});

export const backupDailyPlanSchema = z.object({
  date: z.string().regex(dateRegex, 'date must be in YYYY-MM-DD format'),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  isoWeek: z.number().int().min(1).max(53),
  intention: z.string().max(500).optional(),
  primaryPriorities: z.array(dayTaskSchema).max(3).default([]),
  additionalTasks: z.array(dayTaskSchema).max(50).default([]),
  schedule: z.array(scheduleBlockSchema).max(50).default([]),
  reflection: z.string().max(3000).optional(),
  journal: dailyJournalSchema,
});

export const backupMoodEntrySchema = z.object({
  date: z.string().regex(dateRegex, 'date must be in YYYY-MM-DD format'),
  year: z.number().int().min(2000).max(2100),
  moodKey: z.string().min(1).max(50),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color code'),
  label: z.string().min(1).max(100),
  note: z.string().max(1000).optional(),
});

export const backupHabitSchema = z.object({
  title: z.string().min(1).max(100),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#7A9A48'),
  activeYear: z.number().int().min(2000).max(2100),
  archived: z.boolean().default(false),
  completionDates: z.array(z.string().regex(dateRegex)).max(400).default([]),
});

export const plannerBackupSchema = z
  .object({
    metadata: backupMetadataSchema,
    preferences: userPreferencesSchema.optional(),
    annualPlans: z.array(backupAnnualPlanSchema).max(50).default([]),
    monthlyPlans: z.array(backupMonthlyPlanSchema).max(600).default([]),
    weeklyPlans: z.array(backupWeeklyPlanSchema).max(2600).default([]),
    dailyPlans: z.array(backupDailyPlanSchema).max(10000).default([]),
    moods: z.array(backupMoodEntrySchema).max(10000).default([]),
    habits: z.array(backupHabitSchema).max(100).default([]),
  })
  .passthrough()
  .refine((data) => !containsForbiddenKeys(data), {
    message: 'Backup file contains disallowed credential or security-sensitive fields',
  });

export type PlannerBackupInput = z.infer<typeof plannerBackupSchema>;

export const restoreRequestSchema = z.object({
  mode: z.enum(['merge', 'replace']),
  confirmReplace: z.boolean().optional(),
  backup: plannerBackupSchema,
});

export type RestoreRequestInput = z.infer<typeof restoreRequestSchema>;
