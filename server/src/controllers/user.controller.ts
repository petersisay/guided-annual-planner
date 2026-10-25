import { Response, NextFunction } from 'express';
import { updatePreferencesSchema, completeOnboardingSchema } from '@planner/shared';
import { User } from '../models/User';
import { AnnualPlan } from '../models/AnnualPlan';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { mapUserToProfile } from './auth.controller';

export class UserController {
  async getPreferences(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        preferences: req.user.preferences,
        user: mapUserToProfile(req.user),
      });
    } catch (err) {
      next(err);
    }
  }

  async updatePreferences(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
        return;
      }

      const updates = updatePreferencesSchema.parse(req.body);
      const user = await User.findById(req.user._id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User account not found' },
        });
        return;
      }

      // Merge only supported preference fields
      if (updates.weekStart !== undefined) user.preferences.weekStart = updates.weekStart;
      if (updates.weeklyViewDefault !== undefined) user.preferences.weeklyViewDefault = updates.weeklyViewDefault;
      if (updates.defaultCurrency !== undefined) user.preferences.defaultCurrency = updates.defaultCurrency;
      if (updates.theme !== undefined) user.preferences.theme = updates.theme;
      if (updates.prefersReducedMotion !== undefined) user.preferences.prefersReducedMotion = updates.prefersReducedMotion;
      if (updates.onboardingStatus !== undefined) user.preferences.onboardingStatus = updates.onboardingStatus;
      if (updates.onboardingStep !== undefined) user.preferences.onboardingStep = updates.onboardingStep;
      if (updates.defaultYear !== undefined) user.preferences.defaultYear = updates.defaultYear;
      if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl;

      await user.save();

      res.status(200).json({
        success: true,
        preferences: user.preferences,
        user: mapUserToProfile(user),
        message: 'Preferences updated successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async completeOnboarding(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
        return;
      }

      const payload = completeOnboardingSchema.parse(req.body);
      const user = await User.findById(req.user._id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User account not found' },
        });
        return;
      }

      user.preferences.onboardingStatus = payload.status;
      user.preferences.onboardingStep = payload.status === 'completed' ? 5 : user.preferences.onboardingStep;

      if (payload.preferences) {
        if (payload.preferences.weekStart !== undefined) user.preferences.weekStart = payload.preferences.weekStart;
        if (payload.preferences.theme !== undefined) user.preferences.theme = payload.preferences.theme;
        if (payload.preferences.prefersReducedMotion !== undefined) user.preferences.prefersReducedMotion = payload.preferences.prefersReducedMotion;
        if (payload.preferences.defaultYear !== undefined) user.preferences.defaultYear = payload.preferences.defaultYear;
      }

      await user.save();

      // Idempotently create or update initial annual intention if provided
      if (payload.annualIntention && payload.annualIntention.year) {
        const { year, themeOrWord, intentionText } = payload.annualIntention;
        const trimmedTheme = themeOrWord?.trim();
        const trimmedIntention = intentionText?.trim();

        if (trimmedTheme || trimmedIntention) {
          try {
            let annualPlan = await AnnualPlan.findOne({ userId: user._id, year });
            if (!annualPlan) {
              try {
                annualPlan = await AnnualPlan.create({
                  userId: user._id,
                  year,
                  themeOrWord: trimmedTheme || '',
                  annualIntentions: trimmedIntention ? [trimmedIntention] : [],
                });
              } catch (createErr: any) {
                if (createErr.code === 11000) {
                  annualPlan = await AnnualPlan.findOne({ userId: user._id, year });
                } else {
                  throw createErr;
                }
              }
            }

            if (annualPlan) {
              let updated = false;
              if (trimmedTheme && !annualPlan.themeOrWord) {
                annualPlan.themeOrWord = trimmedTheme;
                updated = true;
              }
              if (trimmedIntention && !annualPlan.annualIntentions.includes(trimmedIntention)) {
                annualPlan.annualIntentions.push(trimmedIntention);
                updated = true;
              }
              if (updated) {
                await annualPlan.save();
              }
            }
          } catch (planErr) {
            console.warn('Could not persist onboarding annual intention:', planErr);
          }
        }
      }

      res.status(200).json({
        success: true,
        user: mapUserToProfile(user),
        message: payload.status === 'completed' ? 'Onboarding completed' : 'Onboarding skipped',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
