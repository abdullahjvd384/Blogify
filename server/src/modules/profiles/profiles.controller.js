import * as service from './profiles.service.js';
import * as articlesService from '../articles/articles.service.js';
import { present, presentMany } from '../../utils/presenter.js';
import { ok } from '../../utils/response.js';

export async function getProfile(req, res) {
  const profile = await service.getProfile(req.valid.params.handle, req.user?.id);
  return ok(res, { profile: present(profile) });
}

export async function listArticles(req, res) {
  const user = await service.resolveUser(req.valid.params.handle, { _id: 1 });
  const { items, cursor, hasMore } = await articlesService.listFeed({
    ...req.valid.query,
    authorId: user._id.toString(),
  });
  return res.json({ data: presentMany(items), page: { cursor, hasMore } });
}
