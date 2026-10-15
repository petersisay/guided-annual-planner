import { z } from 'zod';

export const annualReviewSchema = z.object({
  celebrations: z.string().max(2000).optional(),
  obstaclesEncountered: z.string().max(2000).optional(),
  keyLessonsLearned: z.string().max(2000).optional(),
  completedAt: z.string().optional(),
});

export const annualPlanUpdateSchema = z.object({
  themeOrWord: z.string().max(100).optional(),
  annualIntentions: z.array(z.string().max(200)).max(10).optional(),
  annualReview: annualReviewSchema.optional(),
  expectedUpdatedAt: z.string().optional(),
});

export type AnnualPlanUpdateInput = z.infer<typeof annualPlanUpdateSchema>;
