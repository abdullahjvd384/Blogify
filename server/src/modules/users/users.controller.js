import * as service from './users.service.js';
import { present, presentMany } from '../../utils/presenter.js';
import { ok } from '../../utils/response.js';

const presentUser = (u) => present(u, { omit: ['password_hash'] });

export async function list(req, res) {
  const { items, cursor, hasMore } = await service.listUsers(req.valid.query);
  return res.json({ data: presentMany(items, { omit: ['password_hash'] }), page: { cursor, hasMore } });
}

export async function update(req, res) {
  const user = await service.adminUpdate(req.valid.params.id, req.user, req.valid.body);
  return ok(res, { user: presentUser(user) });
}

export async function stats(_req, res) {
  return ok(res, await service.getStats());
}
