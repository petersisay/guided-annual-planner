import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  BACKUP_FORMAT_IDENTIFIER,
  BACKUP_SCHEMA_VERSION,
  PlannerBackupData,
  BackupRecordCounts,
  plannerBackupSchema,
  restoreRequestSchema,
  RestoreResult,
} from '@planner/shared';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { User } from '../models/User';
import { AnnualPlan } from '../models/AnnualPlan';
import { MonthlyPlan } from '../models/MonthlyPlan';
import { WeeklyPlan } from '../models/WeeklyPlan';
import { DailyPlan } from '../models/DailyPlan';
import { MoodEntry } from '../models/MoodEntry';
import { Habit } from '../models/Habit';

export class BackupController {
  /**
   * Generates a complete, consistent server snapshot of all planner data owned by the user.
   */
  async exportBackup(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id;

      // Query all user-owned data in parallel
      const [
        userDoc,
        annualDocs,
        monthlyDocs,
        weeklyDocs,
        dailyDocs,
        moodDocs,
        habitDocs,
      ] = await Promise.all([
        User.findById(userId),
        AnnualPlan.find({ userId }).sort({ year: 1 }).lean(),
        MonthlyPlan.find({ userId }).sort({ year: 1, month: 1 }).lean(),
        WeeklyPlan.find({ userId }).sort({ year: 1, isoWeek: 1 }).lean(),
        DailyPlan.find({ userId }).sort({ date: 1 }).lean(),
        MoodEntry.find({ userId }).sort({ date: 1 }).lean(),
        Habit.find({ userId }).sort({ activeYear: 1, title: 1 }).lean(),
      ]);

      // Sanitize Annual Plans
      const annualPlans = annualDocs.map((doc: any) => ({
        year: doc.year,
        themeOrWord: doc.themeOrWord || '',
        annualIntentions: doc.annualIntentions || [],
        annualReview: doc.annualReview
          ? {
              celebrations: doc.annualReview.celebrations || '',
              obstaclesEncountered: doc.annualReview.obstaclesEncountered || '',
              keyLessonsLearned: doc.annualReview.keyLessonsLearned || '',
              completedAt: doc.annualReview.completedAt,
            }
          : undefined,
      }));

      // Sanitize Monthly Plans
      const monthlyPlans = monthlyDocs.map((doc: any) => {
        let calendarNotes: Record<string, string> = {};
        if (doc.calendarNotes instanceof Map) {
          calendarNotes = Object.fromEntries(doc.calendarNotes.entries());
        } else if (doc.calendarNotes && typeof doc.calendarNotes === 'object') {
          calendarNotes = { ...doc.calendarNotes };
        }

        return {
          year: doc.year,
          month: doc.month,
          mustDos: (doc.mustDos || []).map((m: any) => ({
            id: m.id,
            text: m.text || '',
            checked: Boolean(m.checked),
          })),
          newHabits: doc.newHabits || [],
          toBuy: (doc.toBuy || []).map((b: any) => ({
            id: b.id,
            text: b.text || '',
            checked: Boolean(b.checked),
          })),
          books: (doc.books || []).map((b: any) => ({
            id: b.id,
            title: b.title || '',
            author: b.author || '',
            colorHex: b.colorHex || '#7A9A48',
            read: Boolean(b.read),
          })),
          selfChangeReflection: doc.selfChangeReflection || '',
          calendarNotes,
        };
      });

      // Sanitize Weekly Plans
      const weeklyPlans = weeklyDocs.map((doc: any) => ({
        year: doc.year,
        isoWeek: doc.isoWeek,
        days: (doc.days || []).map((d: any) => {
          const rawTasks = (d.tasks || []).map((t: any) => ({
            id: t.id || crypto.randomUUID(),
            text: t.text || '',
            done: Boolean(t.done),
          }));
          while (rawTasks.length < 3) {
            rawTasks.push({
              id: crypto.randomUUID(),
              text: '',
              done: false,
            });
          }
          return {
            date: d.date,
            tasks: rawTasks.slice(0, 3) as [any, any, any],
          };
        }),
        priorities: (doc.priorities || []).map((p: any) => ({
          id: p.id,
          text: p.text || '',
          done: Boolean(p.done),
        })),
        reminder: doc.reminder || '',
        nextWeek: doc.nextWeek || [],
        notes: doc.notes || '',
      }));

      // Sanitize Daily Plans
      const dailyPlans = dailyDocs.map((doc: any) => ({
        date: doc.date,
        year: doc.year,
        month: doc.month,
        isoWeek: doc.isoWeek,
        intention: doc.intention || '',
        primaryPriorities: (doc.primaryPriorities || []).map((p: any) => ({
          id: p.id,
          text: p.text || '',
          done: Boolean(p.done),
        })),
        additionalTasks: (doc.additionalTasks || []).map((t: any) => ({
          id: t.id,
          text: t.text || '',
          done: Boolean(t.done),
        })),
        schedule: (doc.schedule || []).map((s: any) => ({
          id: s.id,
          timeSlot: s.timeSlot,
          activity: s.activity || '',
          done: Boolean(s.done),
        })),
        reflection: doc.reflection || '',
        journal: {
          gratitude: [
            doc.journal?.gratitude?.[0] || '',
            doc.journal?.gratitude?.[1] || '',
            doc.journal?.gratitude?.[2] || '',
          ] as [string, string, string],
          wins: doc.journal?.wins || '',
          challengesAndLessons: doc.journal?.challengesAndLessons || '',
          freeWriting: doc.journal?.freeWriting || '',
        },
      }));

      // Sanitize Moods
      const moods = moodDocs.map((doc: any) => ({
        date: doc.date,
        year: doc.year,
        moodKey: doc.moodKey,
        colorHex: doc.colorHex,
        label: doc.label,
        note: doc.note || '',
      }));

      // Sanitize Habits
      const habits = habitDocs.map((doc: any) => {
        let completionDates: string[] = [];
        if (doc.completionDates instanceof Map) {
          completionDates = Array.from(doc.completionDates.keys());
        } else if (doc.completionDates && typeof doc.completionDates === 'object') {
          completionDates = Object.keys(doc.completionDates);
        }

        return {
          title: doc.title,
          colorHex: doc.colorHex,
          activeYear: doc.activeYear,
          archived: Boolean(doc.archived),
          completionDates: completionDates.sort(),
        };
      });

      const counts: BackupRecordCounts = {
        annualPlans: annualPlans.length,
        monthlyPlans: monthlyPlans.length,
        weeklyPlans: weeklyPlans.length,
        dailyPlans: dailyPlans.length,
        moods: moods.length,
        habits: habits.length,
      };

      const backup: PlannerBackupData = {
        metadata: {
          format: BACKUP_FORMAT_IDENTIFIER,
          version: BACKUP_SCHEMA_VERSION,
          exportedAt: new Date().toISOString(),
          appVersion: '1.0.0',
          counts,
        },
        preferences: userDoc?.preferences,
        annualPlans,
        monthlyPlans,
        weeklyPlans,
        dailyPlans,
        moods,
        habits,
      };

      const dateStr = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="guided-annual-planner-backup-${dateStr}.json"`
      );
      res.status(200).json(backup);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Validates a backup JSON payload without modifying any database records.
   */
  async validateBackup(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parsed = plannerBackupSchema.parse(req.body);

      const warnings: string[] = [];
      const actualCounts: BackupRecordCounts = {
        annualPlans: parsed.annualPlans.length,
        monthlyPlans: parsed.monthlyPlans.length,
        weeklyPlans: parsed.weeklyPlans.length,
        dailyPlans: parsed.dailyPlans.length,
        moods: parsed.moods.length,
        habits: parsed.habits.length,
      };

      if (parsed.metadata.counts) {
        if (parsed.metadata.counts.dailyPlans !== actualCounts.dailyPlans) {
          warnings.push(
            `Declared daily plans (${parsed.metadata.counts.dailyPlans}) differs from actual count (${actualCounts.dailyPlans}).`
          );
        }
      }

      res.status(200).json({
        success: true,
        valid: true,
        metadata: parsed.metadata,
        counts: actualCounts,
        warnings,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Restores a validated backup into the user's account using either merge or full replacement.
   */
  async restoreBackup(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id;
      const { mode, confirmReplace, backup } = restoreRequestSchema.parse(req.body);

      if (mode === 'replace' && !confirmReplace) {
        res.status(400).json({
          success: false,
          error: {
            code: 'CONFIRMATION_REQUIRED',
            message: 'Full replacement requires explicit confirmation.',
          },
        });
        return;
      }

      // Take a safety snapshot of current data before replacement for rollback capability
      const previousSnapshot =
        mode === 'replace'
          ? await Promise.all([
              AnnualPlan.find({ userId }).lean(),
              MonthlyPlan.find({ userId }).lean(),
              WeeklyPlan.find({ userId }).lean(),
              DailyPlan.find({ userId }).lean(),
              MoodEntry.find({ userId }).lean(),
              Habit.find({ userId }).lean(),
            ])
          : null;

      const restoredCounts: BackupRecordCounts = {
        annualPlans: 0,
        monthlyPlans: 0,
        weeklyPlans: 0,
        dailyPlans: 0,
        moods: 0,
        habits: 0,
      };

      const skippedCounts: Partial<BackupRecordCounts> = {};
      const mergedCounts: Partial<BackupRecordCounts> = {};

      if (mode === 'replace') {
        try {
          // Destructively replace only planner records owned strictly by this user
          await Promise.all([
            AnnualPlan.deleteMany({ userId }),
            MonthlyPlan.deleteMany({ userId }),
            WeeklyPlan.deleteMany({ userId }),
            DailyPlan.deleteMany({ userId }),
            MoodEntry.deleteMany({ userId }),
            Habit.deleteMany({ userId }),
          ]);

          // Insert all entities fresh, enforcing user ownership
          if (backup.annualPlans.length > 0) {
            await AnnualPlan.insertMany(
              backup.annualPlans.map((p) => ({ ...p, userId }))
            );
            restoredCounts.annualPlans = backup.annualPlans.length;
          }

          if (backup.monthlyPlans.length > 0) {
            await MonthlyPlan.insertMany(
              backup.monthlyPlans.map((p) => ({
                ...p,
                userId,
                calendarNotes: new Map(Object.entries(p.calendarNotes || {})),
              }))
            );
            restoredCounts.monthlyPlans = backup.monthlyPlans.length;
          }

          if (backup.weeklyPlans.length > 0) {
            await WeeklyPlan.insertMany(
              backup.weeklyPlans.map((p) => ({ ...p, userId }))
            );
            restoredCounts.weeklyPlans = backup.weeklyPlans.length;
          }

          if (backup.dailyPlans.length > 0) {
            await DailyPlan.insertMany(
              backup.dailyPlans.map((p) => ({ ...p, userId }))
            );
            restoredCounts.dailyPlans = backup.dailyPlans.length;
          }

          if (backup.moods.length > 0) {
            await MoodEntry.insertMany(
              backup.moods.map((m) => ({ ...m, userId }))
            );
            restoredCounts.moods = backup.moods.length;
          }

          if (backup.habits.length > 0) {
            await Habit.insertMany(
              backup.habits.map((h) => ({
                ...h,
                userId,
                completionDates: new Map(h.completionDates.map((d) => [d, true])),
              }))
            );
            restoredCounts.habits = backup.habits.length;
          }

          // Optionally restore preferences if provided
          if (backup.preferences) {
            await User.findByIdAndUpdate(userId, {
              $set: {
                'preferences.weekStart': backup.preferences.weekStart,
                'preferences.theme': backup.preferences.theme,
                'preferences.prefersReducedMotion': backup.preferences.prefersReducedMotion,
              },
            });
          }
        } catch (replaceErr) {
          // If standalone and insertion failed, perform rollback using pre-replacement snapshot
          console.error('Error during full replacement, initiating rollback:', replaceErr);
          if (previousSnapshot) {
            try {
              const [ann, mon, wk, dy, md, hb] = previousSnapshot;
              if (ann.length) await AnnualPlan.insertMany(ann);
              if (mon.length) await MonthlyPlan.insertMany(mon);
              if (wk.length) await WeeklyPlan.insertMany(wk);
              if (dy.length) await DailyPlan.insertMany(dy);
              if (md.length) await MoodEntry.insertMany(md);
              if (hb.length) await Habit.insertMany(hb);
            } catch (rbErr) {
              console.error('Rollback failed:', rbErr);
            }
          }
          throw replaceErr;
        }
      } else {
        // MERGE MODE: non-destructive merge using natural unique keys
        // 1. Annual Plans (unique key: userId + year)
        for (const ap of backup.annualPlans) {
          const existing = await AnnualPlan.findOne({ userId, year: ap.year });
          if (!existing) {
            await AnnualPlan.create({ ...ap, userId });
            restoredCounts.annualPlans++;
          } else {
            let changed = false;
            if (ap.themeOrWord && !existing.themeOrWord) {
              existing.themeOrWord = ap.themeOrWord;
              changed = true;
            }
            for (const intention of ap.annualIntentions) {
              if (!existing.annualIntentions.includes(intention)) {
                existing.annualIntentions.push(intention);
                changed = true;
              }
            }
            if (changed) {
              await existing.save();
              mergedCounts.annualPlans = (mergedCounts.annualPlans || 0) + 1;
            } else {
              skippedCounts.annualPlans = (skippedCounts.annualPlans || 0) + 1;
            }
          }
        }

        // 2. Monthly Plans (unique key: userId + year + month)
        for (const mp of backup.monthlyPlans) {
          const existing = await MonthlyPlan.findOne({
            userId,
            year: mp.year,
            month: mp.month,
          });
          if (!existing) {
            await MonthlyPlan.create({
              ...mp,
              userId,
              calendarNotes: new Map(Object.entries(mp.calendarNotes || {})),
            });
            restoredCounts.monthlyPlans++;
          } else {
            let changed = false;
            // Merge must-dos by text
            const existingMustDoTexts = new Set(existing.mustDos.map((m) => m.text));
            for (const item of mp.mustDos) {
              if (item.text && !existingMustDoTexts.has(item.text)) {
                existing.mustDos.push(item);
                existingMustDoTexts.add(item.text);
                changed = true;
              }
            }
            // Merge books
            const existingBookTitles = new Set(existing.books.map((b) => b.title));
            for (const book of mp.books) {
              if (book.title && !existingBookTitles.has(book.title)) {
                existing.books.push(book);
                existingBookTitles.add(book.title);
                changed = true;
              }
            }
            if (changed) {
              await existing.save();
              mergedCounts.monthlyPlans = (mergedCounts.monthlyPlans || 0) + 1;
            } else {
              skippedCounts.monthlyPlans = (skippedCounts.monthlyPlans || 0) + 1;
            }
          }
        }

        // 3. Weekly Plans (unique key: userId + year + isoWeek)
        for (const wp of backup.weeklyPlans) {
          const existing = await WeeklyPlan.findOne({
            userId,
            year: wp.year,
            isoWeek: wp.isoWeek,
          });
          if (!existing) {
            await WeeklyPlan.create({ ...wp, userId });
            restoredCounts.weeklyPlans++;
          } else {
            let changed = false;
            if (wp.reminder && !existing.reminder) {
              existing.reminder = wp.reminder;
              changed = true;
            }
            if (wp.notes && !existing.notes) {
              existing.notes = wp.notes;
              changed = true;
            }
            if (changed) {
              await existing.save();
              mergedCounts.weeklyPlans = (mergedCounts.weeklyPlans || 0) + 1;
            } else {
              skippedCounts.weeklyPlans = (skippedCounts.weeklyPlans || 0) + 1;
            }
          }
        }

        // 4. Daily Plans (unique key: userId + date)
        for (const dp of backup.dailyPlans) {
          const existing = await DailyPlan.findOne({ userId, date: dp.date });
          if (!existing) {
            await DailyPlan.create({ ...dp, userId });
            restoredCounts.dailyPlans++;
          } else {
            let changed = false;
            if (dp.intention && !existing.intention) {
              existing.intention = dp.intention;
              changed = true;
            }
            if (dp.reflection && !existing.reflection) {
              existing.reflection = dp.reflection;
              changed = true;
            }
            if (changed) {
              await existing.save();
              mergedCounts.dailyPlans = (mergedCounts.dailyPlans || 0) + 1;
            } else {
              skippedCounts.dailyPlans = (skippedCounts.dailyPlans || 0) + 1;
            }
          }
        }

        // 5. Mood Entries (unique key: userId + date)
        for (const m of backup.moods) {
          const existing = await MoodEntry.findOne({ userId, date: m.date });
          if (!existing) {
            await MoodEntry.create({ ...m, userId });
            restoredCounts.moods++;
          } else {
            skippedCounts.moods = (skippedCounts.moods || 0) + 1;
          }
        }

        // 6. Habits (merge by title and activeYear)
        for (const h of backup.habits) {
          const existing = await Habit.findOne({
            userId,
            activeYear: h.activeYear,
            title: h.title,
          });
          if (!existing) {
            await Habit.create({
              ...h,
              userId,
              completionDates: new Map(h.completionDates.map((d) => [d, true])),
            });
            restoredCounts.habits++;
          } else {
            let changed = false;
            for (const dateStr of h.completionDates) {
              if (!existing.completionDates.get(dateStr)) {
                existing.completionDates.set(dateStr, true);
                changed = true;
              }
            }
            if (changed) {
              await existing.save();
              mergedCounts.habits = (mergedCounts.habits || 0) + 1;
            } else {
              skippedCounts.habits = (skippedCounts.habits || 0) + 1;
            }
          }
        }
      }

      const result: RestoreResult = {
        success: true,
        mode,
        restoredCounts,
        skippedCounts,
        mergedCounts,
        message:
          mode === 'replace'
            ? 'Complete replacement restored successfully.'
            : 'Non-destructive merge completed successfully.',
      };

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const backupController = new BackupController();
