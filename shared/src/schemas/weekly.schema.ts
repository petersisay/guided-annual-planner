import { z } from 'zod';

export const dayTaskSchema = z.object({
  id: z.string().uuid(),
  text: z.string().max(300).default(''),
  done: z.boolean().default(false),
});

export const dayPlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tasks: z.tuple([dayTaskSchema, dayTaskSchema, dayTaskSchema]),
});

export const priorityItemSchema = z.object({
  id: z.string().uuid(),
  text: z.string().max(300).default(''),
  done: z.boolean().default(false),
});

export const updateWeeklyPlanSchema = z.object({
  days: z.array(dayPlanSchema).length(7).optional(),
  priorities: z.array(priorityItemSchema).max(5).optional(),
  reminder: z.string().max(1000).optional(),
  nextWeek: z.array(z.string().max(300)).max(3).optional(),
  notes: z.string().max(5000).optional(),
  expectedUpdatedAt: z.string().optional(),
});

export type UpdateWeeklyPlanInput = z.infer<typeof updateWeeklyPlanSchema>;
