import * as service from './moderation.service.js';
import { present, presentMany } from '../../utils/presenter.js';
import { ok } from '../../utils/response.js';

export async function listQueue(req, res) {
  const { items, cursor, hasMore } = await service.listQueue(req.valid.query);
  return res.json({ data: presentMany(items), page: { cursor, hasMore } });
}

export async function approve(req, res) {
  const article = await service.adminApprove(req.valid.params.id, req.user);
  return ok(res, { article: present(article) });
}

export async function reject(req, res) {
  const article = await service.adminReject(req.valid.params.id, req.user, req.valid.body);
  return ok(res, { article: present(article) });
}

export async function retry(req, res) {
  const article = await service.adminRetry(req.valid.params.id);
  return ok(res, { article: present(article) });
}
