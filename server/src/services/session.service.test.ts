import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import mongoose, { Types } from 'mongoose';
import { Session } from '../models/Session';
import {
  sessionService,
  SLIDING_WINDOW_MS,
  RENEWAL_THRESHOLD_MS,
  GRACE_PERIOD_MS,
} from './session.service';

describe('SessionService', () => {
  const mockUserId = new Types.ObjectId();

  beforeEach(async () => {
    vi.restoreAllMocks();
  });

  it('correctly hashes raw tokens using HMAC-SHA256', () => {
    const rawToken = 'sample_raw_token_12345';
    const hash1 = sessionService.hashToken(rawToken);
    const hash2 = sessionService.hashToken(rawToken);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
    expect(hash1).not.toBe(rawToken); // Must never store raw token
  });

  it('creates a session with secure expiration and absolute ceiling', async () => {
    const fakeSession = {
      _id: new Types.ObjectId(),
      userId: mockUserId,
      sessionTokenHash: 'mock_hash',
      expiresAt: new Date(Date.now() + SLIDING_WINDOW_MS),
      absoluteExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      lastRotatedAt: new Date(),
    };

    const createSpy = vi.spyOn(Session, 'create').mockResolvedValue(fakeSession as any);

    const { rawToken, session } = await sessionService.createSession(
      mockUserId,
      'Mozilla/5.0',
      '127.0.0.1'
    );

    expect(rawToken).toBeDefined();
    expect(rawToken.length).toBe(64); // 32 bytes hex
    expect(createSpy).toHaveBeenCalled();
    expect(session).toBeDefined();
  });

  it('rejects an expired session and deletes it from database', async () => {
    const rawToken = 'expired_raw_token_abc';
    const expiredSession = {
      _id: new Types.ObjectId(),
      sessionTokenHash: sessionService.hashToken(rawToken),
      expiresAt: new Date(Date.now() - 1000), // 1 second ago
      absoluteExpiresAt: new Date(Date.now() + 10000),
    };

    vi.spyOn(Session, 'findOne').mockResolvedValue(expiredSession as any);
    const deleteSpy = vi.spyOn(Session, 'deleteOne').mockResolvedValue({ deletedCount: 1 } as any);

    const result = await sessionService.validateAndRenewSession(rawToken);

    expect(result).toBeNull();
    expect(deleteSpy).toHaveBeenCalledWith({ _id: expiredSession._id });
  });

  it('rotates session token and sets grace period when within renewal threshold', async () => {
    const rawToken = 'renewable_token_xyz';
    const tokenHash = sessionService.hashToken(rawToken);

    // Remaining time: 10 days (< 15 days threshold)
    const renewableSession = {
      _id: new Types.ObjectId(),
      sessionTokenHash: tokenHash,
      previousTokenHash: undefined,
      gracePeriodExpiresAt: undefined,
      expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      absoluteExpiresAt: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
      lastRotatedAt: new Date(),
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(Session, 'findOne').mockResolvedValue(renewableSession as any);

    const result = await sessionService.validateAndRenewSession(rawToken);

    expect(result).not.toBeNull();
    expect(result?.newRawToken).toBeDefined();
    expect(result?.newRawToken).not.toBe(rawToken);
    expect(renewableSession.previousTokenHash).toBe(tokenHash);
    expect(renewableSession.gracePeriodExpiresAt).toBeDefined();
    expect(renewableSession.save).toHaveBeenCalled();
  });

  it('allows previous token during rotation grace period for concurrent requests', async () => {
    const previousToken = 'concurrent_prev_token';
    const prevHash = sessionService.hashToken(previousToken);

    const sessionInGrace = {
      _id: new Types.ObjectId(),
      sessionTokenHash: 'new_token_hash_current',
      previousTokenHash: prevHash,
      gracePeriodExpiresAt: new Date(Date.now() + GRACE_PERIOD_MS), // valid for 30s
      expiresAt: new Date(Date.now() + SLIDING_WINDOW_MS),
      absoluteExpiresAt: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
    };

    vi.spyOn(Session, 'findOne').mockResolvedValue(sessionInGrace as any);

    const result = await sessionService.validateAndRenewSession(previousToken);

    expect(result).not.toBeNull();
    expect(result?.session).toBe(sessionInGrace);
    // Should NOT issue another new token for previous token
    expect(result?.newRawToken).toBeUndefined();
  });

  it('revokes session on logout', async () => {
    const rawToken = 'logout_token_123';
    const deleteSpy = vi.spyOn(Session, 'deleteOne').mockResolvedValue({ deletedCount: 1 } as any);

    const revoked = await sessionService.revokeSession(rawToken);

    expect(revoked).toBe(true);
    expect(deleteSpy).toHaveBeenCalled();
  });
});
