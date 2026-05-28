import * as service from './notifications.service.js';
import { ok } from '../../utils/response.js';

export async function list(req, res) {
  const { items, cursor, hasMore } = await service.list(req.user.id, req.valid.query);
  return res.json({ data: items, page: { cursor, hasMore } });
}

export async function unreadCount(req, res) {
  return ok(res, await service.unreadCount(req.user.id));
}

export async function markRead(req, res) {
  return ok(res, await service.markRead(req.user.id, req.valid.params.id));
}

export async function markAllRead(req, res) {
  return ok(res, await service.markAllRead(req.user.id));
}
