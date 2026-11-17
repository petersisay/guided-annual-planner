import { env } from '../config/env.js';
import { sessionService, SLIDING_WINDOW_MS } from '../services/session.service.js';
import { User } from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const rawToken = req.cookies?.[env.COOKIE_NAME];

    if (!rawToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication session required',
        },
      });
      return;
    }

    const validation = await sessionService.validateAndRenewSession(rawToken);

    if (!validation) {
      // Clear invalid cookie
      res.clearCookie(env.COOKIE_NAME, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: 'lax',
      });

      res.status(401).json({
        success: false,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Your session has expired or is invalid. Please sign in again.',
        },
      });
      return;
    }

    // If session was rotated during renewal, set the new cookie seamlessly
    if (validation.newRawToken) {
      res.cookie(env.COOKIE_NAME, validation.newRawToken, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: 'lax',
        maxAge: SLIDING_WINDOW_MS,
      });
    }

    const user = await User.findById(validation.session.userId);

    if (!user) {
      await sessionService.revokeSession(rawToken);
      res.clearCookie(env.COOKIE_NAME, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: 'lax',
      });
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Associated user account was not found',
        },
      });
      return;
    }

    req.user = user;
    req.sessionRecord = validation.session;
    next();
  } catch (err) {
    next(err);
  }
}
