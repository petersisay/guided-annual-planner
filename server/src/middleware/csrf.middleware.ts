import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
export const REQUIRED_CSRF_HEADER = 'x-planner-client';
export const EXPECTED_CSRF_HEADER_VALUE = 'WebApp';

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // 1. Safe HTTP methods bypass CSRF checks
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  // 2. Validate custom request header (browsers forbid cross-origin scripts from setting this without CORS preflight)
  const clientHeader = req.headers[REQUIRED_CSRF_HEADER];
  if (!clientHeader || clientHeader !== EXPECTED_CSRF_HEADER_VALUE) {
    res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_FORBIDDEN',
        message: 'Cross-Site Request Forgery validation failed: Missing or invalid X-Planner-Client header.',
      },
    });
    return;
  }

  // 3. Validate Origin / Referer against configured trusted frontend origin
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (origin) {
    if (origin !== env.CLIENT_ORIGIN) {
      res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_FORBIDDEN',
          message: 'Cross-Site Request Forgery validation failed: Untrusted request origin.',
        },
      });
      return;
    }
  } else if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin !== env.CLIENT_ORIGIN) {
        res.status(403).json({
          success: false,
          error: {
            code: 'CSRF_FORBIDDEN',
            message: 'Cross-Site Request Forgery validation failed: Untrusted request referer.',
          },
        });
        return;
      }
    } catch {
      res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_FORBIDDEN',
          message: 'Cross-Site Request Forgery validation failed: Malformed referer header.',
        },
      });
      return;
    }
  } else {
    // Both Origin and Referer are absent on a state-changing mutation request
    res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_FORBIDDEN',
        message: 'Cross-Site Request Forgery validation failed: Origin or Referer header required for state-changing requests.',
      },
    });
    return;
  }

  next();
}
