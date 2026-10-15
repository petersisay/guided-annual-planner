import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  updateDailyPlanSchema,
  DailyPlan as IDailyPlanDto,
  DailyContext,
  isValidDateStr,
  getISOWeekNumber,
  getISOWeekYear,
  DayTask,
} from '@planner/shared';
import { DailyPlan, IDailyPlanDocument } from '../models/DailyPlan';
import { WeeklyPlan } from '../models/WeeklyPlan';
import { MonthlyPlan } from '../models/MonthlyPlan';
import { MoodEntry } from '../models/MoodEntry';
import { Habit } from '../models/Habit';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

function mapDailyPlanToDto(doc: IDailyPlanDocument): IDailyPlanDto {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    date: doc.date,
    year: doc.year,
    month: doc.month,
    isoWeek: doc.isoWeek,
    intention: doc.intention || '',
    primaryPriorities: [
      doc.primaryPriorities?.[0] || { id: crypto.randomUUID(), text: '', done: false },
      doc.primaryPriorities?.[1] || { id: crypto.randomUUID(), text: '', done: false },
      doc.primaryPriorities?.[2] || { id: crypto.randomUUID(), text: '', done: false },
    ],
    additionalTasks: (doc.additionalTasks || []).map((t) => ({
      id: t.id,
      text: t.text,
      done: t.done,
    })),
    schedule: (doc.schedule || []).map((s) => ({
      id: s.id,
      timeSlot: s.timeSlot,
      activity: s.activity,
      done: s.done,
    })),
    reflection: doc.reflection || '',
    journal: {
      gratitude: [
        doc.journal?.gratitude?.[0] || '',
        doc.journal?.gratitude?.[1] || '',
        doc.journal?.gratitude?.[2] || '',
      ],
      wins: doc.journal?.wins || '',
      challengesAndLessons: doc.journal?.challengesAndLessons || '',
      freeWriting: doc.journal?.freeWriting || '',
    },
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

const DEFAULT_SCHEDULE_SLOTS = [
  '08:00 AM',
  '10:00 AM',
  '12:00 PM',
  '02:00 PM',
  '04:00 PM',
  '06:00 PM',
];

export class DailyController {
  async getDailyPlan(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const date = String(req.params.date);

      if (!isValidDateStr(date)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATE',
            message: 'Valid ISO date format YYYY-MM-DD required',
          },
        });
        return;
      }

      const [year, month, day] = date.split('-').map(Number);
      const dateObj = new Date(Date.UTC(year, month - 1, day));
      const isoWeek = getISOWeekNumber(dateObj);
      const isoYear = getISOWeekYear(dateObj);
      const userId = req.user!._id;

      let plan = await DailyPlan.findOne({ userId, date });

      if (!plan) {
        // Check if weekly spread already has tasks for this specific date
        let initialPriorities: [DayTask, DayTask, DayTask] = [
          { id: crypto.randomUUID(), text: '', done: false },
          { id: crypto.randomUUID(), text: '', done: false },
          { id: crypto.randomUUID(), text: '', done: false },
        ];

        try {
          const weeklyPlan = await WeeklyPlan.findOne({ userId, year: isoYear, isoWeek });
          if (weeklyPlan && weeklyPlan.days) {
            const matchingDay = weeklyPlan.days.find((d) => d.date === date);
            if (matchingDay && matchingDay.tasks && matchingDay.tasks.length === 3) {
              initialPriorities = [
                { id: matchingDay.tasks[0].id || crypto.randomUUID(), text: matchingDay.tasks[0].text || '', done: matchingDay.tasks[0].done || false },
                { id: matchingDay.tasks[1].id || crypto.randomUUID(), text: matchingDay.tasks[1].text || '', done: matchingDay.tasks[1].done || false },
                { id: matchingDay.tasks[2].id || crypto.randomUUID(), text: matchingDay.tasks[2].text || '', done: matchingDay.tasks[2].done || false },
              ];
            }
          }
        } catch (err) {
          console.warn('Could not inspect weekly plan for initial daily tasks:', err);
        }

        const initialSchedule = DEFAULT_SCHEDULE_SLOTS.map((timeSlot) => ({
          id: crypto.randomUUID(),
          timeSlot,
          activity: '',
          done: false,
        }));

        try {
          plan = await DailyPlan.create({
            userId,
            date,
            year,
            month,
            isoWeek,
            intention: '',
            primaryPriorities: initialPriorities,
            additionalTasks: [],
            schedule: initialSchedule,
            reflection: '',
            journal: {
              gratitude: ['', '', ''],
              wins: '',
              challengesAndLessons: '',
              freeWriting: '',
            },
          });
        } catch (createErr: any) {
          if (createErr?.code === 11000) {
            plan = await DailyPlan.findOne({ userId, date });
            if (!plan) throw createErr;
          } else {
            throw createErr;
          }
        }
      }

      // Aggregate context data (mood, habits, monthly must-dos) without duplicating source of truth
      const [moodDoc, habitDocs, monthlyDoc] = await Promise.all([
        MoodEntry.findOne({ userId, date }),
        Habit.find({ userId, activeYear: year, archived: { $ne: true } }),
        MonthlyPlan.findOne({ userId, year, month }),
      ]);

      const context: DailyContext = {
        mood: moodDoc
          ? {
              moodKey: moodDoc.moodKey,
              colorHex: moodDoc.colorHex,
              label: moodDoc.label,
              note: moodDoc.note,
            }
          : null,
        habits: habitDocs.map((h) => ({
          id: h._id.toString(),
          title: h.title,
          colorHex: h.colorHex,
          completed: Boolean(h.completionDates?.get(date)),
        })),
        monthlyMustDos: (monthlyDoc?.mustDos || []).map((m) => ({
          id: m.id,
          text: m.text,
          checked: m.checked,
        })),
      };

      res.status(200).json({
        success: true,
        plan: mapDailyPlanToDto(plan),
        context,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateDailyPlan(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const date = String(req.params.date);

      if (!isValidDateStr(date)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATE',
            message: 'Valid ISO date format YYYY-MM-DD required',
          },
        });
        return;
      }

      const updates = updateDailyPlanSchema.parse(req.body);
      const userId = req.user!._id;

      const [year, month, day] = date.split('-').map(Number);
      const dateObj = new Date(Date.UTC(year, month - 1, day));
      const isoWeek = getISOWeekNumber(dateObj);
      const isoYear = getISOWeekYear(dateObj);

      const setPayload: Record<string, unknown> = {};
      if (updates.intention !== undefined) setPayload.intention = updates.intention;
      if (updates.primaryPriorities !== undefined) setPayload.primaryPriorities = updates.primaryPriorities;
      if (updates.additionalTasks !== undefined) setPayload.additionalTasks = updates.additionalTasks;
      if (updates.schedule !== undefined) setPayload.schedule = updates.schedule;
      if (updates.reflection !== undefined) setPayload.reflection = updates.reflection;
      if (updates.journal !== undefined) setPayload.journal = updates.journal;

      let plan: IDailyPlanDocument | null = null;
      if (updates.expectedUpdatedAt) {
        const expectedDate = new Date(updates.expectedUpdatedAt);
        plan = await DailyPlan.findOneAndUpdate(
          { userId, date, updatedAt: expectedDate },
          { $set: setPayload },
          { new: true }
        );

        if (!plan) {
          const existing = await DailyPlan.findOne({ userId, date });
          if (existing) {
            res.status(409).json({
              success: false,
              error: {
                code: 'CONCURRENT_MODIFICATION_CONFLICT',
                message: 'This daily plan was modified by another session or device since you opened it.',
                conflictReason: 'MODIFIED_ON_SERVER',
                serverVersion: mapDailyPlanToDto(existing),
              },
            });
            return;
          } else {
            res.status(409).json({
              success: false,
              error: {
                code: 'RECORD_DELETED_ON_SERVER',
                message: 'This daily plan no longer exists on the server.',
                conflictReason: 'RECORD_DELETED_ON_SERVER',
              },
            });
            return;
          }
        }
      } else {
        try {
          plan = await DailyPlan.findOneAndUpdate(
            { userId, date },
            {
              $set: setPayload,
              $setOnInsert: { userId, date, year, month, isoWeek },
            },
            { new: true, upsert: true }
          );
        } catch (upsertErr: any) {
          if (upsertErr?.code === 11000) {
            plan = await DailyPlan.findOneAndUpdate(
              { userId, date },
              { $set: setPayload },
              { new: true }
            );
          } else {
            throw upsertErr;
          }
        }
      }

      if (!plan) {
        throw new Error('Daily plan could not be updated');
      }

      // Two-way synchronization: If primary priorities were modified, synchronize with WeeklyPlan for this date
      if (updates.primaryPriorities) {
        try {
          const weeklyDoc = await WeeklyPlan.findOne({ userId, year: isoYear, isoWeek });
          if (weeklyDoc && weeklyDoc.days) {
            const dayEntry = weeklyDoc.days.find((d) => d.date === date);
            if (dayEntry) {
              dayEntry.tasks = [
                { id: updates.primaryPriorities[0].id, text: updates.primaryPriorities[0].text, done: updates.primaryPriorities[0].done },
                { id: updates.primaryPriorities[1].id, text: updates.primaryPriorities[1].text, done: updates.primaryPriorities[1].done },
                { id: updates.primaryPriorities[2].id, text: updates.primaryPriorities[2].text, done: updates.primaryPriorities[2].done },
              ];
              await weeklyDoc.save();
            }
          }
        } catch (syncErr) {
          console.warn('Failed to synchronize daily priorities into weekly plan:', syncErr);
        }
      }

      res.status(200).json({
        success: true,
        plan: mapDailyPlanToDto(plan),
      });
    } catch (err) {
      next(err);
    }
  }
}

export const dailyController = new DailyController();
