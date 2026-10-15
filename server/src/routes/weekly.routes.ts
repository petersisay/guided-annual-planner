import { Router } from 'express';
import { weeklyController } from '../controllers/weekly.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware';

export const weeklyRouter = Router();

weeklyRouter.get('/:year/:week', requireAuth, (req, res, next) => {
  weeklyController.getWeeklyPlan(req, res, next);
});

weeklyRouter.put('/:year/:week', requireAuth, idempotencyMiddleware, (req, res, next) => {
  weeklyController.updateWeeklyPlan(req, res, next);
});
