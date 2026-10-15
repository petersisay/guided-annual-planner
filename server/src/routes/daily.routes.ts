import { Router } from 'express';
import { dailyController } from '../controllers/daily.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware';

export const dailyRouter = Router();

dailyRouter.get('/:date', requireAuth, (req, res, next) => {
  dailyController.getDailyPlan(req, res, next);
});

dailyRouter.put('/:date', requireAuth, idempotencyMiddleware, (req, res, next) => {
  dailyController.updateDailyPlan(req, res, next);
});
