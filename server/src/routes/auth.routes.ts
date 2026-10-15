import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

export const authRouter = Router();

// Strict rate-limiting on authentication endpoints (15 attempts per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
    },
  },
});

authRouter.post('/google', authLimiter, (req, res, next) => {
  authController.loginWithGoogle(req, res, next);
});

authRouter.get('/me', requireAuth, (req, res, next) => {
  authController.getCurrentUser(req, res, next);
});

authRouter.post('/logout', (req, res, next) => {
  authController.logout(req, res, next);
});

authRouter.post('/dev-login', (req, res, next) => {
  authController.loginDev(req, res, next);
});
