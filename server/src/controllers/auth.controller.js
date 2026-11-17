import { googleAuthSchema } from '@planner/shared';
import { googleAuthService } from '../services/googleAuth.service.js';
import { sessionService, SLIDING_WINDOW_MS } from '../services/session.service.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

export function safeIsoDate(input) {
  if (!input) return new Date().toISOString();
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? new Date().toISOString() : input.toISOString();
  }
  if (typeof input === 'string') {
    const parsed = new Date(input);
    return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }
  if (typeof input === 'number') {
    const parsed = new Date(input);
    return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }
  return new Date().toISOString();
}

const defaultPreferences = {
  weekStart: 'monday',
  weeklyViewDefault: '7day',
  defaultCurrency: 'USD',
  theme: 'paper-warm',
  prefersReducedMotion: false,
  onboardingStatus: 'completed',
  onboardingStep: 5,
  defaultYear: new Date().getFullYear(),
};

export function ensureUserPreferences(existingPrefs) {
  const current =
    existingPrefs && typeof existingPrefs === 'object'
      ? existingPrefs.toObject
        ? existingPrefs.toObject()
        : existingPrefs
      : {};
  return { ...defaultPreferences, ...current };
}

export function mapUserToProfile(user) {
  const userPrefs =
    user.preferences && typeof user.preferences === 'object'
      ? user.preferences.toObject
        ? user.preferences.toObject()
        : user.preferences
      : {};

  return {
    id: user._id ? user._id.toString() : '',
    email: user.email || '',
    name: user.name || (user.email ? user.email.split('@')[0] : 'Planner User'),
    avatarUrl: user.avatarUrl || undefined,
    preferences: { ...defaultPreferences, ...userPrefs },
    createdAt: safeIsoDate(user.createdAt),
    lastLoginAt: safeIsoDate(user.lastLoginAt),
  };
}

export class AuthController {
  async loginWithGoogle(req, res, next) {
    try {
      // 1. Validate payload with shared Zod schema
      const { credential } = googleAuthSchema.parse(req.body);

      // 2. Cryptographically verify Google ID token
      const verified = await googleAuthService.verifyIdToken(credential);

      // 3. Find user strictly by verified googleSub
      let user = await User.findOne({ googleSub: verified.googleSub });

      if (!user) {
        // Check if an existing account is already registered with this email
        const existingEmailUser = await User.findOne({ email: verified.email });
        if (existingEmailUser) {
          const sub = typeof existingEmailUser.googleSub === 'string' ? existingEmailUser.googleSub : '';
          const isDevOrMockSub =
            !sub ||
            sub.startsWith('dev_') ||
            sub.startsWith('mock_') ||
            sub.startsWith('test_') ||
            sub === 'placeholder';

          const isAuthoritativeGoogleDomain =
            typeof verified.email === 'string' &&
            (verified.email.endsWith('@gmail.com') || verified.email.endsWith('@googlemail.com'));

          // Legitimate account claim / Google identity link:
          // The email is cryptographically verified by Google. If the existing record
          // has a dev/placeholder sub or an authoritative Google domain, update to the verified Google sub.
          if (isDevOrMockSub || isAuthoritativeGoogleDomain) {
            existingEmailUser.googleSub = verified.googleSub;
            if (verified.avatarUrl) existingEmailUser.avatarUrl = verified.avatarUrl;
            if (verified.name) existingEmailUser.name = verified.name;
            existingEmailUser.preferences = ensureUserPreferences(existingEmailUser.preferences);
            if (!existingEmailUser.createdAt) existingEmailUser.createdAt = new Date();
            existingEmailUser.lastLoginAt = new Date();
            try {
              await existingEmailUser.save();
              user = existingEmailUser;
            } catch (saveErr) {
              if (saveErr?.code === 11000) {
                res.status(409).json({
                  success: false,
                  error: {
                    code: 'ACCOUNT_CONFLICT',
                    message:
                      'A registration conflict occurred for this Google identity or email. Please retry.',
                  },
                });
                return;
              }
              throw saveErr;
            }
          } else {
            res.status(409).json({
              success: false,
              error: {
                code: 'ACCOUNT_CONFLICT',
                message:
                  'An account with this email address already exists under a different Google identity. Account linking is disabled for security.',
              },
            });
            return;
          }
        } else {
          // Genuinely new user - create record safely
          try {
            user = await User.create({
              googleSub: verified.googleSub,
              email: verified.email,
              name: verified.name,
              avatarUrl: verified.avatarUrl,
              preferences: {
                weekStart: 'monday',
                weeklyViewDefault: '7day',
                defaultCurrency: 'USD',
                theme: 'paper-warm',
                prefersReducedMotion: false,
                onboardingStatus: 'not_started',
                onboardingStep: 1,
                defaultYear: new Date().getFullYear(),
              },
              lastLoginAt: new Date(),
            });
          } catch (createErr) {
            // Handle potential concurrent race condition on unique indexes (E11000)
            if (createErr?.code === 11000) {
              res.status(409).json({
                success: false,
                error: {
                  code: 'ACCOUNT_CONFLICT',
                  message:
                    'A registration conflict occurred for this Google identity or email. Please retry.',
                },
              });
              return;
            }
            throw createErr;
          }
        }
      } else {
        // Existing user with matching googleSub - update profile & login timestamp
        user.preferences = ensureUserPreferences(user.preferences);
        if (!user.createdAt) user.createdAt = new Date();
        user.lastLoginAt = new Date();
        if (verified.avatarUrl) user.avatarUrl = verified.avatarUrl;
        if (verified.name) user.name = verified.name;
        // Keep verified email synchronized for this same sub if changed
        if (verified.email && verified.email !== user.email) {
          const emailTaken = await User.findOne({ email: verified.email });
          if (!emailTaken) {
            user.email = verified.email;
          }
        }
        await user.save();
      }

      // 4. Create database-backed session with hashed secret
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;
      const { rawToken } = await sessionService.createSession(user._id, userAgent, ipAddress);

      // 5. Issue secure HttpOnly cookie
      res.cookie(env.COOKIE_NAME, rawToken, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: 'lax',
        maxAge: SLIDING_WINDOW_MS,
      });

      // 6. Return verified user profile
      res.status(200).json({
        success: true,
        user: mapUserToProfile(user),
        message: 'Successfully authenticated with Google',
      });
    } catch (err) {
      next(err);
    }
  }

  async getCurrentUser(req, res, next) {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User session not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        user: mapUserToProfile(req.user),
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const rawToken = req.cookies?.[env.COOKIE_NAME];
      if (rawToken) {
        await sessionService.revokeSession(rawToken);
      }

      res.clearCookie(env.COOKIE_NAME, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: 'lax',
      });

      res.status(200).json({
        success: true,
        message: 'Successfully logged out',
      });
    } catch (err) {
      next(err);
    }
  }

  async loginDev(req, res, next) {
    try {
      if (env.NODE_ENV !== 'development') {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Dev login is only available in development mode' },
        });
        return;
      }

      const devEmail =
        typeof req.body?.email === 'string' && req.body.email.trim()
          ? req.body.email.trim().toLowerCase()
          : 'demo.planner@example.com';
      const devGoogleSub = `dev_google_sub_${devEmail}`;
      const devName =
        typeof req.body?.name === 'string' && req.body.name.trim()
          ? req.body.name.trim()
          : 'Peter Sisay';

      let user = await User.findOne({
        $or: [{ googleSub: devGoogleSub }, { email: devEmail }],
      });
      if (!user) {
        user = await User.create({
          googleSub: devGoogleSub,
          email: devEmail,
          name: devName,
          preferences: {
            weekStart: 'monday',
            weeklyViewDefault: '7day',
            defaultCurrency: 'USD',
            theme: 'paper-warm',
            prefersReducedMotion: false,
            onboardingStatus: 'completed',
            onboardingStep: 5,
            defaultYear: new Date().getFullYear(),
          },
        });
      }

      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;
      const { rawToken } = await sessionService.createSession(user._id, userAgent, ipAddress);

      res.cookie(env.COOKIE_NAME, rawToken, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: 'lax',
        maxAge: SLIDING_WINDOW_MS,
      });

      res.status(200).json({
        success: true,
        user: mapUserToProfile(user),
        message: 'Successfully authenticated as local demo user',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
