import { Router } from 'express';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { articlesRouter } from './modules/articles/articles.routes.js';
import { moderationRouter } from './modules/moderation/moderation.routes.js';
import { subscriptionsRouter } from './modules/subscriptions/subscriptions.routes.js';

/** Mounts all v1 sub-routers. New modules add their router here. */
export function buildRouter() {
  const api = Router();
  api.use('/', healthRouter);
  api.use('/auth', authRouter);
  api.use('/articles', articlesRouter);
  api.use('/subscriptions', subscriptionsRouter);
  api.use('/admin/moderation', moderationRouter);
  return api;
}
