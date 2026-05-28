import * as service from './follows.service.js';
import { presentMany } from '../../utils/presenter.js';
import { ok } from '../../utils/response.js';

export async function follow(req, res) {
  const result = await service.follow(req.user.id, req.valid.params.id);
  return ok(res, result);
}

export async function unfollow(req, res) {
  const result = await service.unfollow(req.user.id, req.valid.params.id);
  return ok(res, result);
}

export async function listFollowers(req, res) {
  const { items, cursor, hasMore } = await service.listFollowers(req.valid.params.id, req.valid.query);
  return res.json({ data: presentMany(items), page: { cursor, hasMore } });
}

export async function listFollowing(req, res) {
  const { items, cursor, hasMore } = await service.listFollowing(req.valid.params.id, req.valid.query);
  return res.json({ data: presentMany(items), page: { cursor, hasMore } });
}
