import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { sessionService } from '../services/session.service';
import { User } from '../models/User';
import { AnnualPlan } from '../models/AnnualPlan';
import { MonthlyPlan } from '../models/MonthlyPlan';
import { WeeklyPlan } from '../models/WeeklyPlan';
import { DailyPlan } from '../models/DailyPlan';
import { MoodEntry } from '../models/MoodEntry';
import { Habit } from '../models/Habit';
import { Types } from 'mongoose';
import { BACKUP_FORMAT_IDENTIFIER, BACKUP_SCHEMA_VERSION, plannerBackupSchema } from '@planner/shared';

describe('Backup & Restore Endpoints (/api/v1/planner/backup)', () => {
  const app = createApp();
  const validOrigin = 'http://localhost:5173';
  const validCsrf = 'WebApp';

  const userAId = new Types.ObjectId();

  const mockUserDoc: any = {
    _id: userAId,
    email: 'user.a@example.com',
    name: 'Sara Tesfaye',
    preferences: {
      weekStart: 'monday',
      weeklyViewDefault: '7day',
      defaultCurrency: 'USD',
      theme: 'paper-warm',
      prefersReducedMotion: false,
      onboardingStatus: 'completed',
      onboardingStep: 4,
      defaultYear: 2026,
    },
    save: vi.fn().mockResolvedValue(true),
  };

  const validSampleBackup = {
    metadata: {
      format: BACKUP_FORMAT_IDENTIFIER,
      version: BACKUP_SCHEMA_VERSION,
      exportedAt: '2026-10-15T00:00:00.000Z',
      appVersion: '1.0.0',
      counts: {
        annualPlans: 1,
        monthlyPlans: 1,
        weeklyPlans: 1,
        dailyPlans: 1,
        moods: 1,
        habits: 1,
      },
    },
    preferences: {
      weekStart: 'sunday' as const,
      weeklyViewDefault: '5day' as const,
      defaultCurrency: 'EUR',
      theme: 'paper-editorial' as const,
      prefersReducedMotion: true,
      onboardingStatus: 'completed' as const,
      onboardingStep: 4,
      defaultYear: 2026,
    },
    annualPlans: [
      {
        year: 2026,
        themeOrWord: 'Resilience',
        annualIntentions: ['Write book', 'Meditate daily', 'Run half-marathon'],
        annualReview: {
          celebrations: 'Completed manuscript',
          obstaclesEncountered: 'Time management',
          keyLessonsLearned: 'Patience and consistency',
        },
      },
    ],
    monthlyPlans: [
      {
        year: 2026,
        month: 10,
        mustDos: [{ id: '00000000-0000-0000-0000-000000000001', text: 'Finish chapter 3', checked: false }],
        newHabits: ['Morning Pages'],
        toBuy: [{ id: '00000000-0000-0000-0000-000000000002', text: 'Stationery', checked: false }],
        books: [{ id: '00000000-0000-0000-0000-000000000003', title: 'Deep Work', author: 'Cal Newport', colorHex: '#7A9A48', read: true }],
        selfChangeReflection: 'Prepare draft review',
        calendarNotes: { '2026-10-15': 'Key milestone' },
      },
    ],
    weeklyPlans: [
      {
        year: 2026,
        isoWeek: 42,
        priorities: [{ id: '00000000-0000-0000-0000-000000000004', text: 'Submit draft', done: true }],
        days: [
          {
            date: '2026-10-15',
            tasks: [
              { id: '00000000-0000-0000-0000-000000000005', text: '5 pages', done: true },
              { id: '00000000-0000-0000-0000-000000000006', text: 'Edit draft', done: false },
              { id: '00000000-0000-0000-0000-000000000007', text: 'Outline next section', done: false },
            ],
          },
        ],
        reminder: 'Check ink levels',
        nextWeek: ['Editor call'],
        notes: 'Great weekly momentum',
      },
    ],
    dailyPlans: [
      {
        date: '2026-10-15',
        year: 2026,
        month: 10,
        isoWeek: 42,
        intention: 'Quiet focus',
        primaryPriorities: [
          { id: '00000000-0000-0000-0000-000000000006', text: 'Write 1500 words', done: true },
          { id: '00000000-0000-0000-0000-000000000007', text: 'Review notes', done: false },
          { id: '00000000-0000-0000-0000-000000000008', text: 'Evening stroll', done: false },
        ],
        additionalTasks: [{ id: '00000000-0000-0000-0000-000000000009', text: 'Call editor', done: true }],
        schedule: [{ id: '00000000-0000-0000-0000-000000000010', timeSlot: '09:00 AM', activity: 'Writing block', done: true }],
        reflection: 'Productive and peaceful',
        journal: {
          gratitude: ['Silence', 'Fresh coffee', 'Clarity'] as [string, string, string],
          wins: 'Finished section 2',
          challengesAndLessons: 'Limit phone checks',
          freeWriting: 'Flow was good today.',
        },
      },
    ],
    moods: [
      {
        date: '2026-10-15',
        year: 2026,
        moodKey: 'radiant',
        colorHex: '#7A9A48',
        label: 'Radiant',
        note: 'Energized',
      },
    ],
    habits: [
      {
        title: 'Morning Pages',
        colorHex: '#7A9A48',
        activeYear: 2026,
        archived: false,
        completionDates: ['2026-10-15'],
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(sessionService, 'validateAndRenewSession').mockResolvedValue({
      session: { userId: userAId } as any,
    });
    vi.spyOn(User, 'findById').mockResolvedValue(mockUserDoc);
  });

  describe('Authentication & Security', () => {
    it('GET /export rejects unauthenticated requests with HTTP 401', async () => {
      vi.spyOn(sessionService, 'validateAndRenewSession').mockResolvedValue(null);

      const res = await request(app).get('/api/v1/planner/backup/export');
      expect(res.status).toBe(401);
    });

    it('POST /validate rejects requests without valid CSRF header with HTTP 403', async () => {
      const res = await request(app)
        .post('/api/v1/planner/backup/validate')
        .set('Origin', validOrigin)
        .set('Cookie', ['planner_session=valid_token'])
        .send(validSampleBackup);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/planner/backup/export', () => {
    it('exports all 7 categories belonging to authenticated user with valid metadata', async () => {
      const annualFindSpy = vi.spyOn(AnnualPlan, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              year: 2026,
              themeOrWord: 'Clarity',
              annualIntentions: ['Goal 1'],
              annualReview: { celebrations: 'Great progress' },
            },
          ]),
        }),
      } as any);

      const monthlyFindSpy = vi.spyOn(MonthlyPlan, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              year: 2026,
              month: 10,
              mustDos: [],
              newHabits: [],
              toBuy: [],
              books: [],
              calendarNotes: new Map([['2026-10-15', 'Deadline']]),
            },
          ]),
        }),
      } as any);

      vi.spyOn(WeeklyPlan, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      vi.spyOn(DailyPlan, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      vi.spyOn(MoodEntry, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      vi.spyOn(Habit, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              title: 'Read 20m',
              activeYear: 2026,
              colorHex: '#3B6E44',
              archived: false,
              completionDates: new Map([['2026-10-15', true]]),
            },
          ]),
        }),
      } as any);

      const res = await request(app)
        .get('/api/v1/planner/backup/export')
        .set('Cookie', ['planner_session=valid_token']);

      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('guided-annual-planner-backup-');

      expect(res.body.metadata.format).toBe(BACKUP_FORMAT_IDENTIFIER);
      expect(res.body.metadata.version).toBe(BACKUP_SCHEMA_VERSION);
      expect(res.body.metadata.counts.annualPlans).toBe(1);
      expect(res.body.metadata.counts.monthlyPlans).toBe(1);
      expect(res.body.metadata.counts.habits).toBe(1);

      // Verify user scoping was enforced
      expect(annualFindSpy).toHaveBeenCalledWith({ userId: userAId });
      expect(monthlyFindSpy).toHaveBeenCalledWith({ userId: userAId });

      // Verify schema conformance
      const parseResult = plannerBackupSchema.safeParse(res.body);
      expect(parseResult.success).toBe(true);

      // Verify habit completionDates was converted to array
      expect(res.body.habits[0].completionDates).toEqual(['2026-10-15']);
      // Verify monthly calendarNotes was serialized to object
      expect(res.body.monthlyPlans[0].calendarNotes).toEqual({ '2026-10-15': 'Deadline' });
    });
  });

  describe('POST /api/v1/planner/backup/validate', () => {
    it('accepts valid backup and returns preview statistics', async () => {
      const res = await request(app)
        .post('/api/v1/planner/backup/validate')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=valid_token'])
        .send(validSampleBackup);

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.metadata.format).toBe(BACKUP_FORMAT_IDENTIFIER);
      expect(res.body.metadata.version).toBe(BACKUP_SCHEMA_VERSION);
      expect(res.body.counts.annualPlans).toBe(1);
      expect(res.body.counts.dailyPlans).toBe(1);
      expect(res.body.warnings).toHaveLength(0);
    });

    it('rejects backup with invalid format identifier', async () => {
      const invalidBackup = {
        ...validSampleBackup,
        metadata: {
          ...validSampleBackup.metadata,
          format: 'generic-calendar-export',
        },
      };

      const res = await request(app)
        .post('/api/v1/planner/backup/validate')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=valid_token'])
        .send(invalidBackup);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body.error)).toContain('format');
    });

    it('rejects backup containing credential leaks', async () => {
      const leakedBackup = {
        ...validSampleBackup,
        stolenPasswordHash: '$2b$10$abcdefg1234567890',
      };

      const res = await request(app)
        .post('/api/v1/planner/backup/validate')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=valid_token'])
        .send(leakedBackup);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body.error)).toMatch(/credential|disallowed|security/i);
    });

    it('rejects backup with invalid dates', async () => {
      const invalidDateBackup = {
        ...validSampleBackup,
        dailyPlans: [
          {
            ...validSampleBackup.dailyPlans[0],
            date: 'not-a-valid-date',
          },
        ],
      };

      const res = await request(app)
        .post('/api/v1/planner/backup/validate')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=valid_token'])
        .send(invalidDateBackup);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/planner/backup/restore', () => {
    it('restores in merge mode without wiping existing records', async () => {
      // Mock existing records
      vi.spyOn(AnnualPlan, 'findOne').mockResolvedValue(null);
      const annualCreateSpy = vi.spyOn(AnnualPlan, 'create').mockResolvedValue([{} as any] as any);

      vi.spyOn(MonthlyPlan, 'findOne').mockResolvedValue(null);
      const monthlyCreateSpy = vi.spyOn(MonthlyPlan, 'create').mockResolvedValue([{} as any] as any);

      vi.spyOn(WeeklyPlan, 'findOne').mockResolvedValue(null);
      const weeklyCreateSpy = vi.spyOn(WeeklyPlan, 'create').mockResolvedValue([{} as any] as any);

      vi.spyOn(DailyPlan, 'findOne').mockResolvedValue(null);
      const dailyCreateSpy = vi.spyOn(DailyPlan, 'create').mockResolvedValue([{} as any] as any);

      vi.spyOn(MoodEntry, 'findOne').mockResolvedValue(null);
      const moodCreateSpy = vi.spyOn(MoodEntry, 'create').mockResolvedValue([{} as any] as any);

      vi.spyOn(Habit, 'findOne').mockResolvedValue(null);
      const habitCreateSpy = vi.spyOn(Habit, 'create').mockResolvedValue([{} as any] as any);

      const deleteManySpy = vi.spyOn(DailyPlan, 'deleteMany');

      const res = await request(app)
        .post('/api/v1/planner/backup/restore')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=valid_token'])
        .send({
          backup: validSampleBackup,
          mode: 'merge',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.mode).toBe('merge');
      expect(res.body.restoredCounts.annualPlans).toBe(1);
      expect(res.body.restoredCounts.dailyPlans).toBe(1);

      // Verify no deleteMany was invoked during merge
      expect(deleteManySpy).not.toHaveBeenCalled();

      // Verify that userAId was injected into created documents
      expect(annualCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ userId: userAId, year: 2026 })
      );
      expect(dailyCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ userId: userAId, date: '2026-10-15' })
      );
    });

    it('rejects replace mode when confirmReplace is missing or false', async () => {
      const res = await request(app)
        .post('/api/v1/planner/backup/restore')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=valid_token'])
        .send({
          backup: validSampleBackup,
          mode: 'replace',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/confirm/i);
    });

    it('restores in replace mode by safely wiping planner documents while preserving user credentials', async () => {
      // Mock existing planner docs for rollback snapshot
      vi.spyOn(AnnualPlan, 'find').mockReturnValue({ lean: vi.fn().mockResolvedValue([]) } as any);
      vi.spyOn(MonthlyPlan, 'find').mockReturnValue({ lean: vi.fn().mockResolvedValue([]) } as any);
      vi.spyOn(WeeklyPlan, 'find').mockReturnValue({ lean: vi.fn().mockResolvedValue([]) } as any);
      vi.spyOn(DailyPlan, 'find').mockReturnValue({ lean: vi.fn().mockResolvedValue([]) } as any);
      vi.spyOn(MoodEntry, 'find').mockReturnValue({ lean: vi.fn().mockResolvedValue([]) } as any);
      vi.spyOn(Habit, 'find').mockReturnValue({ lean: vi.fn().mockResolvedValue([]) } as any);

      const annualDeleteSpy = vi.spyOn(AnnualPlan, 'deleteMany').mockResolvedValue({} as any);
      const monthlyDeleteSpy = vi.spyOn(MonthlyPlan, 'deleteMany').mockResolvedValue({} as any);
      const weeklyDeleteSpy = vi.spyOn(WeeklyPlan, 'deleteMany').mockResolvedValue({} as any);
      const dailyDeleteSpy = vi.spyOn(DailyPlan, 'deleteMany').mockResolvedValue({} as any);
      const moodDeleteSpy = vi.spyOn(MoodEntry, 'deleteMany').mockResolvedValue({} as any);
      const habitDeleteSpy = vi.spyOn(Habit, 'deleteMany').mockResolvedValue({} as any);
      const userDeleteSpy = vi.spyOn(User, 'deleteMany');

      vi.spyOn(AnnualPlan, 'insertMany').mockResolvedValue([] as any);
      vi.spyOn(MonthlyPlan, 'insertMany').mockResolvedValue([] as any);
      vi.spyOn(WeeklyPlan, 'insertMany').mockResolvedValue([] as any);
      vi.spyOn(DailyPlan, 'insertMany').mockResolvedValue([] as any);
      vi.spyOn(MoodEntry, 'insertMany').mockResolvedValue([] as any);
      vi.spyOn(Habit, 'insertMany').mockResolvedValue([] as any);
      vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/planner/backup/restore')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrf)
        .set('Cookie', ['planner_session=valid_token'])
        .send({
          backup: validSampleBackup,
          mode: 'replace',
          confirmReplace: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.mode).toBe('replace');

      // Verify planner collections were cleaned for userAId only
      expect(annualDeleteSpy).toHaveBeenCalledWith({ userId: userAId });
      expect(monthlyDeleteSpy).toHaveBeenCalledWith({ userId: userAId });
      expect(weeklyDeleteSpy).toHaveBeenCalledWith({ userId: userAId });
      expect(dailyDeleteSpy).toHaveBeenCalledWith({ userId: userAId });
      expect(moodDeleteSpy).toHaveBeenCalledWith({ userId: userAId });
      expect(habitDeleteSpy).toHaveBeenCalledWith({ userId: userAId });

      // CRITICAL: Verify User collection was NEVER deleted
      expect(userDeleteSpy).not.toHaveBeenCalled();
    });
  });
});
