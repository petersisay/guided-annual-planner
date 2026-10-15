import { Response, NextFunction } from 'express';
import { updateMonthlyPlanSchema, MonthlyPlan as IMonthlyPlanDto } from '@planner/shared';
import { MonthlyPlan, IMonthlyPlanDocument } from '../models/MonthlyPlan';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

function mapMonthlyPlanToDto(doc: IMonthlyPlanDocument): IMonthlyPlanDto {
  const calendarNotesObj: Record<string, string> = {};
  if (doc.calendarNotes instanceof Map) {
    doc.calendarNotes.forEach((val, key) => {
      calendarNotesObj[key] = val;
    });
  } else if (doc.calendarNotes && typeof doc.calendarNotes === 'object') {
    Object.assign(calendarNotesObj, doc.calendarNotes);
  }

  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    year: doc.year,
    month: doc.month,
    mustDos: doc.mustDos || [],
    newHabits: doc.newHabits || [],
    toBuy: doc.toBuy || [],
    books: doc.books || [],
    selfChangeReflection: doc.selfChangeReflection || '',
    calendarNotes: calendarNotesObj,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export class MonthlyController {
  async getMonthlyPlan(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const year = parseInt(String(req.params.year), 10);
      const month = parseInt(String(req.params.month), 10);

      if (isNaN(year) || year < 2000 || year > 2100) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_YEAR', message: 'Invalid calendar year provided' },
        });
        return;
      }

      if (isNaN(month) || month < 1 || month > 12) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_MONTH', message: 'Month must be between 1 and 12' },
        });
        return;
      }

      const userId = req.user!._id;

      let plan = await MonthlyPlan.findOne({ userId, year, month });
      if (!plan) {
        try {
          plan = await MonthlyPlan.create({
            userId,
            year,
            month,
            mustDos: [],
            newHabits: [],
            toBuy: [],
            books: [],
            selfChangeReflection: '',
            calendarNotes: new Map(),
          });
        } catch (createErr: any) {
          if (createErr?.code === 11000) {
            plan = await MonthlyPlan.findOne({ userId, year, month });
            if (!plan) throw createErr;
          } else {
            throw createErr;
          }
        }
      }

      res.status(200).json({
        success: true,
        plan: mapMonthlyPlanToDto(plan),
      });
    } catch (err) {
      next(err);
    }
  }

  async updateMonthlyPlan(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const year = parseInt(String(req.params.year), 10);
      const month = parseInt(String(req.params.month), 10);

      if (isNaN(year) || year < 2000 || year > 2100) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_YEAR', message: 'Invalid calendar year provided' },
        });
        return;
      }

      if (isNaN(month) || month < 1 || month > 12) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_MONTH', message: 'Month must be between 1 and 12' },
        });
        return;
      }

      const updates = updateMonthlyPlanSchema.parse(req.body);
      const userId = req.user!._id;

      const setPayload: Record<string, unknown> = {};
      if (updates.mustDos !== undefined) setPayload.mustDos = updates.mustDos;
      if (updates.newHabits !== undefined) setPayload.newHabits = updates.newHabits;
      if (updates.toBuy !== undefined) setPayload.toBuy = updates.toBuy;
      if (updates.books !== undefined) setPayload.books = updates.books;
      if (updates.selfChangeReflection !== undefined) setPayload.selfChangeReflection = updates.selfChangeReflection;
      if (updates.calendarNotes !== undefined) setPayload.calendarNotes = updates.calendarNotes;

      let plan: IMonthlyPlanDocument | null = null;
      if (updates.expectedUpdatedAt) {
        const expectedDate = new Date(updates.expectedUpdatedAt);
        plan = await MonthlyPlan.findOneAndUpdate(
          { userId, year, month, updatedAt: expectedDate },
          { $set: setPayload },
          { new: true }
        );

        if (!plan) {
          const existing = await MonthlyPlan.findOne({ userId, year, month });
          if (existing) {
            res.status(409).json({
              success: false,
              error: {
                code: 'CONCURRENT_MODIFICATION_CONFLICT',
                message: 'This monthly plan was modified by another session or device since you opened it.',
                conflictReason: 'MODIFIED_ON_SERVER',
                serverVersion: mapMonthlyPlanToDto(existing),
              },
            });
            return;
          } else {
            res.status(409).json({
              success: false,
              error: {
                code: 'RECORD_DELETED_ON_SERVER',
                message: 'This monthly plan no longer exists on the server.',
                conflictReason: 'RECORD_DELETED_ON_SERVER',
              },
            });
            return;
          }
        }
      } else {
        try {
          plan = await MonthlyPlan.findOneAndUpdate(
            { userId, year, month },
            {
              $set: setPayload,
              $setOnInsert: { userId, year, month },
            },
            { new: true, upsert: true }
          );
        } catch (upsertErr: any) {
          if (upsertErr?.code === 11000) {
            plan = await MonthlyPlan.findOneAndUpdate(
              { userId, year, month },
              { $set: setPayload },
              { new: true }
            );
          } else {
            throw upsertErr;
          }
        }
      }

      if (!plan) {
        throw new Error('Monthly plan could not be updated');
      }

      res.status(200).json({
        success: true,
        plan: mapMonthlyPlanToDto(plan),
      });
    } catch (err) {
      next(err);
    }
  }
}

export const monthlyController = new MonthlyController();
