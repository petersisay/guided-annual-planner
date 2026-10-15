import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { sessionService } from '../services/session.service';
import { User } from '../models/User';
import { AnnualPlan } from '../models/AnnualPlan';
import { MoodEntry } from '../models/MoodEntry';
import { Habit } from '../models/Habit';
import { Types } from 'mongoose';

describe('Phase 2 — Annual Plan & Tracker Endpoints', () => {
  const app = createApp();
  const validOrigin = 'http://localhost:5173';
  const validCsrf = 'WebApp';

  const userAId = new Types.ObjectId();
  const userBId = new Types.ObjectId();

  const userADoc = {
    _id: userAId,
    email: 'user.a@example.com',
    name: 'User A',
    preferences: {
      weekStart: 'monday',
      weeklyViewDefault: '7day',
      defaultCurrency: 'USD',
      theme: 'paper-warm',
      prefersReducedMotion: false,
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    // Default mock authentication as User A
    vi.spyOn(sessionService, 'validateAndRenewSession').mockResolvedValue({
      session: { userId: userAId } as any,
    });
    vi.spyOn(User, 'findById').mockResolvedValue(userADoc as any);
  });

  describe('Annual Plan Endpoints (/api/v1/planner/year)', () => {
    it('GET /:year returns existing annual plan for the authenticated user', async () => {
      const mockPlan = {
        _id: new Types.ObjectId(),
        userId: userAId,
        year: 2026,
        themeOrWord: 'Cultivate',
        annualIntentions: ['Daily reflection', 'Read 12 books'],
        annualReview: { celebrations: 'Great consistency' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(AnnualPlan, 'findOne').mockResolvedValue(mockPlan as any);

      const res = await request(app)
        .get('/api/v1/planner/year/2026')
        .set('Cookie', ['planner_session=active_token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.plan.themeOrWord).toBe('Cultivate');
      expect(res.body.plan.annualIntentions).toHaveLength(2);
    });

    it('GET /:year auto-creates default annual plan if one does not exist', async () => {
      vi.spyOn(AnnualPlan, 'findOne').mockResolvedValue(null);
      const createdPlan = {
        _id: new Types.ObjectId(),
        userId: userAId,
        year: 2026,
        themeOrWord: '',
        annualIntentions: [],
        annualReview: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(AnnualPlan, 'create').mockResolvedValue(createdPlan as any);

      const res = await request(app)
        .get('/api/v1/planner/year/2026')
        .set('Cookie', ['planner_session=active_token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.plan.year).toBe(2026);
    });

    it('PUT /:year updates annual theme, intentions, and review with CSRF check', async () => {
      const updatedPlan = {
        _id: new Types.ObjectId(),
        userId: userAId,
        year: 2026,
        themeOrWord: 'Disciplined Growth',
        annualIntentions: ['Write daily'],
        annualReview: { celebrations: 'Finished first draft' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const findUpdateSpy = vi.spyOn(AnnualPlan, 'findOneAndUpdate').mockResolvedValue(updatedPlan as any);

      const res = await request(app)
        .put('/api/v1/planner/year/2026')
        .set('Cookie', ['planner_session=active_token'])
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .send({
          themeOrWord: 'Disciplined Growth',
          annualIntentions: ['Write daily'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.plan.themeOrWord).toBe('Disciplined Growth');
      expect(findUpdateSpy).toHaveBeenCalledWith(
        { userId: userAId, year: 2026 },
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('PUT /:year rejects request missing CSRF header with 403', async () => {
      const res = await request(app)
        .put('/api/v1/planner/year/2026')
        .set('Cookie', ['planner_session=active_token'])
        .set('Origin', validOrigin)
        .send({ themeOrWord: 'Hacked' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_FORBIDDEN');
    });
  });

  describe('Mood Tracker Endpoints (/api/v1/trackers/mood)', () => {
    it('GET /mood/:year fetches mood tiles strictly scoped to authenticated user', async () => {
      const mockMoods = [
        {
          _id: new Types.ObjectId(),
          userId: userAId,
          date: '2026-10-14',
          year: 2026,
          moodKey: 'great',
          colorHex: '#7A9A48',
          label: 'Great',
          note: 'Productive and peaceful morning',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const findSpy = vi.spyOn(MoodEntry, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockMoods),
      } as any);

      const res = await request(app)
        .get('/api/v1/trackers/mood/2026')
        .set('Cookie', ['planner_session=active_token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.moods).toHaveLength(1);
      expect(res.body.moods[0].moodKey).toBe('great');
      expect(findSpy).toHaveBeenCalledWith({ userId: userAId, year: 2026 });
    });

    it('POST /mood upserts a valid mood entry with CSRF header', async () => {
      const savedMood = {
        _id: new Types.ObjectId(),
        userId: userAId,
        date: '2026-10-14',
        year: 2026,
        moodKey: 'peaceful',
        colorHex: '#A2B97E',
        label: 'Peaceful',
        note: 'Walk in the forest',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(MoodEntry, 'findOneAndUpdate').mockResolvedValue(savedMood as any);

      const res = await request(app)
        .post('/api/v1/trackers/mood')
        .set('Cookie', ['planner_session=active_token'])
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .send({
          date: '2026-10-14',
          moodKey: 'peaceful',
          colorHex: '#A2B97E',
          label: 'Peaceful',
          note: 'Walk in the forest',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.mood.label).toBe('Peaceful');
    });

    it('POST /mood rejects invalid date format or color hex with 400', async () => {
      const res = await request(app)
        .post('/api/v1/trackers/mood')
        .set('Cookie', ['planner_session=active_token'])
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .send({
          date: 'invalid-date',
          moodKey: 'peaceful',
          colorHex: 'not-hex',
          label: 'Peaceful',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('DELETE /mood/:date removes the specified day mood entry for authenticated user', async () => {
      const deleteSpy = vi.spyOn(MoodEntry, 'deleteOne').mockResolvedValue({ deletedCount: 1 } as any);

      const res = await request(app)
        .delete('/api/v1/trackers/mood/2026-10-14')
        .set('Cookie', ['planner_session=active_token'])
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(deleteSpy).toHaveBeenCalledWith({ userId: userAId, date: '2026-10-14' });
    });
  });

  describe('Habit Tracker Endpoints (/api/v1/trackers/habits)', () => {
    it('POST /habits creates a new habit scoped to user', async () => {
      const createdHabit = {
        _id: new Types.ObjectId(),
        userId: userAId,
        title: 'Learn Splits',
        colorHex: '#7A9A48',
        activeYear: 2026,
        archived: false,
        completionDates: new Map(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createSpy = vi.spyOn(Habit, 'create').mockResolvedValue(createdHabit as any);

      const res = await request(app)
        .post('/api/v1/trackers/habits')
        .set('Cookie', ['planner_session=active_token'])
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .send({
          title: 'Learn Splits',
          colorHex: '#7A9A48',
          activeYear: 2026,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.habit.title).toBe('Learn Splits');
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userAId,
          title: 'Learn Splits',
        })
      );
    });

    it('POST /habits/:id/toggle toggles completion for a specific calendar date', async () => {
      const habitId = new Types.ObjectId();
      const completionMap = new Map<string, boolean>();

      const mockHabit = {
        _id: habitId,
        userId: userAId,
        title: 'Morning Walk',
        colorHex: '#7A9A48',
        activeYear: 2026,
        archived: false,
        completionDates: completionMap,
        markModified: vi.fn(),
        save: vi.fn().mockResolvedValue(true),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const findAndUpdateSpy = vi.spyOn(Habit, 'findOneAndUpdate').mockImplementation(async (query: any, update: any) => {
        if (update.$set) {
          completionMap.set('2026-10-14', true);
        }
        return mockHabit as any;
      });

      const res = await request(app)
        .post(`/api/v1/trackers/habits/${habitId}/toggle`)
        .set('Cookie', ['planner_session=active_token'])
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .send({
          date: '2026-10-14',
          completed: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.completed).toBe(true);
      expect(mockHabit.completionDates.get('2026-10-14')).toBe(true);
      expect(findAndUpdateSpy).toHaveBeenCalledWith(
        { _id: habitId.toString(), userId: userAId },
        { $set: { 'completionDates.2026-10-14': true } },
        { new: true }
      );
    });

    it('prevents cross-user modification (User A cannot toggle User B habit)', async () => {
      const otherUserHabitId = new Types.ObjectId();

      // Query looking for habitId owned by userAId returns null because it belongs to userB!
      vi.spyOn(Habit, 'findOneAndUpdate').mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/v1/trackers/habits/${otherUserHabitId}/toggle`)
        .set('Cookie', ['planner_session=active_token'])
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .send({
          date: '2026-10-14',
          completed: true,
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('DELETE /habits/:id deletes habit only if owned by authenticated user', async () => {
      const habitId = new Types.ObjectId();
      const deleteSpy = vi.spyOn(Habit, 'deleteOne').mockResolvedValue({ deletedCount: 1 } as any);

      const res = await request(app)
        .delete(`/api/v1/trackers/habits/${habitId}`)
        .set('Cookie', ['planner_session=active_token'])
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(deleteSpy).toHaveBeenCalledWith({ _id: habitId.toString(), userId: userAId });
    });
  });
});
