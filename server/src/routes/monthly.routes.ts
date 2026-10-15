import { Router } from 'express';
import { monthlyController } from '../controllers/monthly.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware';

export const monthlyRouter = Router();

monthlyRouter.get('/:year/:month', requireAuth, (req, res, next) => {
  monthlyController.getMonthlyPlan(req, res, next);
});

monthlyRouter.put('/:year/:month', requireAuth, idempotencyMiddleware, (req, res, next) => {
  monthlyController.updateMonthlyPlan(req, res, next);
});
