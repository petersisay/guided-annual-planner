import { Response, NextFunction } from 'express';
import {
  moodEntrySchema,
  habitCreateSchema,
  habitUpdateSchema,
  habitToggleSchema,
  MoodEntry as IMoodEntryDto,
  Habit as IHabitDto,
} from '@planner/shared';
import { MoodEntry, IMoodEntryDocument } from '../models/MoodEntry';
import { Habit, IHabitDocument } from '../models/Habit';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

function mapMoodToDto(doc: IMoodEntryDocument): IMoodEntryDto {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    date: doc.date,
    year: doc.year,
    moodKey: doc.moodKey,
    colorHex: doc.colorHex,
    label: doc.label,
    note: doc.note,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function mapHabitToDto(doc: IHabitDocument): IHabitDto {
  const completionDates: Record<string, boolean> = {};
  if (doc.completionDates) {
    for (const [k, v] of doc.completionDates.entries()) {
      if (v) {
        completionDates[k] = true;
      }
    }
  }

  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    title: doc.title,
    colorHex: doc.colorHex,
    activeYear: doc.activeYear,
    archived: doc.archived,
    completionDates,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export class TrackerController {
  // --- MOOD TRACKER ENDPOINTS ---

  async getMoodsForYear(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const year = parseInt(String(req.params.year), 10);
      if (isNaN(year) || year < 2000 || year > 2100) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_YEAR', message: 'Invalid year supplied' },
        });
        return;
      }

      const moods = await MoodEntry.find({
        userId: req.user!._id,
        year,
      }).sort({ date: 1 });

      res.status(200).json({
        success: true,
        moods: moods.map(mapMoodToDto),
      });
    } catch (err) {
      next(err);
    }
  }

  async upsertMoodEntry(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const input = moodEntrySchema.parse(req.body);
      const year = parseInt(input.date.slice(0, 4), 10);
      const userId = req.user!._id;

      const mood = await MoodEntry.findOneAndUpdate(
        { userId, date: input.date },
        {
          $set: {
            year,
            moodKey: input.moodKey,
            colorHex: input.colorHex,
            label: input.label,
            note: input.note,
          },
        },
        { new: true, upsert: true }
      );

      res.status(200).json({
        success: true,
        mood: mapMoodToDto(mood),
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteMoodEntry(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const date = String(req.params.date);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_DATE', message: 'Date must be formatted as YYYY-MM-DD' },
        });
        return;
      }

      await MoodEntry.deleteOne({
        userId: req.user!._id,
        date,
      });

      res.status(200).json({
        success: true,
        message: 'Mood entry removed successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  // --- HABIT TRACKER ENDPOINTS ---

  async getHabits(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const yearParam = req.query.year;
      const year = yearParam ? parseInt(String(yearParam), 10) : new Date().getFullYear();

      const habits = await Habit.find({
        userId: req.user!._id,
        activeYear: year,
      }).sort({ createdAt: 1 });

      res.status(200).json({
        success: true,
        habits: habits.map(mapHabitToDto),
      });
    } catch (err) {
      next(err);
    }
  }

  async createHabit(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const input = habitCreateSchema.parse(req.body);
      const userId = req.user!._id;

      const habit = await Habit.create({
        userId,
        title: input.title,
        colorHex: input.colorHex,
        activeYear: input.activeYear,
        completionDates: new Map(),
      });

      res.status(201).json({
        success: true,
        habit: mapHabitToDto(habit),
      });
    } catch (err) {
      next(err);
    }
  }

  async updateHabit(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const input = habitUpdateSchema.parse(req.body);

      const habit = await Habit.findOne({
        _id: id,
        userId: req.user!._id,
      });

      if (!habit) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Habit not found or not owned by user' },
        });
        return;
      }

      if (input.title !== undefined) habit.title = input.title;
      if (input.colorHex !== undefined) habit.colorHex = input.colorHex;
      if (input.archived !== undefined) habit.archived = input.archived;

      await habit.save();

      res.status(200).json({
        success: true,
        habit: mapHabitToDto(habit),
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleHabitDate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const input = habitToggleSchema.parse(req.body);
      const userId = req.user!._id;

      const updateOp = input.completed
        ? { $set: { [`completionDates.${input.date}`]: true } }
        : { $unset: { [`completionDates.${input.date}`]: 1 } };

      const habit = await Habit.findOneAndUpdate(
        { _id: id, userId },
        updateOp,
        { new: true }
      );

      if (!habit) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Habit not found or not owned by user' },
        });
        return;
      }

      const isCompleted = Boolean(habit.completionDates?.get(input.date));

      res.status(200).json({
        success: true,
        completed: isCompleted,
        habit: mapHabitToDto(habit),
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteHabit(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const result = await Habit.deleteOne({
        _id: id,
        userId: req.user!._id,
      });

      if (result.deletedCount === 0) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Habit not found or not owned by user' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Habit deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const trackerController = new TrackerController();
