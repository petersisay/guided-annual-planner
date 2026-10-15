import { Request, Response, NextFunction } from 'express';
import { googleAuthSchema, UserProfile } from '@planner/shared';
import { googleAuthService } from '../services/googleAuth.service';
import { sessionService, SLIDING_WINDOW_MS } from '../services/session.service';
import { User, IUserDocument } from '../models/User';
import { env } from '../config/env';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export function mapUserToProfile(user: IUserDocument): UserProfile {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    preferences: user.preferences,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt.toISOString(),
  };
}

export class AuthController {
  async loginWithGoogle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Validate payload with shared Zod schema
      const { credential } = googleAuthSchema.parse(req.body);

      // 2. Cryptographically verify Google ID token
      const verified = await googleAuthService.verifyIdToken(credential);

      // 3. Find user strictly by verified googleSub
      let user = await User.findOne({ googleSub: verified.googleSub });

      if (!user) {
        // Check if an existing account is already registered with this email under a DIFFERENT Google identity
        const existingEmailUser = await User.findOne({ email: verified.email });
        if (existingEmailUser) {
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

        // Genuinely new user - create record safely
        try {
          user = await User.create({
            googleSub: verified.googleSub,
            email: verified.email,
            name: verified.name,
            avatarUrl: verified.avatarUrl,
            lastLoginAt: new Date(),
          });
        } catch (createErr: any) {
          // Handle potential concurrent race condition on unique indexes (E11000)
          if (createErr.code === 11000) {
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
      } else {
        // Existing user with matching googleSub - update profile & login timestamp
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

  async getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  async loginDev(req: Request, res: Response, next: NextFunction): Promise<void> {
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
          : 'Sara Tesfaye';

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
