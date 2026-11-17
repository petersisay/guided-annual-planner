import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { sessionService } from '../services/session.service.js';
import { User } from '../models/User.js';
import { DailyPlan } from '../models/DailyPlan.js';
import { WeeklyPlan } from '../models/WeeklyPlan.js';
import { MonthlyPlan } from '../models/MonthlyPlan.js';
import { AnnualPlan } from '../models/AnnualPlan.js';
import { ProcessedMutation } from '../models/ProcessedMutation.js';
import { Types } from 'mongoose';

describe('Concurrency Control & Idempotency Safeguards', () => {
  const app = createApp();
  const validOrigin = 'http://localhost:5173';
  const validCsrf = 'WebApp';

  const userAId = new Types.ObjectId();
  const userADoc = {
    _id: userAId,
    email: 'sarah@example.com',
    name: 'Sarah Planner',
  };

  const userBId = new Types.ObjectId();
  const userBDoc = {
    _id: userBId,
    email: 'alex@example.com',
    name: 'Alex Co-Planner',
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(sessionService, 'validateAndRenewSession').mockImplementation(async (token) => {
      if (token === 'user-b-session') {
        return { session: { userId: userBId } };
      }
      return { session: { userId: userAId } };
    });

    vi.spyOn(User, 'findById').mockImplementation(async (id) => {
      if (id?.toString() === userBId.toString()) {
        return userBDoc;
      }
      return userADoc;
    });

    vi.spyOn(WeeklyPlan, 'findOne').mockResolvedValue(null);
  });

  describe('Optimistic Concurrency Control (HTTP 409 Conflict)', () => {
    it('Daily Plan: returns 409 CONCURRENT_MODIFICATION_CONFLICT if updatedAt diverged', async () => {
      const serverDate = new Date('2026-10-15T12:00:00.000Z');
      const clientStaleDate = new Date('2026-10-15T11:00:00.000Z').toISOString();

      vi.spyOn(DailyPlan, 'findOneAndUpdate').mockResolvedValue(null);

      vi.spyOn(DailyPlan, 'findOne').mockResolvedValue({
        _id: new Types.ObjectId(),
        userId: userAId,
        date: '2026-10-15',
        year: 2026,
        month: 10,
        isoWeek: 42,
        intention: 'Updated from Laptop',
        primaryPriorities: [],
        additionalTasks: [],
        schedule: [],
        reflection: 'New server reflection',
        journal: { gratitude: [], wins: '', challengesAndLessons: '', freeWriting: '' },
        createdAt: new Date('2026-10-15T08:00:00.000Z'),
        updatedAt: serverDate,
      });

      const res = await request(app)
        .put('/api/v1/planner/daily/2026-10-15')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=active_token'])
        .send({
          intention: 'Stale update from Phone',
          expectedUpdatedAt: clientStaleDate,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONCURRENT_MODIFICATION_CONFLICT');
      expect(res.body.error.conflictReason).toBe('MODIFIED_ON_SERVER');
      expect(res.body.error.serverVersion).toBeDefined();
      expect(res.body.error.serverVersion.intention).toBe('Updated from Laptop');
    });

    it('Daily Plan: returns 409 RECORD_DELETED_ON_SERVER if record was deleted', async () => {
      const clientStaleDate = new Date('2026-10-15T11:00:00.000Z').toISOString();

      vi.spyOn(DailyPlan, 'findOneAndUpdate').mockResolvedValue(null);
      vi.spyOn(DailyPlan, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .put('/api/v1/planner/daily/2026-10-15')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=active_token'])
        .send({
          intention: 'Attempting to save deleted record',
          expectedUpdatedAt: clientStaleDate,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RECORD_DELETED_ON_SERVER');
    });

    it('Weekly Plan: returns 409 CONCURRENT_MODIFICATION_CONFLICT on version divergence', async () => {
      const clientStaleDate = new Date('2026-10-15T10:00:00.000Z').toISOString();

      vi.spyOn(WeeklyPlan, 'findOneAndUpdate').mockResolvedValue(null);
      vi.spyOn(WeeklyPlan, 'findOne').mockResolvedValue({
        _id: new Types.ObjectId(),
        userId: userAId,
        year: 2026,
        isoWeek: 42,
        priorities: ['Server Priority 1'],
        reminder: 'Server reminder',
        nextWeek: [],
        days: [],
        notes: 'Server notes',
        createdAt: new Date('2026-10-15T08:00:00.000Z'),
        updatedAt: new Date('2026-10-15T12:00:00.000Z'),
      });

      const res = await request(app)
        .put('/api/v1/planner/weekly/2026/42')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=active_token'])
        .send({
          notes: 'Client local notes',
          expectedUpdatedAt: clientStaleDate,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONCURRENT_MODIFICATION_CONFLICT');
      expect(res.body.error.serverVersion.notes).toBe('Server notes');
    });

    it('Monthly Plan: returns 409 CONCURRENT_MODIFICATION_CONFLICT on version divergence', async () => {
      const clientStaleDate = new Date('2026-10-15T10:00:00.000Z').toISOString();

      vi.spyOn(MonthlyPlan, 'findOneAndUpdate').mockResolvedValue(null);
      vi.spyOn(MonthlyPlan, 'findOne').mockResolvedValue({
        _id: new Types.ObjectId(),
        userId: userAId,
        year: 2026,
        month: 10,
        mustDos: [{ id: '11111111-1111-1111-1111-111111111111', text: 'Server Task', checked: false }],
        newHabits: [],
        toBuy: [],
        books: [],
        selfChangeReflection: '',
        calendarNotes: new Map(),
        createdAt: new Date('2026-10-15T08:00:00.000Z'),
        updatedAt: new Date('2026-10-15T12:00:00.000Z'),
      });

      const res = await request(app)
        .put('/api/v1/planner/monthly/2026/10')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=active_token'])
        .send({
          mustDos: [{ id: '11111111-1111-1111-1111-111111111111', text: 'Client Task', checked: false }],
          expectedUpdatedAt: clientStaleDate,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONCURRENT_MODIFICATION_CONFLICT');
    });

    it('Annual Plan: returns 409 CONCURRENT_MODIFICATION_CONFLICT on version divergence', async () => {
      const clientStaleDate = new Date('2026-10-15T10:00:00.000Z').toISOString();

      vi.spyOn(AnnualPlan, 'findOneAndUpdate').mockResolvedValue(null);
      vi.spyOn(AnnualPlan, 'findOne').mockResolvedValue({
        _id: new Types.ObjectId(),
        userId: userAId,
        year: 2026,
        themeOrWord: 'Resilience',
        annualIntentions: [],
        annualReview: {},
        createdAt: new Date('2026-10-15T08:00:00.000Z'),
        updatedAt: new Date('2026-10-15T12:00:00.000Z'),
      });

      const res = await request(app)
        .put('/api/v1/planner/year/2026')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=active_token'])
        .send({
          themeOrWord: 'Growth',
          expectedUpdatedAt: clientStaleDate,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONCURRENT_MODIFICATION_CONFLICT');
      expect(res.body.error.serverVersion.themeOrWord).toBe('Resilience');
    });
  });

  describe('Server-Enforced Idempotency (X-Mutation-Id)', () => {
    it('processes first request normally and stores mutation record', async () => {
      const mutationId = 'mut-test-12345';
      const updatedDate = new Date('2026-10-15T12:00:00.000Z');

      vi.spyOn(ProcessedMutation, 'findOne').mockResolvedValue(null);
      const createSpy = vi.spyOn(ProcessedMutation, 'create').mockResolvedValue({});

      vi.spyOn(DailyPlan, 'findOneAndUpdate').mockResolvedValue({
        _id: new Types.ObjectId(),
        userId: userAId,
        date: '2026-10-15',
        year: 2026,
        month: 10,
        isoWeek: 42,
        intention: 'Saved via mutation',
        primaryPriorities: [],
        additionalTasks: [],
        schedule: [],
        reflection: '',
        journal: { gratitude: [], wins: '', challengesAndLessons: '', freeWriting: '' },
        createdAt: updatedDate,
        updatedAt: updatedDate,
      });

      const res = await request(app)
        .put('/api/v1/planner/daily/2026-10-15')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=active_token'])
        .set('X-Mutation-Id', mutationId)
        .send({
          intention: 'Saved via mutation',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.header['x-idempotent-replay']).toBeUndefined();
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userAId,
          mutationId,
          status: 'in_progress',
        })
      );
    });

    it('replays cached response when duplicate X-Mutation-Id is received', async () => {
      const mutationId = 'mut-test-already-done';
      const cachedResponseBody = {
        success: true,
        plan: {
          id: 'test-plan-id',
          userId: userAId.toString(),
          date: '2026-10-15',
          intention: 'Cached response',
        },
      };

      vi.spyOn(ProcessedMutation, 'findOne').mockResolvedValue({
        userId: userAId,
        mutationId,
        endpoint: '/api/v1/planner/daily/2026-10-15',
        method: 'PUT',
        status: 'completed',
        statusCode: 200,
        responseBody: cachedResponseBody,
        createdAt: new Date(),
      });

      const updateSpy = vi.spyOn(DailyPlan, 'findOneAndUpdate');

      const res = await request(app)
        .put('/api/v1/planner/daily/2026-10-15')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=active_token'])
        .set('X-Mutation-Id', mutationId)
        .send({
          intention: 'Will not execute again',
        });

      expect(res.status).toBe(200);
      expect(res.header['x-idempotent-replay']).toBe('true');
      expect(res.body).toEqual(cachedResponseBody);
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('rejects concurrent duplicate mutation with HTTP 409 MUTATION_IN_PROGRESS', async () => {
      const mutationId = 'mut-in-flight-race';

      vi.spyOn(ProcessedMutation, 'findOne').mockResolvedValue({
        userId: userAId,
        mutationId,
        endpoint: '/api/v1/planner/daily/2026-10-15',
        method: 'PUT',
        status: 'in_progress',
        createdAt: new Date(),
      });

      const res = await request(app)
        .put('/api/v1/planner/daily/2026-10-15')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=active_token'])
        .set('X-Mutation-Id', mutationId)
        .send({
          intention: 'Attempting concurrent write with same mutation ID',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MUTATION_IN_PROGRESS');
    });

    it('rejects mutation ID reuse across different endpoints with HTTP 400 MUTATION_ID_REUSE_MISMATCH', async () => {
      const mutationId = 'reused-mutation-id';

      vi.spyOn(ProcessedMutation, 'findOne').mockResolvedValue({
        userId: userAId,
        mutationId,
        endpoint: '/api/v1/planner/daily/2026-10-14',
        method: 'PUT',
        status: 'completed',
        statusCode: 200,
        responseBody: { success: true },
        createdAt: new Date(),
      });

      const res = await request(app)
        .put('/api/v1/planner/daily/2026-10-15')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=active_token'])
        .set('X-Mutation-Id', mutationId)
        .send({
          intention: 'Reuse attempt on different endpoint',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MUTATION_ID_REUSE_MISMATCH');
    });

    it('isolates mutations per-user: user B mutation ID does not match user A query', async () => {
      const mutationId = 'shared-uuid-different-users';

      const findSpy = vi.spyOn(ProcessedMutation, 'findOne').mockImplementation(async (query) => {
        if (query.userId.toString() === userBId.toString()) {
          return null;
        }
        return {
          userId: userAId,
          mutationId,
          status: 'completed',
          statusCode: 200,
          responseBody: { success: true, plan: { intention: 'User A intention' } },
        };
      });

      vi.spyOn(DailyPlan, 'findOneAndUpdate').mockResolvedValue({
        _id: new Types.ObjectId(),
        userId: userBId,
        date: '2026-10-15',
        year: 2026,
        month: 10,
        isoWeek: 42,
        intention: 'User B intention',
        primaryPriorities: [],
        additionalTasks: [],
        schedule: [],
        reflection: '',
        journal: { gratitude: [], wins: '', challengesAndLessons: '', freeWriting: '' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const createSpy = vi.spyOn(ProcessedMutation, 'create').mockResolvedValue({});

      const res = await request(app)
        .put('/api/v1/planner/daily/2026-10-15')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=user-b-session'])
        .set('X-Mutation-Id', mutationId)
        .send({
          intention: 'User B intention',
        });

      expect(res.status).toBe(200);
      expect(res.header['x-idempotent-replay']).toBeUndefined();
      expect(findSpy).toHaveBeenCalledWith({ userId: userBId, mutationId });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userBId,
          mutationId,
          status: 'in_progress',
        })
      );
    });

    it('rejects mutation ID reuse with a different payload with HTTP 400 MUTATION_PAYLOAD_MISMATCH', async () => {
      const mutationId = 'mut-payload-reuse-test';
      const existingHash = 'hash-of-original-payload';

      vi.spyOn(ProcessedMutation, 'findOne').mockResolvedValue({
        userId: userAId,
        mutationId,
        endpoint: '/api/v1/planner/daily/2026-10-15',
        method: 'PUT',
        requestHash: existingHash,
        status: 'completed',
        statusCode: 200,
        responseBody: { success: true },
      });

      const res = await request(app)
        .put('/api/v1/planner/daily/2026-10-15')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=active_token'])
        .set('X-Mutation-Id', mutationId)
        .send({
          intention: 'Different payload intention',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MUTATION_PAYLOAD_MISMATCH');
    });

    it('cleans up reservation when saving cached idempotency response fails, preventing permanent lock', async () => {
      const mutationId = 'mut-failure-injection-test';

      vi.spyOn(ProcessedMutation, 'findOne').mockResolvedValue(null);
      vi.spyOn(ProcessedMutation, 'create').mockResolvedValue({});
      const deleteSpy = vi.spyOn(ProcessedMutation, 'deleteOne').mockResolvedValue({});
      vi.spyOn(ProcessedMutation, 'updateOne').mockRejectedValue(new Error('Disk write error'));

      vi.spyOn(DailyPlan, 'findOneAndUpdate').mockResolvedValue({
        _id: new Types.ObjectId(),
        userId: userAId,
        date: '2026-10-15',
        year: 2026,
        month: 10,
        isoWeek: 42,
        intention: 'Saved via mutation',
        primaryPriorities: [],
        additionalTasks: [],
        schedule: [],
        reflection: '',
        journal: { gratitude: [], wins: '', challengesAndLessons: '', freeWriting: '' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .put('/api/v1/planner/daily/2026-10-15')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=active_token'])
        .set('X-Mutation-Id', mutationId)
        .send({
          intention: 'Saved via mutation',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      await new Promise((r) => setTimeout(r, 10));
      expect(deleteSpy).toHaveBeenCalledWith({ userId: userAId, mutationId });
    });

    it('recovers from stale in_progress lock older than 30 seconds', async () => {
      const mutationId = 'mut-stale-lock-test';
      const staleDate = new Date(Date.now() - 35000);

      vi.spyOn(ProcessedMutation, 'findOne').mockResolvedValue({
        userId: userAId,
        mutationId,
        endpoint: '/api/v1/planner/daily/2026-10-15',
        method: 'PUT',
        status: 'in_progress',
        createdAt: staleDate,
      });
      const deleteSpy = vi.spyOn(ProcessedMutation, 'deleteOne').mockResolvedValue({});
      vi.spyOn(ProcessedMutation, 'create').mockResolvedValue({});

      vi.spyOn(DailyPlan, 'findOneAndUpdate').mockResolvedValue({
        _id: new Types.ObjectId(),
        userId: userAId,
        date: '2026-10-15',
        year: 2026,
        month: 10,
        isoWeek: 42,
        intention: 'Recovered intention',
        primaryPriorities: [],
        additionalTasks: [],
        schedule: [],
        reflection: '',
        journal: { gratitude: [], wins: '', challengesAndLessons: '', freeWriting: '' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .put('/api/v1/planner/daily/2026-10-15')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=active_token'])
        .set('X-Mutation-Id', mutationId)
        .send({
          intention: 'Recovered intention',
        });

      expect(res.status).toBe(200);
      expect(deleteSpy).toHaveBeenCalledWith({ userId: userAId, mutationId });
    });
  });
});
