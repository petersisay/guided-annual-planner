import { z } from 'zod';

const dayTaskSchema = z.object({
  id: z.string().uuid(),
  text: z.string().max(300).default(''),
  done: z.boolean().default(false),
});

const dailyTaskItemSchema = z.object({
  id: z.string().uuid(),
  text: z.string().max(300).default(''),
  done: z.boolean().default(false),
});

export const scheduleBlockSchema = z.object({
  id: z.string().uuid(),
  timeSlot: z.string().max(50),
  activity: z.string().max(300).default(''),
  done: z.boolean().default(false),
});

export const dailyJournalSchema = z.object({
  gratitude: z.tuple([
    z.string().max(300).default(''),
    z.string().max(300).default(''),
    z.string().max(300).default(''),
  ]).optional(),
  wins: z.string().max(3000).optional(),
  challengesAndLessons: z.string().max(3000).optional(),
  freeWriting: z.string().max(8000).optional(),
});

export const updateDailyPlanSchema = z.object({
  intention: z.string().max(500).optional(),
  primaryPriorities: z.tuple([dayTaskSchema, dayTaskSchema, dayTaskSchema]).optional(),
  additionalTasks: z.array(dailyTaskItemSchema).max(30).optional(),
  schedule: z.array(scheduleBlockSchema).max(30).optional(),
  reflection: z.string().max(3000).optional(),
  journal: dailyJournalSchema.optional(),
  expectedUpdatedAt: z.string().optional(),
});

export type UpdateDailyPlanInput = z.infer<typeof updateDailyPlanSchema>;
