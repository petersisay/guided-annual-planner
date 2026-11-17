import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { googleAuthService } from '../services/googleAuth.service.js';
import { sessionService } from '../services/session.service.js';
import { User } from '../models/User.js';
import { Types } from 'mongoose';
import { env } from '../config/env.js';
import { safeIsoDate, mapUserToProfile } from './auth.controller.js';

describe('AuthController, CSRF Protection & Identity Conflict Tests', () => {
  const app = createApp();
  const validOrigin = 'http://localhost:5173';
  const validCsrfHeader = 'WebApp';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Safe Date Serialization & Profile Mapping', () => {
    it('serializes valid Date instances correctly to ISO string', () => {
      const now = new Date('2026-10-14T10:00:00.000Z');
      expect(safeIsoDate(now)).toBe('2026-10-14T10:00:00.000Z');
    });

    it('serializes valid date strings without throwing', () => {
      expect(safeIsoDate('2026-05-01T00:00:00.000Z')).toBe('2026-05-01T00:00:00.000Z');
    });

    it('handles null and undefined safely with fallback ISO date', () => {
      const nullDate = safeIsoDate(null);
      const undefinedDate = safeIsoDate(undefined);
      expect(typeof nullDate).toBe('string');
      expect(typeof undefinedDate).toBe('string');
      expect(!isNaN(new Date(nullDate).getTime())).toBe(true);
      expect(!isNaN(new Date(undefinedDate).getTime())).toBe(true);
    });

    it('mapUserToProfile handles legacy records missing createdAt or lastLoginAt without throwing', () => {
      const legacyUser = {
        _id: new Types.ObjectId(),
        email: 'legacy@example.com',
        name: 'Legacy User',
        preferences: undefined,
        createdAt: undefined,
        lastLoginAt: undefined,
      };

      const profile = mapUserToProfile(legacyUser);
      expect(profile.id).toBe(legacyUser._id.toString());
      expect(profile.email).toBe('legacy@example.com');
      expect(profile.preferences.weekStart).toBe('monday');
      expect(typeof profile.createdAt).toBe('string');
      expect(typeof profile.lastLoginAt).toBe('string');
    });
  });

  describe('Explicit Server-Side CSRF Protection', () => {
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
  });

  describe('Google OAuth2 Authentication Flow', () => {
    it('authenticates a new Google user and establishes a session cookie', async () => {
      const mockGoogleSub = '1092837410928374192';
      const mockEmail = 'new.user@example.com';
      const mockName = 'New Google User';

      vi.spyOn(googleAuthService, 'verifyIdToken').mockResolvedValue({
        googleSub: mockGoogleSub,
        email: mockEmail,
        name: mockName,
        avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
      });

      vi.spyOn(User, 'findOne').mockResolvedValue(null);

      const mockCreatedUser = {
        _id: new Types.ObjectId(),
        googleSub: mockGoogleSub,
        email: mockEmail,
        name: mockName,
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
      vi.spyOn(User, 'create').mockResolvedValue(mockCreatedUser);

      vi.spyOn(sessionService, 'createSession').mockResolvedValue({
        rawToken: 'mock_raw_session_token_123',
        session: { _id: new Types.ObjectId() },
      });

      const res = await request(app)
        .post('/api/v1/auth/google')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrfHeader)
        .send({ credential: 'valid_google_token_new_user' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(mockEmail);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('rejects Google login when ID token is rejected by GoogleAuthService', async () => {
      const authErr = new Error('Google authentication failed: Invalid token signature');
      authErr.statusCode = 401;
      authErr.code = 'UNAUTHORIZED';
      vi.spyOn(googleAuthService, 'verifyIdToken').mockRejectedValue(authErr);

      const res = await request(app)
        .post('/api/v1/auth/google')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrfHeader)
        .send({ credential: 'invalid_forged_token' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('strictly prevents account takeover when an existing account has a different verified Google identity', async () => {
      const originalSub = 'google_sub_user_abc_12345';
      const attackerSub = 'google_sub_attacker_99999';
      const victimEmail = 'victim.planner@example.com';

      vi.spyOn(googleAuthService, 'verifyIdToken').mockResolvedValue({
        googleSub: attackerSub,
        email: victimEmail,
        name: 'Attacker Profile',
      });

      const existingVictimDoc = {
        _id: new Types.ObjectId(),
        googleSub: originalSub,
        email: victimEmail,
        name: 'Victim User',
        save: vi.fn(),
      };

      vi.spyOn(User, 'findOne').mockImplementation((query) => {
        if (query.googleSub === attackerSub) {
          return Promise.resolve(null);
        }
        if (query.email === victimEmail) {
          return Promise.resolve(existingVictimDoc);
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

      expect(existingVictimDoc.googleSub).toBe(originalSub);
      expect(existingVictimDoc.save).not.toHaveBeenCalled();
      expect(sessionSpy).not.toHaveBeenCalled();
      expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('claims and links account when existing user has a dev/mock sub', async () => {
      const realGoogleSub = 'real_numeric_google_sub_1098234710923847';
      const userEmail = 'petros.planner@customdomain.org';
      const devMockSub = 'dev_google_sub_petros.planner@customdomain.org';

      vi.spyOn(googleAuthService, 'verifyIdToken').mockResolvedValue({
        googleSub: realGoogleSub,
        email: userEmail,
        name: 'Petros User',
        avatarUrl: 'https://lh3.googleusercontent.com/avatar.jpg',
      });

      const existingDevDoc = {
        _id: new Types.ObjectId(),
        googleSub: devMockSub,
        email: userEmail,
        name: 'Dev Petros',
        avatarUrl: undefined,
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

      vi.spyOn(User, 'findOne').mockImplementation((query) => {
        if (query.googleSub === realGoogleSub) {
          return Promise.resolve(null);
        }
        if (query.email === userEmail) {
          return Promise.resolve(existingDevDoc);
        }
        return Promise.resolve(null);
      });

      const sessionSpy = vi.spyOn(sessionService, 'createSession').mockResolvedValue({
        rawToken: 'claimed_dev_session_token',
        session: { _id: new Types.ObjectId() },
      });

      const res = await request(app)
        .post('/api/v1/auth/google')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrfHeader)
        .send({ credential: 'valid_google_token_for_dev_user' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(existingDevDoc.googleSub).toBe(realGoogleSub);
      expect(existingDevDoc.save).toHaveBeenCalled();
      expect(sessionSpy).toHaveBeenCalled();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('links account when existing user has verified @gmail.com address', async () => {
      const realGoogleSub = '109823471092384719238';
      const userEmail = 'petrossisay1646@gmail.com';
      const oldSub = 'old_initial_sub_55555';

      vi.spyOn(googleAuthService, 'verifyIdToken').mockResolvedValue({
        googleSub: realGoogleSub,
        email: userEmail,
        name: 'Petros Sisay',
        avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
      });

      const existingUserDoc = {
        _id: new Types.ObjectId(),
        googleSub: oldSub,
        email: userEmail,
        name: 'Petros Sisay',
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

      vi.spyOn(User, 'findOne').mockImplementation((query) => {
        if (query.googleSub === realGoogleSub) {
          return Promise.resolve(null);
        }
        if (query.email === userEmail) {
          return Promise.resolve(existingUserDoc);
        }
        return Promise.resolve(null);
      });

      const sessionSpy = vi.spyOn(sessionService, 'createSession').mockResolvedValue({
        rawToken: 'linked_gmail_session_token',
        session: { _id: new Types.ObjectId() },
      });

      const res = await request(app)
        .post('/api/v1/auth/google')
        .set('Origin', validOrigin)
        .set('X-Planner-Client', validCsrfHeader)
        .send({ credential: 'valid_google_token_for_petros' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(existingUserDoc.googleSub).toBe(realGoogleSub);
      expect(existingUserDoc.save).toHaveBeenCalled();
      expect(sessionSpy).toHaveBeenCalled();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('handles duplicate key race condition safely without throwing unhandled 500', async () => {
      vi.spyOn(googleAuthService, 'verifyIdToken').mockResolvedValue({
        googleSub: 'racing_sub',
        email: 'racing.user@example.com',
        name: 'Racing User',
      });

      vi.spyOn(User, 'findOne').mockResolvedValue(null);

      const duplicateKeyError = new Error('E11000 duplicate key error');
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
        session: { userId: mockUserId },
      });
      vi.spyOn(User, 'findById').mockResolvedValue(mockUserDoc);

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

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : cookies;
      expect(cookieStr).toContain('planner_session=;');
    });
  });

  describe('POST /api/v1/auth/dev-login (Environment Guard)', () => {
    it('strictly rejects dev-login with 403 FORBIDDEN when NODE_ENV is production', async () => {
      const origEnv = env.NODE_ENV;
      env.NODE_ENV = 'production';

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
        env.NODE_ENV = origEnv;
      }
    });

    it('allows dev-login with 200 and session cookie when in development mode', async () => {
      const origEnv = env.NODE_ENV;
      env.NODE_ENV = 'development';

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
      });

      vi.spyOn(sessionService, 'createSession').mockResolvedValue({
        rawToken: 'dev_mock_token_123',
        session: { _id: new Types.ObjectId() },
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
        env.NODE_ENV = origEnv;
      }
    });
  });
});
