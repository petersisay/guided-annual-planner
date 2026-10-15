import { Router } from 'express';
import { trackerController } from '../controllers/tracker.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware';

export const trackerRouter = Router();

// --- MOOD TRACKER ROUTES ---
trackerRouter.get('/mood/:year', requireAuth, (req, res, next) => {
  trackerController.getMoodsForYear(req, res, next);
});

trackerRouter.post('/mood', requireAuth, idempotencyMiddleware, (req, res, next) => {
  trackerController.upsertMoodEntry(req, res, next);
});

trackerRouter.delete('/mood/:date', requireAuth, idempotencyMiddleware, (req, res, next) => {
  trackerController.deleteMoodEntry(req, res, next);
});

// --- HABIT TRACKER ROUTES ---
trackerRouter.get('/habits', requireAuth, (req, res, next) => {
  trackerController.getHabits(req, res, next);
});

trackerRouter.post('/habits', requireAuth, idempotencyMiddleware, (req, res, next) => {
  trackerController.createHabit(req, res, next);
});

trackerRouter.put('/habits/:id', requireAuth, idempotencyMiddleware, (req, res, next) => {
  trackerController.updateHabit(req, res, next);
});

trackerRouter.post('/habits/:id/toggle', requireAuth, idempotencyMiddleware, (req, res, next) => {
  trackerController.toggleHabitDate(req, res, next);
});

trackerRouter.delete('/habits/:id', requireAuth, idempotencyMiddleware, (req, res, next) => {
  trackerController.deleteHabit(req, res, next);
});
