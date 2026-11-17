import { Router } from 'express';
import { annualController } from '../controllers/annual.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.js';

export const annualRouter = Router();

annualRouter.get('/:year', requireAuth, (req, res, next) => {
  annualController.getAnnualPlan(req, res, next);
});

annualRouter.put('/:year', requireAuth, idempotencyMiddleware, (req, res, next) => {
  annualController.updateAnnualPlan(req, res, next);
});
