import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  updateWeeklyPlanSchema,
  WeeklyPlan as IWeeklyPlanDto,
  getWeekDates,
  DayPlan,
  getISOWeeksInYear,
  isValidISOWeek,
} from '@planner/shared';
import { WeeklyPlan, IWeeklyPlanDocument } from '../models/WeeklyPlan';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

function mapWeeklyPlanToDto(doc: IWeeklyPlanDocument): IWeeklyPlanDto {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    year: doc.year,
    isoWeek: doc.isoWeek,
    days: (doc.days || []).map((d) => ({
      date: d.date,
      tasks: [
        d.tasks?.[0] || { id: crypto.randomUUID(), text: '', done: false },
        d.tasks?.[1] || { id: crypto.randomUUID(), text: '', done: false },
        d.tasks?.[2] || { id: crypto.randomUUID(), text: '', done: false },
      ],
    })),
    priorities: doc.priorities || [],
    reminder: doc.reminder || '',
    nextWeek: doc.nextWeek || [],
    notes: doc.notes || '',
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function createDefaultDays(year: number, week: number): DayPlan[] {
  const dates = getWeekDates(year, week);
  return dates.map((date) => ({
    date,
    tasks: [
      { id: crypto.randomUUID(), text: '', done: false },
      { id: crypto.randomUUID(), text: '', done: false },
      { id: crypto.randomUUID(), text: '', done: false },
    ],
  }));
}

export class WeeklyController {
  async getWeeklyPlan(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const year = parseInt(String(req.params.year), 10);
      const week = parseInt(String(req.params.week), 10);

      if (isNaN(year) || year < 2000 || year > 2100) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_YEAR', message: 'Invalid calendar year provided' },
        });
        return;
      }

      const maxWeeks = getISOWeeksInYear(year);
      if (isNaN(week) || !isValidISOWeek(year, week)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_WEEK',
            message: `ISO week must be between 1 and ${maxWeeks} for year ${year}`,
          },
        });
        return;
      }

      const userId = req.user!._id;

      let plan = await WeeklyPlan.findOne({ userId, year, isoWeek: week });
      if (!plan) {
        try {
          plan = await WeeklyPlan.create({
            userId,
            year,
            isoWeek: week,
            days: createDefaultDays(year, week),
            priorities: [],
            reminder: '',
            nextWeek: [],
            notes: '',
          });
        } catch (createErr: any) {
          if (createErr?.code === 11000) {
            plan = await WeeklyPlan.findOne({ userId, year, isoWeek: week });
            if (!plan) throw createErr;
          } else {
            throw createErr;
          }
        }
      }

      res.status(200).json({
        success: true,
        plan: mapWeeklyPlanToDto(plan),
      });
    } catch (err) {
      next(err);
    }
  }

  async updateWeeklyPlan(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const year = parseInt(String(req.params.year), 10);
      const week = parseInt(String(req.params.week), 10);

      if (isNaN(year) || year < 2000 || year > 2100) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_YEAR', message: 'Invalid calendar year provided' },
        });
        return;
      }

      const maxWeeks = getISOWeeksInYear(year);
      if (isNaN(week) || !isValidISOWeek(year, week)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_WEEK',
            message: `ISO week must be between 1 and ${maxWeeks} for year ${year}`,
          },
        });
        return;
      }

      const updates = updateWeeklyPlanSchema.parse(req.body);
      const userId = req.user!._id;

      const setPayload: Record<string, unknown> = {};
      if (updates.days !== undefined) setPayload.days = updates.days;
      if (updates.priorities !== undefined) setPayload.priorities = updates.priorities;
      if (updates.reminder !== undefined) setPayload.reminder = updates.reminder;
      if (updates.nextWeek !== undefined) setPayload.nextWeek = updates.nextWeek;
      if (updates.notes !== undefined) setPayload.notes = updates.notes;

      let plan: IWeeklyPlanDocument | null = null;
      if (updates.expectedUpdatedAt) {
        const expectedDate = new Date(updates.expectedUpdatedAt);
        plan = await WeeklyPlan.findOneAndUpdate(
          { userId, year, isoWeek: week, updatedAt: expectedDate },
          { $set: setPayload },
          { new: true }
        );

        if (!plan) {
          const existing = await WeeklyPlan.findOne({ userId, year, isoWeek: week });
          if (existing) {
            res.status(409).json({
              success: false,
              error: {
                code: 'CONCURRENT_MODIFICATION_CONFLICT',
                message: 'This weekly plan was modified by another session or device since you opened it.',
                conflictReason: 'MODIFIED_ON_SERVER',
                serverVersion: mapWeeklyPlanToDto(existing),
              },
            });
            return;
          } else {
            res.status(409).json({
              success: false,
              error: {
                code: 'RECORD_DELETED_ON_SERVER',
                message: 'This weekly plan no longer exists on the server.',
                conflictReason: 'RECORD_DELETED_ON_SERVER',
              },
            });
            return;
          }
        }
      } else {
        try {
          plan = await WeeklyPlan.findOneAndUpdate(
            { userId, year, isoWeek: week },
            { $set: setPayload },
            { new: true, upsert: true }
          );
        } catch (upsertErr: any) {
          if (upsertErr?.code === 11000) {
            plan = await WeeklyPlan.findOneAndUpdate(
              { userId, year, isoWeek: week },
              { $set: setPayload },
              { new: true }
            );
          } else {
            throw upsertErr;
          }
        }
      }

      if (!plan) {
        throw new Error('Weekly plan could not be updated');
      }

      res.status(200).json({
        success: true,
        plan: mapWeeklyPlanToDto(plan),
      });
    } catch (err) {
      next(err);
    }
  }
}

export const weeklyController = new WeeklyController();
