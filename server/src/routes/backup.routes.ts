import { Router } from 'express';
import { backupController } from '../controllers/backup.controller';
import { requireAuth } from '../middleware/auth.middleware';

export const backupRouter = Router();

backupRouter.get('/export', requireAuth, (req, res, next) => {
  backupController.exportBackup(req, res, next);
});

backupRouter.post('/validate', requireAuth, (req, res, next) => {
  backupController.validateBackup(req, res, next);
});

backupRouter.post('/restore', requireAuth, (req, res, next) => {
  backupController.restoreBackup(req, res, next);
});
