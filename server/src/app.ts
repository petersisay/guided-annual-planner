import path from 'path';
import fs from 'fs';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { authRouter } from './routes/auth.routes';
import { annualRouter } from './routes/annual.routes';
import { monthlyRouter } from './routes/monthly.routes';
import { weeklyRouter } from './routes/weekly.routes';
import { dailyRouter } from './routes/daily.routes';
import { trackerRouter } from './routes/tracker.routes';
import { userRouter } from './routes/user.routes';
import { backupRouter } from './routes/backup.routes';
import { errorHandler } from './middleware/error.middleware';
import { csrfProtection } from './middleware/csrf.middleware';

export function createApp() {
  const app = express();

  // 1. Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    })
  );

  // 2. Strict CORS Configuration
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Planner-Client', 'X-Mutation-Id'],
    })
  );

  // 3. Body Parsing & Cookies
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // 4. Explicit Server-Side CSRF Protection
  app.use(csrfProtection);

  // 5. Health Check Endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'guided-annual-planner-api',
      timestamp: new Date().toISOString(),
    });
  });

  // 6. API V1 Routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/planner/year', annualRouter);
  app.use('/api/v1/planner/monthly', monthlyRouter);
  app.use('/api/v1/planner/weekly', weeklyRouter);
  app.use('/api/v1/planner/daily', dailyRouter);
  app.use('/api/v1/planner/backup', backupRouter);
  app.use('/api/v1/trackers', trackerRouter);
  app.use('/api/v1/user', userRouter);

  // 7. Production Static Client Serving & SPA Navigation Fallback
  const clientDistPath = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));

    app.get('*', (req, res, next) => {
      // Preserve API, auth, and health routes from being intercepted by the SPA fallback
      if (
        req.path.startsWith('/api') ||
        req.path.startsWith('/auth') ||
        req.path === '/health' ||
        req.path.startsWith('/health/')
      ) {
        return next();
      }
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  // 8. 404 Route Handler for unmatched API endpoints
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested API route was not found',
      },
    });
  });

  // 7. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
