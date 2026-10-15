import { Response, NextFunction } from 'express';
import { annualPlanUpdateSchema, AnnualPlan as IAnnualPlanDto } from '@planner/shared';
import { AnnualPlan, IAnnualPlanDocument } from '../models/AnnualPlan';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

function mapAnnualPlanToDto(doc: IAnnualPlanDocument): IAnnualPlanDto {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    year: doc.year,
    themeOrWord: doc.themeOrWord,
    annualIntentions: doc.annualIntentions || [],
    annualReview: doc.annualReview || {},
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export class AnnualController {
  async getAnnualPlan(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const year = parseInt(String(req.params.year), 10);
      if (isNaN(year) || year < 2000 || year > 2100) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_YEAR', message: 'Invalid calendar year provided' },
        });
        return;
      }

      const userId = req.user!._id;

      // Find or create initial annual plan container
      let plan = await AnnualPlan.findOne({ userId, year });

      if (!plan) {
        try {
          plan = await AnnualPlan.create({
            userId,
            year,
            annualIntentions: [],
            annualReview: {},
          });
        } catch (createErr: any) {
          if (createErr?.code === 11000) {
            plan = await AnnualPlan.findOne({ userId, year });
            if (!plan) throw createErr;
          } else {
            throw createErr;
          }
        }
      }

      res.status(200).json({
        success: true,
        plan: mapAnnualPlanToDto(plan),
      });
    } catch (err) {
      next(err);
    }
  }

  async updateAnnualPlan(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const year = parseInt(String(req.params.year), 10);
      if (isNaN(year) || year < 2000 || year > 2100) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_YEAR', message: 'Invalid calendar year provided' },
        });
        return;
      }

      const updates = annualPlanUpdateSchema.parse(req.body);
      const userId = req.user!._id;

      const setPayload = {
        ...(updates.themeOrWord !== undefined && { themeOrWord: updates.themeOrWord }),
        ...(updates.annualIntentions !== undefined && { annualIntentions: updates.annualIntentions }),
        ...(updates.annualReview !== undefined && { annualReview: updates.annualReview }),
      };

      let plan: IAnnualPlanDocument | null = null;
      if (updates.expectedUpdatedAt) {
        const expectedDate = new Date(updates.expectedUpdatedAt);
        plan = await AnnualPlan.findOneAndUpdate(
          { userId, year, updatedAt: expectedDate },
          { $set: setPayload },
          { new: true }
        );

        if (!plan) {
          const existing = await AnnualPlan.findOne({ userId, year });
          if (existing) {
            res.status(409).json({
              success: false,
              error: {
                code: 'CONCURRENT_MODIFICATION_CONFLICT',
                message: 'This annual plan was modified by another session or device since you opened it.',
                conflictReason: 'MODIFIED_ON_SERVER',
                serverVersion: mapAnnualPlanToDto(existing),
              },
            });
            return;
          } else {
            res.status(409).json({
              success: false,
              error: {
                code: 'RECORD_DELETED_ON_SERVER',
                message: 'This annual plan no longer exists on the server.',
                conflictReason: 'RECORD_DELETED_ON_SERVER',
              },
            });
            return;
          }
        }
      } else {
        try {
          plan = await AnnualPlan.findOneAndUpdate(
            { userId, year },
            {
              $set: setPayload,
              $setOnInsert: { userId, year },
            },
            { new: true, upsert: true }
          );
        } catch (upsertErr: any) {
          if (upsertErr?.code === 11000) {
            plan = await AnnualPlan.findOneAndUpdate(
              { userId, year },
              { $set: setPayload },
              { new: true }
            );
          } else {
            throw upsertErr;
          }
        }
      }

      if (!plan) {
        throw new Error('Annual plan could not be updated');
      }

      res.status(200).json({
        success: true,
        plan: mapAnnualPlanToDto(plan),
      });
    } catch (err) {
      next(err);
    }
  }
}

export const annualController = new AnnualController();
