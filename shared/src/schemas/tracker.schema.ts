import { z } from 'zod';

export const moodEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  moodKey: z.string().min(1).max(50),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid 6-character hex code'),
  label: z.string().min(1).max(50),
  note: z.string().max(1000).optional(),
});

export type MoodEntryInput = z.infer<typeof moodEntrySchema>;

export const habitCreateSchema = z.object({
  title: z.string().min(1, 'Habit title is required').max(100),
  colorHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid 6-character hex code')
    .default('#7A9A48'),
  activeYear: z.number().int().min(2000).max(2100),
});

export type HabitCreateInput = z.infer<typeof habitCreateSchema>;

export const habitUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  colorHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid 6-character hex code')
    .optional(),
  archived: z.boolean().optional(),
});

export type HabitUpdateInput = z.infer<typeof habitUpdateSchema>;

export const habitToggleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  completed: z.boolean(),
});

export type HabitToggleInput = z.infer<typeof habitToggleSchema>;
