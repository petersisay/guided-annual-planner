import {
  moodEntrySchema,
  habitCreateSchema,
  habitUpdateSchema,
  habitToggleSchema,
} from '@planner/shared';
import { MoodEntry } from '../models/MoodEntry.js';
import { Habit } from '../models/Habit.js';
import { safeIsoDate } from './auth.controller.js';

function mapMoodToDto(doc) {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    date: doc.date,
    year: doc.year,
    moodKey: doc.moodKey,
    colorHex: doc.colorHex,
    label: doc.label,
    note: doc.note,
    updatedAt: safeIsoDate(doc.updatedAt),
  };
}

function mapHabitToDto(doc) {
  const completionDates = {};
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
    createdAt: safeIsoDate(doc.createdAt),
    updatedAt: safeIsoDate(doc.updatedAt),
  };
}

export class TrackerController {
  // --- MOOD TRACKER ENDPOINTS ---

  async getMoodsForYear(req, res, next) {
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
        userId: req.user._id,
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

  async upsertMoodEntry(req, res, next) {
    try {
      const input = moodEntrySchema.parse(req.body);
      const year = parseInt(input.date.slice(0, 4), 10);
      const userId = req.user._id;

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

  async deleteMoodEntry(req, res, next) {
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
        userId: req.user._id,
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

  async getHabits(req, res, next) {
    try {
      const yearParam = req.query.year;
      const year = yearParam ? parseInt(String(yearParam), 10) : new Date().getFullYear();

      const habits = await Habit.find({
        userId: req.user._id,
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

  async createHabit(req, res, next) {
    try {
      const input = habitCreateSchema.parse(req.body);
      const userId = req.user._id;

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

  async updateHabit(req, res, next) {
    try {
      const { id } = req.params;
      const input = habitUpdateSchema.parse(req.body);

      const habit = await Habit.findOne({
        _id: id,
        userId: req.user._id,
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

  async toggleHabitDate(req, res, next) {
    try {
      const { id } = req.params;
      const input = habitToggleSchema.parse(req.body);
      const userId = req.user._id;

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

  async deleteHabit(req, res, next) {
    try {
      const { id } = req.params;
      const result = await Habit.deleteOne({
        _id: id,
        userId: req.user._id,
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
