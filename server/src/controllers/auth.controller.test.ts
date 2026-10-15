import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { googleAuthService } from '../services/googleAuth.service';
import { sessionService } from '../services/session.service';
import { User } from '../models/User';
import { Types } from 'mongoose';
import { env } from '../config/env';

describe('AuthController, CSRF Protection & Identity Conflict Tests', () => {
  const app = createApp();
  const validOrigin = 'http://localhost:5173';
  const validCsrfHeader = 'WebApp';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('FIX 2 — Explicit Server-Side CSRF Protection', () => {
    it('allows safe GET requests without CSRF custom header or Origin', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('rejects state-changing POST requests when X-Planner-Client header is missing with 403', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google')
        .set('Origin', validOrigin)
        .send({ credential: 'valid_mock_token' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CSRF_FORBIDDEN');
      expect(res.body.error.message).toContain('X-Planner-Client header');
    });

    it('rejects state-changing POST requests when X-Planner-Client header is invalid with 403', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', 'InvalidClient')
        .send({ credential: 'valid_mock_token' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CSRF_FORBIDDEN');
    });

    it('rejects state-changing POST requests when Origin is untrusted with 403', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google')
        .set('Origin', 'http://malicious-attacker.com')
        .set('X-Planner-Client', validCsrfHeader)
        .send({ credential: 'valid_mock_token' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CSRF_FORBIDDEN');
      expect(res.body.error.message).toContain('Untrusted request origin');
    });

    it('rejects state-changing POST requests when both Origin and Referer are absent with 403', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google')
        .set('X-Planner-Client', validCsrfHeader)
        .send({ credential: 'valid_mock_token' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CSRF_FORBIDDEN');
      expect(res.body.error.message).toContain('Origin or Referer header required');
    });

    it('accepts valid Referer matching client origin when Origin header is omitted', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google')
        .set('Referer', 'http://localhost:5173/login')
        .set('X-Planner-Client', validCsrfHeader)
        .send({}); // will fail body validation (400), proving it successfully passed CSRF check!

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/google Validation & Authentication', () => {
    it('rejects request with missing or empty credential with 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrfHeader)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects credential string that is too short with 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrfHeader)
        .send({ credential: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('authenticates valid existing Google credential and returns HttpOnly session cookie', async () => {
      const mockGoogleSub = 'google_sub_1234567890';
      const mockEmail = 'planner.user@example.com';
      const mockName = 'Planner User';

      vi.spyOn(googleAuthService, 'verifyIdToken').mockResolvedValue({
        googleSub: mockGoogleSub,
        email: mockEmail,
        name: mockName,
        avatarUrl: 'https://example.com/avatar.jpg',
      });

      const mockUserId = new Types.ObjectId();
      const mockUserDoc = {
        _id: mockUserId,
        googleSub: mockGoogleSub,
        email: mockEmail,
        name: mockName,
        avatarUrl: 'https://example.com/avatar.jpg',
        preferences: {
          weekStart: 'monday',
          weeklyViewDefault: '7day',
          defaultCurrency: 'USD',
          theme: 'paper-warm',
          prefersReducedMotion: false,
        },
        createdAt: new Date(),
        lastLoginAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, 'findOne').mockResolvedValue(mockUserDoc as any);
      vi.spyOn(sessionService, 'createSession').mockResolvedValue({
        rawToken: 'mock_secure_raw_session_token_12345',
        session: { _id: new Types.ObjectId() } as any,
      });

      const res = await request(app)
        .post('/api/v1/auth/google')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrfHeader)
        .send({ credential: 'valid_mock_google_id_token_string' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(mockEmail);
      expect(res.body.user.name).toBe(mockName);

      // Verify Set-Cookie header contains HttpOnly and SameSite=Lax
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : cookies;
      expect(cookieStr).toContain('planner_session=');
      expect(cookieStr.toLowerCase()).toContain('httponly');
      expect(cookieStr.toLowerCase()).toContain('samesite=lax');
    });
  });

  describe('FIX 1 — Google Account Identity Conflict Prevention', () => {
    it('registers a genuinely new Google identity when no email conflict exists', async () => {
      const newSub = 'new_google_sub_99999';
      const newEmail = 'brand.new.user@example.com';

      vi.spyOn(googleAuthService, 'verifyIdToken').mockResolvedValue({
        googleSub: newSub,
        email: newEmail,
        name: 'New User',
      });

      // No user by sub, no user by email
      vi.spyOn(User, 'findOne').mockResolvedValue(null);

      const createdUserDoc = {
        _id: new Types.ObjectId(),
        googleSub: newSub,
        email: newEmail,
        name: 'New User',
        preferences: {
          weekStart: 'monday',
          weeklyViewDefault: '7day',
          defaultCurrency: 'USD',
          theme: 'paper-warm',
          prefersReducedMotion: false,
        },
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      const createSpy = vi.spyOn(User, 'create').mockResolvedValue(createdUserDoc as any);
      const sessionSpy = vi.spyOn(sessionService, 'createSession').mockResolvedValue({
        rawToken: 'new_session_token_abc',
        session: { _id: new Types.ObjectId() } as any,
      });

      const res = await request(app)
        .post('/api/v1/auth/google')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrfHeader)
        .send({ credential: 'valid_new_user_token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          googleSub: newSub,
          email: newEmail,
        })
      );
      expect(sessionSpy).toHaveBeenCalled();
    });

    it('rejects with 409 ACCOUNT_CONFLICT when email belongs to an existing different googleSub', async () => {
      const attackerSub = 'different_google_sub_attacker';
      const victimEmail = 'victim.planner@example.com';
      const originalSub = 'original_legitimate_sub_12345';

      vi.spyOn(googleAuthService, 'verifyIdToken').mockResolvedValue({
        googleSub: attackerSub,
        email: victimEmail,
        name: 'Attacker Profile',
      });

      // 1st lookup by googleSub: Not found
      // 2nd lookup by email: Found existing user with originalSub!
      const existingVictimDoc = {
        _id: new Types.ObjectId(),
        googleSub: originalSub,
        email: victimEmail,
        name: 'Victim User',
        save: vi.fn(),
      };

      vi.spyOn(User, 'findOne').mockImplementation((query: any) => {
        if (query.googleSub === attackerSub) {
          return Promise.resolve(null);
        }
        if (query.email === victimEmail) {
          return Promise.resolve(existingVictimDoc as any);
        }
        return Promise.resolve(null);
      });

      const sessionSpy = vi.spyOn(sessionService, 'createSession');

      const res = await request(app)
        .post('/api/v1/auth/google')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrfHeader)
        .send({ credential: 'token_with_conflicting_email' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ACCOUNT_CONFLICT');
      expect(res.body.error.message).toContain('Account linking is disabled for security');

      // Crucial security asserts:
      // 1. Original user's googleSub is NOT overwritten
      expect(existingVictimDoc.googleSub).toBe(originalSub);
      expect(existingVictimDoc.save).not.toHaveBeenCalled();

      // 2. No session was created
      expect(sessionSpy).not.toHaveBeenCalled();

      // 3. No cookie was set
      expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('handles duplicate key race condition safely without throwing unhandled 500', async () => {
      vi.spyOn(googleAuthService, 'verifyIdToken').mockResolvedValue({
        googleSub: 'racing_sub',
        email: 'racing.user@example.com',
        name: 'Racing User',
      });

      vi.spyOn(User, 'findOne').mockResolvedValue(null);

      // Simulate MongoDB E11000 duplicate key race
      const duplicateKeyError: any = new Error('E11000 duplicate key error');
      duplicateKeyError.code = 11000;
      vi.spyOn(User, 'create').mockRejectedValue(duplicateKeyError);

      const res = await request(app)
        .post('/api/v1/auth/google')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrfHeader)
        .send({ credential: 'token_racing_condition' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ACCOUNT_CONFLICT');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 Unauthorized when no session cookie is provided', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns user profile when a valid session cookie is provided', async () => {
      const mockUserId = new Types.ObjectId();
      const mockUserDoc = {
        _id: mockUserId,
        email: 'authenticated@example.com',
        name: 'Authenticated User',
        preferences: {
          weekStart: 'monday',
          weeklyViewDefault: '7day',
          defaultCurrency: 'USD',
          theme: 'paper-warm',
          prefersReducedMotion: false,
        },
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      vi.spyOn(sessionService, 'validateAndRenewSession').mockResolvedValue({
        session: { userId: mockUserId } as any,
      });
      vi.spyOn(User, 'findById').mockResolvedValue(mockUserDoc as any);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', ['planner_session=valid_active_token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('authenticated@example.com');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('rejects logout when CSRF header is missing with 403', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Origin', validOrigin);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_FORBIDDEN');
    });

    it('revokes session in database and clears cookie when CSRF is valid', async () => {
      const revokeSpy = vi.spyOn(sessionService, 'revokeSession').mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrfHeader)
        .set('Cookie', ['planner_session=token_to_revoke']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(revokeSpy).toHaveBeenCalledWith('token_to_revoke');

      // Verify cookie is cleared
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : cookies;
      expect(cookieStr).toContain('planner_session=;');
    });
  });

  describe('POST /api/v1/auth/dev-login (Environment Guard)', () => {
    it('strictly rejects dev-login with 403 FORBIDDEN when NODE_ENV is production', async () => {
      const origEnv = env.NODE_ENV;
      (env as any).NODE_ENV = 'production';

      try {
        const res = await request(app)
          .post('/api/v1/auth/dev-login')
          .set('Origin', validOrigin)
          .set('X-Planner-Client', validCsrfHeader)
          .send({ email: 'attacker@example.com' });

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('FORBIDDEN');
        expect(res.body.error.message).toContain('only available in development mode');
      } finally {
        (env as any).NODE_ENV = origEnv;
      }
    });

    it('allows dev-login with 200 and session cookie when in development mode', async () => {
      const origEnv = env.NODE_ENV;
      (env as any).NODE_ENV = 'development';

      const mockUserId = new Types.ObjectId();
      vi.spyOn(User, 'findOne').mockResolvedValue({
        _id: mockUserId,
        email: 'dev@example.com',
        name: 'Dev User',
        preferences: {
          weekStart: 'monday',
          weeklyViewDefault: '7day',
          defaultCurrency: 'USD',
          theme: 'paper-warm',
          prefersReducedMotion: false,
        },
        createdAt: new Date(),
        lastLoginAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      } as any);

      vi.spyOn(sessionService, 'createSession').mockResolvedValue({
        rawToken: 'dev_mock_token_123',
        session: { _id: new Types.ObjectId() } as any,
      });

      try {
        const res = await request(app)
          .post('/api/v1/auth/dev-login')
          .set('Origin', validOrigin)
          .set('X-Planner-Client', validCsrfHeader)
          .send({ email: 'dev@example.com', name: 'Dev User' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.email).toBe('dev@example.com');
        expect(res.headers['set-cookie']).toBeDefined();
      } finally {
        (env as any).NODE_ENV = origEnv;
      }
    });
  });
});
