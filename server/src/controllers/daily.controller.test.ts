import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { sessionService } from '../services/session.service';
import { User } from '../models/User';
import { DailyPlan } from '../models/DailyPlan';
import { WeeklyPlan } from '../models/WeeklyPlan';
import { MonthlyPlan } from '../models/MonthlyPlan';
import { MoodEntry } from '../models/MoodEntry';
import { Habit } from '../models/Habit';
import { Types } from 'mongoose';

describe('Daily Planner & Journaling Endpoints (/api/v1/planner/daily)', () => {
  const app = createApp();
  const validOrigin = 'http://localhost:5173';
  const validCsrf = 'WebApp';

  const userAId = new Types.ObjectId();
  const userADoc = {
    _id: userAId,
    email: 'user.a@example.com',
    name: 'Sara Tesfaye',
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(sessionService, 'validateAndRenewSession').mockResolvedValue({
      session: { userId: userAId } as any,
    });
    vi.spyOn(User, 'findById').mockResolvedValue(userADoc as any);
    vi.spyOn(WeeklyPlan, 'findOne').mockResolvedValue(null);
  });

  it('GET /:date returns daily plan with context (mood, habits, monthly must-dos)', async () => {
    const mockDaily = {
      _id: new Types.ObjectId(),
      userId: userAId,
      date: '2026-10-15',
      year: 2026,
      month: 10,
      isoWeek: 42,
      intention: 'Write with calm focus',
      primaryPriorities: [
        { id: 'p1', text: 'Draft chapter 1', done: true },
        { id: 'p2', text: 'Review feedback', done: false },
        { id: 'p3', text: 'Publish notes', done: false },
      ],
      additionalTasks: [{ id: 'at1', text: 'Reply to emails', done: true }],
      schedule: [
        { id: 's1', timeSlot: '09:00 AM', activity: 'Writing session', done: true },
        { id: 's2', timeSlot: '02:00 PM', activity: 'Team sync', done: false },
      ],
      reflection: 'Grateful for dedicated deep work time',
      journal: {
        gratitude: ['Morning sunlight', 'Warm tea', 'Creative energy'],
        wins: 'Completed 1,500 words',
        challengesAndLessons: 'Resisted digital distraction',
        freeWriting: 'Flow was effortless once I silenced notifications.',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(DailyPlan, 'findOne').mockResolvedValue(mockDaily as any);
    vi.spyOn(MoodEntry, 'findOne').mockResolvedValue({
      moodKey: 'radiant',
      colorHex: '#7A9A48',
      label: 'Radiant & Energized',
      note: 'Deeply fulfilled',
    } as any);
    vi.spyOn(Habit, 'find').mockResolvedValue([
      {
        _id: new Types.ObjectId(),
        title: 'Morning Meditation',
        colorHex: '#7A9A48',
        completionDates: new Map([['2026-10-15', true]]),
      },
    ] as any);
    vi.spyOn(MonthlyPlan, 'findOne').mockResolvedValue({
      mustDos: [{ id: 'm1', text: 'Complete quarterly manuscript', checked: false }],
    } as any);

    const res = await request(app)
      .get('/api/v1/planner/daily/2026-10-15')
      .set('Cookie', ['planner_session=active_token']);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.plan.date).toBe('2026-10-15');
    expect(res.body.plan.intention).toBe('Write with calm focus');
    expect(res.body.plan.primaryPriorities[0].text).toBe('Draft chapter 1');
    expect(res.body.plan.primaryPriorities[0].done).toBe(true);

    // Context aggregated cleanly without duplicate records
    expect(res.body.context.mood.moodKey).toBe('radiant');
    expect(res.body.context.habits[0].completed).toBe(true);
    expect(res.body.context.monthlyMustDos[0].text).toBe('Complete quarterly manuscript');
  });

  it('GET /:date rejects invalid date strings with HTTP 400 and INVALID_DATE', async () => {
    const res = await request(app)
      .get('/api/v1/planner/daily/2026-02-30')
      .set('Cookie', ['planner_session=active_token']);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_DATE');
  });

  it('PUT /:date updates daily plan and synchronizes priorities with WeeklyPlan', async () => {
    const updatedDailyDoc = {
      _id: new Types.ObjectId(),
      userId: userAId,
      date: '2026-10-15',
      year: 2026,
      month: 10,
      isoWeek: 42,
      intention: 'Grounded progress',
      primaryPriorities: [
        { id: '00000000-0000-0000-0000-000000000001', text: 'Updated Priority 1', done: true },
        { id: '00000000-0000-0000-0000-000000000002', text: 'Updated Priority 2', done: false },
        { id: '00000000-0000-0000-0000-000000000003', text: 'Updated Priority 3', done: false },
      ],
      additionalTasks: [],
      schedule: [],
      reflection: 'Steady work',
      journal: {
        gratitude: ['Quiet studio', 'Good sleep', 'Clarity'],
        wins: 'Priority 1 executed',
        challengesAndLessons: 'Patience rewarded',
        freeWriting: 'Reflective session notes',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(DailyPlan, 'findOneAndUpdate').mockResolvedValue(updatedDailyDoc as any);

    // Weekly sync mock
    const mockWeeklyDoc = {
      days: [
        {
          date: '2026-10-15',
          tasks: [
            { id: 'old-1', text: 'Old Task 1', done: false },
            { id: 'old-2', text: 'Old Task 2', done: false },
            { id: 'old-3', text: 'Old Task 3', done: false },
          ],
        },
      ],
      save: vi.fn().mockResolvedValue(true),
    };
    vi.spyOn(WeeklyPlan, 'findOne').mockResolvedValue(mockWeeklyDoc as any);

    const res = await request(app)
      .put('/api/v1/planner/daily/2026-10-15')
      .set('Origin', validOrigin)
      .set('X-Planner-Client', validCsrf)
      .set('Cookie', ['planner_session=active_token'])
      .send({
        intention: 'Grounded progress',
        primaryPriorities: [
          { id: '00000000-0000-0000-0000-000000000001', text: 'Updated Priority 1', done: true },
          { id: '00000000-0000-0000-0000-000000000002', text: 'Updated Priority 2', done: false },
          { id: '00000000-0000-0000-0000-000000000003', text: 'Updated Priority 3', done: false },
        ],
        journal: {
          gratitude: ['Quiet studio', 'Good sleep', 'Clarity'],
          wins: 'Priority 1 executed',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.plan.intention).toBe('Grounded progress');
    expect(res.body.plan.primaryPriorities[0].text).toBe('Updated Priority 1');
    expect(res.body.plan.primaryPriorities[0].done).toBe(true);

    // Verify weekly plan was synchronized
    expect(mockWeeklyDoc.days[0].tasks[0].text).toBe('Updated Priority 1');
    expect(mockWeeklyDoc.days[0].tasks[0].done).toBe(true);
    expect(mockWeeklyDoc.save).toHaveBeenCalled();
  });

  it('recovers gracefully from MongoDB code 11000 duplicate key error on concurrent daily creation', async () => {
    const mockCreatedDaily = {
      _id: new Types.ObjectId(),
      userId: userAId,
      date: '2026-10-15',
      year: 2026,
      month: 10,
      isoWeek: 42,
      intention: 'Concurrent daily plan',
      primaryPriorities: [
        { id: 'p1', text: '', done: false },
        { id: 'p2', text: '', done: false },
        { id: 'p3', text: '', done: false },
      ],
      additionalTasks: [],
      schedule: [],
      reflection: '',
      journal: { gratitude: ['', '', ''], wins: '', challengesAndLessons: '', freeWriting: '' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const findOneSpy = vi.spyOn(DailyPlan, 'findOne');
    findOneSpy.mockResolvedValueOnce(null).mockResolvedValueOnce(mockCreatedDaily as any);

    const duplicateError: any = new Error('E11000 duplicate key error');
    duplicateError.code = 11000;
    vi.spyOn(DailyPlan, 'create').mockRejectedValueOnce(duplicateError);

    vi.spyOn(MoodEntry, 'findOne').mockResolvedValue(null);
    vi.spyOn(Habit, 'find').mockResolvedValue([]);
    vi.spyOn(MonthlyPlan, 'findOne').mockResolvedValue(null);

    const res = await request(app)
      .get('/api/v1/planner/daily/2026-10-15')
      .set('Cookie', ['planner_session=active_token']);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.plan.intention).toBe('Concurrent daily plan');
  });
});
