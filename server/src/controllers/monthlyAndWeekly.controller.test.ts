import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { sessionService } from '../services/session.service';
import { User } from '../models/User';
import { MonthlyPlan } from '../models/MonthlyPlan';
import { WeeklyPlan } from '../models/WeeklyPlan';
import { Types } from 'mongoose';

describe('Monthly & Weekly Planner Endpoints', () => {
  const app = createApp();
  const validOrigin = 'http://localhost:5173';
  const validCsrf = 'WebApp';

  const userAId = new Types.ObjectId();
  const userADoc = {
    _id: userAId,
    email: 'user.a@example.com',
    name: 'User A',
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(sessionService, 'validateAndRenewSession').mockResolvedValue({
      session: { userId: userAId } as any,
    });
    vi.spyOn(User, 'findById').mockResolvedValue(userADoc as any);
  });

  describe('Monthly Endpoints (/api/v1/planner/monthly)', () => {
    it('GET /:year/:month returns monthly plan', async () => {
      const mockMonthly = {
        _id: new Types.ObjectId(),
        userId: userAId,
        year: 2026,
        month: 1,
        mustDos: [{ id: '1', text: 'Prepare review', checked: false }],
        newHabits: ['Morning walk'],
        toBuy: [{ id: 'tb1', text: 'Ink', checked: false }],
        books: [{ id: 'b1', title: 'Deep Work', colorHex: '#7A9A48', read: true }],
        selfChangeReflection: 'Focus deeply',
        calendarNotes: new Map([['2026-01-15', 'Workshop']]),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(MonthlyPlan, 'findOne').mockResolvedValue(mockMonthly as any);

      const res = await request(app)
        .get('/api/v1/planner/monthly/2026/1')
        .set('Cookie', ['planner_session=active_token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.plan.year).toBe(2026);
      expect(res.body.plan.month).toBe(1);
      expect(res.body.plan.mustDos[0].text).toBe('Prepare review');
      expect(res.body.plan.calendarNotes['2026-01-15']).toBe('Workshop');
    });

    it('PUT /:year/:month updates monthly plan with CSRF verification', async () => {
      const updatedDoc = {
        _id: new Types.ObjectId(),
        userId: userAId,
        year: 2026,
        month: 1,
        mustDos: [],
        newHabits: ['Evening reading'],
        toBuy: [],
        books: [],
        selfChangeReflection: 'More patience',
        calendarNotes: new Map(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(MonthlyPlan, 'findOneAndUpdate').mockResolvedValue(updatedDoc as any);

      const res = await request(app)
        .put('/api/v1/planner/monthly/2026/1')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=active_token'])
        .send({
          newHabits: ['Evening reading'],
          selfChangeReflection: 'More patience',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.plan.selfChangeReflection).toBe('More patience');
    });

    it('PUT /:year/:month persists bookshelf reading-status changes', async () => {
      const bookId = '00000000-0000-0000-0000-000000000002';
      const updatedBooksDoc = {
        _id: new Types.ObjectId(),
        userId: userAId,
        year: 2026,
        month: 1,
        mustDos: [],
        newHabits: [],
        toBuy: [],
        books: [
          {
            id: bookId,
            title: 'The Psychology of Money',
            author: 'Morgan Housel',
            colorHex: '#7A9A48',
            read: true,
          },
        ],
        selfChangeReflection: '',
        calendarNotes: new Map(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const findOneAndUpdateSpy = vi
        .spyOn(MonthlyPlan, 'findOneAndUpdate')
        .mockResolvedValue(updatedBooksDoc as any);

      const res = await request(app)
        .put('/api/v1/planner/monthly/2026/1')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=active_token'])
        .send({
          books: [
            {
              id: bookId,
              title: 'The Psychology of Money',
              author: 'Morgan Housel',
              colorHex: '#7A9A48',
              read: true,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.plan.books[0].read).toBe(true);
      expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
        { userId: userAId, year: 2026, month: 1 },
        expect.objectContaining({
          $set: expect.objectContaining({
            books: expect.arrayContaining([
              expect.objectContaining({ id: bookId, read: true }),
            ]),
          }),
        }),
        expect.anything()
      );
    });
  });

  describe('Weekly Endpoints (/api/v1/planner/weekly)', () => {
    it('GET /:year/:week returns weekly plan', async () => {
      const mockWeekly = {
        _id: new Types.ObjectId(),
        userId: userAId,
        year: 2026,
        isoWeek: 2,
        days: [
          {
            date: '2026-01-05',
            tasks: [
              { id: '1', text: 'Task A', done: false },
              { id: '2', text: '', done: false },
              { id: '3', text: '', done: false },
            ],
          },
        ],
        priorities: [{ id: 'p1', text: 'Priority A', done: false }],
        reminder: 'Reminder A',
        nextWeek: ['Next week focus'],
        notes: 'Notes content',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(WeeklyPlan, 'findOne').mockResolvedValue(mockWeekly as any);

      const res = await request(app)
        .get('/api/v1/planner/weekly/2026/2')
        .set('Cookie', ['planner_session=active_token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.plan.isoWeek).toBe(2);
      expect(res.body.plan.reminder).toBe('Reminder A');
    });

    it('PUT /:year/:week updates weekly priorities and notes with CSRF verification', async () => {
      const updatedDoc = {
        _id: new Types.ObjectId(),
        userId: userAId,
        year: 2026,
        isoWeek: 2,
        days: [],
        priorities: [{ id: '00000000-0000-0000-0000-000000000001', text: 'Priority 1', done: true }],
        reminder: 'Remember keys',
        nextWeek: [],
        notes: 'Updated notes',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(WeeklyPlan, 'findOneAndUpdate').mockResolvedValue(updatedDoc as any);

      const res = await request(app)
        .put('/api/v1/planner/weekly/2026/2')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=active_token'])
        .send({
          priorities: [{ id: '00000000-0000-0000-0000-000000000001', text: 'Priority 1', done: true }],
          notes: 'Updated notes',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.plan.notes).toBe('Updated notes');
    });

    it('rejects week 53 for a 52-week year with HTTP 400 and INVALID_WEEK', async () => {
      // 2025 has only 52 ISO weeks
      const resGet = await request(app)
        .get('/api/v1/planner/weekly/2025/53')
        .set('Cookie', ['planner_session=active_token']);

      expect(resGet.status).toBe(400);
      expect(resGet.body.success).toBe(false);
      expect(resGet.body.error.code).toBe('INVALID_WEEK');
      expect(resGet.body.error.message).toContain('ISO week must be between 1 and 52 for year 2025');

      const resPut = await request(app)
        .put('/api/v1/planner/weekly/2025/53')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=active_token'])
        .send({ notes: 'Invalid week note' });

      expect(resPut.status).toBe(400);
      expect(resPut.body.success).toBe(false);
      expect(resPut.body.error.code).toBe('INVALID_WEEK');
    });

    it('allows week 53 for a 53-week year', async () => {
      // 2026 has 53 ISO weeks
      const mockWeekly = {
        _id: new Types.ObjectId(),
        userId: userAId,
        year: 2026,
        isoWeek: 53,
        days: [],
        priorities: [],
        reminder: '',
        nextWeek: [],
        notes: 'Week 53 Notes',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(WeeklyPlan, 'findOne').mockResolvedValue(mockWeekly as any);

      const res = await request(app)
        .get('/api/v1/planner/weekly/2026/53')
        .set('Cookie', ['planner_session=active_token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.plan.isoWeek).toBe(53);
    });

    it('recovers gracefully if concurrent first-time plan creation produces code 11000 duplicate key error', async () => {
      const mockCreatedPlan = {
        _id: new Types.ObjectId(),
        userId: userAId,
        year: 2026,
        isoWeek: 10,
        days: [],
        priorities: [],
        reminder: '',
        nextWeek: [],
        notes: 'Concurrently created plan',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // First findOne returns null, create throws duplicate key error 11000, second findOne returns doc
      const findOneSpy = vi.spyOn(WeeklyPlan, 'findOne');
      findOneSpy.mockResolvedValueOnce(null).mockResolvedValueOnce(mockCreatedPlan as any);

      const duplicateKeyError: any = new Error('E11000 duplicate key error');
      duplicateKeyError.code = 11000;
      vi.spyOn(WeeklyPlan, 'create').mockRejectedValueOnce(duplicateKeyError);

      const res = await request(app)
        .get('/api/v1/planner/weekly/2026/10')
        .set('Cookie', ['planner_session=active_token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.plan.notes).toBe('Concurrently created plan');
    });

    it('returns useful client-safe error response on Zod validation errors', async () => {
      const res = await request(app)
        .put('/api/v1/planner/weekly/2026/2')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=active_token'])
        .send({
          // notes exceeded max length (5000 characters)
          notes: 'A'.repeat(5001),
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toBe('The submitted data failed validation requirements');
      expect(Array.isArray(res.body.error.details)).toBe(true);
      expect(res.body.error.details.some((d: any) => d.field === 'notes')).toBe(true);
    });
  });
});
