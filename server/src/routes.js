import { Router } from 'express';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { articlesRouter } from './modules/articles/articles.routes.js';
import { moderationRouter } from './modules/moderation/moderation.routes.js';
import { adminUsersRouter } from './modules/users/users.routes.js';
import { subscriptionsRouter } from './modules/subscriptions/subscriptions.routes.js';
import { readsRouter } from './modules/reads/reads.routes.js';
import { paymentsRouter, adminPaymentsRouter } from './modules/payments/payments.routes.js';
import { uploadsRouter } from './modules/uploads/uploads.routes.js';
import { profilesRouter } from './modules/profiles/profiles.routes.js';
import { usersPublicRouter } from './modules/follows/follows.routes.js';
import { bookmarksRouter } from './modules/bookmarks/bookmarks.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';
import { tagsRouter } from './modules/tags/tags.routes.js';
import { searchRouter } from './modules/search/search.routes.js';

/** Mounts all v1 sub-routers. New modules add their router here. */
export function buildRouter() {
  const api = Router();
  api.use('/', healthRouter);
  api.use('/auth', authRouter);
  api.use('/articles', articlesRouter);
  api.use('/subscriptions', subscriptionsRouter);
  api.use('/reads', readsRouter);
  api.use('/uploads', uploadsRouter);
  api.use('/profiles', profilesRouter);
  api.use('/users', usersPublicRouter);
  api.use('/me/bookmarks', bookmarksRouter);
  api.use('/notifications', notificationsRouter);
  api.use('/tags', tagsRouter);
  api.use('/search', searchRouter);
  api.use('/payments', paymentsRouter);
  api.use('/admin/moderation', moderationRouter);
  api.use('/admin/users', adminUsersRouter);
  api.use('/admin/payments', adminPaymentsRouter);
  return api;
}
