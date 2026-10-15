import { z } from 'zod';

export const checklistItemSchema = z.object({
  id: z.string().uuid(),
  text: z.string().max(300).default(''),
  checked: z.boolean().default(false),
});

export const bookEntrySchema = z.object({
  id: z.string().uuid(),
  title: z.string().max(200).default(''),
  author: z.string().max(200).optional(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#7A9A48'),
  read: z.boolean().default(false),
});

export const updateMonthlyPlanSchema = z.object({
  mustDos: z.array(checklistItemSchema).max(6).optional(),
  newHabits: z.array(z.string().max(200)).max(10).optional(),
  toBuy: z.array(checklistItemSchema).max(10).optional(),
  books: z.array(bookEntrySchema).max(5).optional(),
  selfChangeReflection: z.string().max(2000).optional(),
  calendarNotes: z.record(
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.string().max(500)
  ).optional(),
  expectedUpdatedAt: z.string().optional(),
});

export type UpdateMonthlyPlanInput = z.infer<typeof updateMonthlyPlanSchema>;
