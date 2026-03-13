import { Router } from 'express';
import { adminLogin, requireAdmin } from '../middleware/adminAuth.middleware.js';
import rateLimit from 'express-rate-limit';
import * as logsController from '../controllers/admin.logs.controller.js';
import * as promptsController from '../controllers/admin.prompts.controller.js';
import * as analyticsController from '../controllers/admin.analytics.controller.js';
import * as usersController from '../controllers/admin.users.controller.js';
import * as healthController from '../controllers/admin.health.controller.js';
import * as copilotQuestionsController from '../controllers/admin.copilotQuestions.controller.js';

const router = Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

router.post('/auth/login', loginLimiter, adminLogin);
router.post('/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});
router.get('/auth/check', requireAdmin, (req, res) =>
  res.json({ authenticated: true })
);

router.use(requireAdmin);

// Prompts — /active before /:key to match correctly
router.get('/prompts', promptsController.list);
router.get('/prompts/:key/active', promptsController.getActive);
router.get('/prompts/:key', promptsController.getVersions);
router.post('/prompts/:key', promptsController.saveDraft);
router.post('/prompts/:key/publish', promptsController.publish);
router.post('/prompts/:key/rollback/:v', promptsController.rollback);
router.post('/prompts/test', promptsController.test);

// Logs — export and session before :id to avoid param collision
router.get('/logs', logsController.list);
router.get('/logs/export', logsController.exportCsv);
router.get('/logs/session/:sessionId', logsController.session);
router.get('/logs/:id', logsController.detail);

// Analytics
router.get('/analytics/tokens', analyticsController.tokens);
router.get('/analytics/conversations', analyticsController.conversations);

// Users
router.get('/users', usersController.list);
router.get('/users/:id', usersController.detail);
router.get('/users/:id/logs', usersController.logs);
router.post('/users/:id/upgrade', usersController.upgrade);
router.post('/users/:id/reset-limit', usersController.resetLimit);
router.post('/users/:id/suspend', usersController.suspend);
router.post('/users/:id/unsuspend', usersController.unsuspend);

// Health
router.get('/health', healthController.status);

// Co-Pilot Quick Questions (Q&A for suggested prompts)
router.get('/copilot-questions', copilotQuestionsController.list);
router.put('/copilot-questions/:id', copilotQuestionsController.update);

export default router;
