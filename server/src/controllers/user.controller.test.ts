import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { sessionService } from '../services/session.service';
import { User } from '../models/User';
import { AnnualPlan } from '../models/AnnualPlan';
import { Types } from 'mongoose';

describe('User Controller & Onboarding Endpoints (/api/v1/user)', () => {
  const app = createApp();
  const validOrigin = 'http://localhost:5173';
  const validCsrf = 'WebApp';

  const userAId = new Types.ObjectId();
  const mockUserDoc: any = {
    _id: userAId,
    email: 'user.a@example.com',
    name: 'Peter Sisay',
    googleSub: 'google_sub_123',
    preferences: {
      weekStart: 'monday',
      weeklyViewDefault: '7day',
      defaultCurrency: 'USD',
      theme: 'paper-warm',
      prefersReducedMotion: false,
      onboardingStatus: 'not_started',
      onboardingStep: 1,
      defaultYear: 2026,
    },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    lastLoginAt: new Date('2026-01-01T00:00:00.000Z'),
    save: vi.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(sessionService, 'validateAndRenewSession').mockResolvedValue({
      session: { userId: userAId } as any,
    });
    vi.spyOn(User, 'findById').mockResolvedValue(mockUserDoc);
  });

  it('GET /api/v1/user/preferences returns user profile and preferences', async () => {
    const res = await request(app)
      .get('/api/v1/user/preferences')
      .set('Cookie', ['planner_session=valid_token']);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.preferences.weekStart).toBe('monday');
    expect(res.body.preferences.onboardingStatus).toBe('not_started');
    expect(res.body.user.name).toBe('Peter Sisay');
  });

  it('PUT /api/v1/user/preferences updates weekStart and theme', async () => {
    const res = await request(app)
      .put('/api/v1/user/preferences')
      .set('Origin', validOrigin)
      .set('X-Planner-Client', validCsrf)
      .set('Cookie', ['planner_session=valid_token'])
      .send({
        weekStart: 'sunday',
        theme: 'paper-editorial',
        prefersReducedMotion: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockUserDoc.preferences.weekStart).toBe('sunday');
    expect(mockUserDoc.preferences.theme).toBe('paper-editorial');
    expect(mockUserDoc.preferences.prefersReducedMotion).toBe(true);
    expect(mockUserDoc.save).toHaveBeenCalled();
  });

  it('PUT /api/v1/user/preferences rejects invalid preference values with HTTP 400', async () => {
    const res = await request(app)
      .put('/api/v1/user/preferences')
      .set('Origin', validOrigin)
      .set('X-Planner-Client', validCsrf)
      .set('Cookie', ['planner_session=valid_token'])
      .send({
        weekStart: 'invalid_day',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('PUT /api/v1/user/onboarding marks onboarding as completed and sets annual intention idempotently', async () => {
    const mockAnnualDoc: any = {
      userId: userAId,
      year: 2026,
      themeOrWord: '',
      annualIntentions: [],
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(AnnualPlan, 'findOne').mockResolvedValue(mockAnnualDoc);

    const res = await request(app)
      .put('/api/v1/user/onboarding')
      .set('Origin', validOrigin)
      .set('X-Planner-Client', validCsrf)
      .set('Cookie', ['planner_session=valid_token'])
      .send({
        status: 'completed',
        preferences: {
          weekStart: 'monday',
        },
        annualIntention: {
          year: 2026,
          themeOrWord: 'Deep Roots',
          intentionText: 'Embrace intentional pace',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockUserDoc.preferences.onboardingStatus).toBe('completed');
    expect(mockAnnualDoc.themeOrWord).toBe('Deep Roots');
    expect(mockAnnualDoc.annualIntentions).toContain('Embrace intentional pace');
    expect(mockAnnualDoc.save).toHaveBeenCalled();
  });

  it('PUT /api/v1/user/onboarding does not overwrite existing annual plan data when revisited', async () => {
    const mockExistingAnnualDoc: any = {
      userId: userAId,
      year: 2026,
      themeOrWord: 'Existing Sacred Theme',
      annualIntentions: ['Existing Priority 1'],
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(AnnualPlan, 'findOne').mockResolvedValue(mockExistingAnnualDoc);

    const res = await request(app)
      .put('/api/v1/user/onboarding')
      .set('Origin', validOrigin)
      .set('X-Planner-Client', validCsrf)
      .set('Cookie', ['planner_session=valid_token'])
      .send({
        status: 'completed',
        annualIntention: {
          year: 2026,
          themeOrWord: 'New Suggested Theme',
          intentionText: 'New Priority 2',
        },
      });

    expect(res.status).toBe(200);
    // Preserves existing theme without overwriting it
    expect(mockExistingAnnualDoc.themeOrWord).toBe('Existing Sacred Theme');
    // Appends new intention without wiping existing ones
    expect(mockExistingAnnualDoc.annualIntentions).toEqual(['Existing Priority 1', 'New Priority 2']);
  });

  it('PUT /api/v1/user/onboarding handles skipping onboarding cleanly', async () => {
    const res = await request(app)
      .put('/api/v1/user/onboarding')
      .set('Origin', validOrigin)
      .set('X-Planner-Client', validCsrf)
      .set('Cookie', ['planner_session=valid_token'])
      .send({
        status: 'skipped',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockUserDoc.preferences.onboardingStatus).toBe('skipped');
  });
});
