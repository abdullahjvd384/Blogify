import * as service from './bookmarks.service.js';
import { presentMany } from '../../utils/presenter.js';
import { ok } from '../../utils/response.js';

export async function list(req, res) {
  const { items, cursor, hasMore } = await service.list(req.user.id, req.valid.query);
  return res.json({ data: presentMany(items), page: { cursor, hasMore } });
}

export async function isSaved(req, res) {
  const result = await service.isSaved(req.user.id, req.valid.params.articleId);
  return ok(res, result);
}

export async function save(req, res) {
  const result = await service.save(req.user.id, req.valid.params.articleId);
  return ok(res, result);
}

export async function remove(req, res) {
  const result = await service.remove(req.user.id, req.valid.params.articleId);
  return ok(res, result);
}
