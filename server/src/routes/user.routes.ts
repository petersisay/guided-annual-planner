import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth.middleware';

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get('/preferences', (req, res, next) => {
  userController.getPreferences(req, res, next);
});

userRouter.put('/preferences', (req, res, next) => {
  userController.updatePreferences(req, res, next);
});

userRouter.put('/onboarding', (req, res, next) => {
  userController.completeOnboarding(req, res, next);
});
