import * as service from './comments.service.js';
import { ok, created } from '../../utils/response.js';

export async function list(req, res) {
  const { items, cursor, hasMore } = await service.listForArticle(req.valid.params.id, req.valid.query);
  // Service already returns API-shaped (camelCase) objects.
  return res.json({ data: items, page: { cursor, hasMore } });
}

export async function create(req, res) {
  const comment = await service.create(req.valid.params.id, req.user.id, req.valid.body);
  return created(res, { comment });
}

export async function edit(req, res) {
  const comment = await service.edit(req.valid.params.commentId, req.user, req.valid.body.body);
  return ok(res, { comment });
}

export async function remove(req, res) {
  const result = await service.remove(req.valid.params.commentId, req.user);
  return ok(res, result);
}
