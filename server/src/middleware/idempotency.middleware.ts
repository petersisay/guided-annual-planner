import crypto from 'crypto';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { ProcessedMutation } from '../models/ProcessedMutation';

function computePayloadHash(payload: any): string {
  if (!payload || (typeof payload === 'object' && Object.keys(payload).length === 0)) {
    return '';
  }
  try {
    return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  } catch {
    return '';
  }
}

const STALE_LOCK_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Server-Enforced User-Scoped Idempotency Middleware
 *
 * Implements atomic mutation locking and response caching:
 * 1. Checks if a mutation with `X-Mutation-Id` has already completed for this user.
 * 2. If completed, immediately replays the cached status code and response body.
 * 3. Verifies endpoint, method, and payload match original registration.
 * 4. Recovers stale in-progress locks (> 30s) from interrupted operations.
 * 5. Atomically claims the mutation with `status: 'in_progress'` to prevent concurrent duplicate execution.
 * 6. On success (2xx), transitions the record to `status: 'completed'` with cached payload.
 * 7. On error (4xx/5xx) or save exception, clears the reservation so the mutation can be retried cleanly.
 */
export async function idempotencyMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const mutationId = req.headers['x-mutation-id'];

  // Only apply when an explicit mutation ID and authenticated user are present
  if (!mutationId || typeof mutationId !== 'string' || !req.user?._id) {
    next();
    return;
  }

  const userId = req.user._id;
  const currentEndpoint = req.originalUrl || req.url;
  const currentMethod = req.method;
  const currentPayloadHash = computePayloadHash(req.body);

  try {
    let existing = await ProcessedMutation.findOne({ userId, mutationId });

    if (existing) {
      // 1. Mismatch check: mutation ID reused for a different endpoint or method
      if (existing.endpoint !== currentEndpoint || existing.method !== currentMethod) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MUTATION_ID_REUSE_MISMATCH',
            message: 'A mutation ID cannot be reused across different endpoints or HTTP methods.',
          },
        });
        return;
      }

      // 2. Payload mismatch check: mutation ID reused for different payload
      if (
        existing.requestHash &&
        currentPayloadHash &&
        existing.requestHash !== currentPayloadHash
      ) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MUTATION_PAYLOAD_MISMATCH',
            message: 'A mutation ID cannot be reused with a different request payload.',
          },
        });
        return;
      }

      // 3. Completed: replay cached response immediately
      if (existing.status === 'completed' && existing.statusCode !== undefined) {
        res.setHeader('X-Idempotent-Replay', 'true');
        res.status(existing.statusCode).json(existing.responseBody);
        return;
      }

      // 4. In-progress: check for stale lock timeout (> 30s)
      if (existing.status === 'in_progress') {
        const elapsed = Date.now() - new Date(existing.createdAt).getTime();
        if (elapsed > STALE_LOCK_TIMEOUT_MS) {
          // Stale lock recovery: previous connection died or timed out
          await ProcessedMutation.deleteOne({ userId, mutationId }).catch(() => {});
        } else {
          res.status(409).json({
            success: false,
            error: {
              code: 'MUTATION_IN_PROGRESS',
              message: 'This mutation is currently being processed by another connection.',
            },
          });
          return;
        }
      }
    }

    // 5. Atomically claim the mutation with status: 'in_progress'
    try {
      await ProcessedMutation.create({
        userId,
        mutationId,
        endpoint: currentEndpoint,
        method: currentMethod,
        requestHash: currentPayloadHash || undefined,
        status: 'in_progress',
      });
    } catch (insertErr: any) {
      if (insertErr?.code === 11000) {
        // Concurrent race won by another connection at this exact millisecond
        existing = await ProcessedMutation.findOne({ userId, mutationId });
        if (existing?.status === 'completed' && existing.statusCode !== undefined) {
          res.setHeader('X-Idempotent-Replay', 'true');
          res.status(existing.statusCode).json(existing.responseBody);
          return;
        }
        res.status(409).json({
          success: false,
          error: {
            code: 'MUTATION_IN_PROGRESS',
            message: 'This mutation is currently being processed by another connection.',
          },
        });
        return;
      }
      throw insertErr;
    }

    // 6. Intercept response to update mutation state upon controller completion
    const originalJson = res.json.bind(res);
    res.json = function (body: any): Response {
      res.json = originalJson;

      if (res.statusCode >= 200 && res.statusCode < 300) {
        ProcessedMutation.updateOne(
          { userId, mutationId },
          {
            $set: {
              status: 'completed',
              statusCode: res.statusCode,
              responseBody: body,
            },
          }
        ).catch(async (err) => {
          console.error('Failed to update processed mutation to completed:', err);
          // If saving the cached idempotency response failed, remove the in_progress reservation
          // so that future retries are not blocked by a permanent in_progress lock
          await ProcessedMutation.deleteOne({ userId, mutationId }).catch(() => {});
        });
      } else {
        // Business operation failed (4xx/5xx): delete the in_progress reservation so it can be retried cleanly
        ProcessedMutation.deleteOne({ userId, mutationId }).catch((err) => {
          console.error('Failed to clear failed mutation reservation:', err);
        });
      }

      return originalJson(body);
    };

    next();
  } catch (err) {
    console.error('Idempotency middleware error:', err);
    next();
  }
}
