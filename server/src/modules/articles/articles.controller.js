import * as service from './articles.service.js';
import { present, presentMany } from '../../utils/presenter.js';
import { ok, created, noContent } from '../../utils/response.js';

const presentArticle = (doc) => present(doc);

export async function create(req, res) {
  const article = await service.createDraft(req.user.id, req.valid.body);
  return created(res, { article: presentArticle(article) });
}

export async function update(req, res) {
  const article = await service.updateArticle(req.valid.params.id, req.user, req.valid.body);
  return ok(res, { article: presentArticle(article) });
}

export async function remove(req, res) {
  await service.softDelete(req.valid.params.id, req.user);
  return noContent(res);
}

export async function submit(req, res) {
  const article = await service.submitForReview(req.valid.params.id, req.user);
  return ok(res, { article: presentArticle(article) });
}

export async function getBySlug(req, res) {
  const article = await service.getBySlug(req.valid.params.slug, req.user);
  return ok(res, { article: presentArticle(article) });
}

export async function listFeed(req, res) {
  const { items, cursor, hasMore } = await service.listFeed(req.valid.query);
  return res.json({ data: presentMany(items), page: { cursor, hasMore } });
}

export async function listMine(req, res) {
  const { items, cursor, hasMore } = await service.listMine(req.user.id, req.valid.query);
  return res.json({ data: presentMany(items), page: { cursor, hasMore } });
}

export async function getMineById(req, res) {
  const article = await service.getMineById(req.user.id, req.valid.params.id, req.user);
  return ok(res, { article: presentArticle(article) });
}
