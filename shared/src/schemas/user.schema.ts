import { z } from 'zod';

export const userPreferencesSchema = z.object({
  weekStart: z.enum(['monday', 'sunday']).default('monday'),
  weeklyViewDefault: z.enum(['7day', '5day']).default('7day'),
  defaultCurrency: z.string().min(1).max(5).default('USD'),
  theme: z.enum(['paper-warm', 'paper-editorial']).default('paper-warm'),
  prefersReducedMotion: z.boolean().default(false),
  onboardingStatus: z.enum(['not_started', 'in_progress', 'completed', 'skipped']).default('not_started'),
  onboardingStep: z.number().int().min(1).max(5).default(1),
  defaultYear: z.number().int().min(2020).max(2099).default(new Date().getFullYear()),
});

export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;

export const updatePreferencesSchema = z.object({
  weekStart: z.enum(['monday', 'sunday']).optional(),
  weeklyViewDefault: z.enum(['7day', '5day']).optional(),
  defaultCurrency: z.string().min(1).max(5).optional(),
  theme: z.enum(['paper-warm', 'paper-editorial']).optional(),
  prefersReducedMotion: z.boolean().optional(),
  onboardingStatus: z.enum(['not_started', 'in_progress', 'completed', 'skipped']).optional(),
  onboardingStep: z.number().int().min(1).max(5).optional(),
  defaultYear: z.number().int().min(2020).max(2099).optional(),
  avatarUrl: z.string().optional(),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

export const completeOnboardingSchema = z.object({
  status: z.enum(['completed', 'skipped']),
  preferences: updatePreferencesSchema.optional(),
  annualIntention: z
    .object({
      year: z.number().int().min(2020).max(2099),
      themeOrWord: z.string().max(100).optional(),
      intentionText: z.string().max(500).optional(),
    })
    .optional(),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;

