import crypto from 'crypto';
import { Types } from 'mongoose';
import { Session, ISessionDocument } from '../models/Session';
import { env } from '../config/env';

export const SLIDING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const RENEWAL_THRESHOLD_MS = 15 * 24 * 60 * 60 * 1000; // 15 days
export const ABSOLUTE_LIFETIME_MS = 60 * 24 * 60 * 60 * 1000; // 60 days hard ceiling
export const GRACE_PERIOD_MS = 30 * 1000; // 30 seconds for concurrent requests during rotation

export interface SessionValidationResult {
  session: ISessionDocument;
  newRawToken?: string;
}

export class SessionService {
  hashToken(rawToken: string): string {
    return crypto
      .createHmac('sha256', env.SESSION_SECRET)
      .update(rawToken)
      .digest('hex');
  }

  async createSession(
    userId: Types.ObjectId,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ rawToken: string; session: ISessionDocument }> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const sessionTokenHash = this.hashToken(rawToken);

    const now = Date.now();
    const expiresAt = new Date(now + SLIDING_WINDOW_MS);
    const absoluteExpiresAt = new Date(now + ABSOLUTE_LIFETIME_MS);

    const session = await Session.create({
      userId,
      sessionTokenHash,
      userAgent,
      ipAddress,
      expiresAt,
      absoluteExpiresAt,
      lastRotatedAt: new Date(now),
    });

    return { rawToken, session };
  }

  async validateAndRenewSession(rawToken: string): Promise<SessionValidationResult | null> {
    if (!rawToken || typeof rawToken !== 'string') {
      return null;
    }

    const tokenHash = this.hashToken(rawToken);
    const now = Date.now();

    // Find session by current or previous token hash
    const session = await Session.findOne({
      $or: [{ sessionTokenHash: tokenHash }, { previousTokenHash: tokenHash }],
    });

    if (!session) {
      return null;
    }

    // If matched via previous token hash, ensure it's still within the rotation grace period
    if (session.previousTokenHash === tokenHash) {
      if (!session.gracePeriodExpiresAt || session.gracePeriodExpiresAt.getTime() < now) {
        return null;
      }
      return { session };
    }

    // Validate expiration timestamp independently of MongoDB background TTL
    if (session.expiresAt.getTime() < now) {
      await Session.deleteOne({ _id: session._id });
      return null;
    }

    // Check if absolute ceiling has passed
    if (session.absoluteExpiresAt.getTime() < now) {
      await Session.deleteOne({ _id: session._id });
      return null;
    }

    // Check if rolling renewal and rotation is warranted (remaining time < 15 days)
    const remainingTime = session.expiresAt.getTime() - now;
    if (remainingTime < RENEWAL_THRESHOLD_MS) {
      const newRawToken = crypto.randomBytes(32).toString('hex');
      const newHash = this.hashToken(newRawToken);

      session.previousTokenHash = session.sessionTokenHash;
      session.gracePeriodExpiresAt = new Date(now + GRACE_PERIOD_MS);
      session.sessionTokenHash = newHash;

      // Extend expiration bounded by the absolute ceiling
      const potentialNewExpiry = now + SLIDING_WINDOW_MS;
      session.expiresAt = new Date(
        Math.min(potentialNewExpiry, session.absoluteExpiresAt.getTime())
      );
      session.lastRotatedAt = new Date(now);

      await session.save();
      return { session, newRawToken };
    }

    return { session };
  }

  async revokeSession(rawToken: string): Promise<boolean> {
    if (!rawToken) return false;
    const tokenHash = this.hashToken(rawToken);
    const result = await Session.deleteOne({
      $or: [{ sessionTokenHash: tokenHash }, { previousTokenHash: tokenHash }],
    });
    return result.deletedCount > 0;
  }

  async revokeAllUserSessions(userId: Types.ObjectId): Promise<number> {
    const result = await Session.deleteMany({ userId });
    return result.deletedCount;
  }
}

export const sessionService = new SessionService();
