import * as service from './search.service.js';
import { presentMany } from '../../utils/presenter.js';
import { ok } from '../../utils/response.js';

export async function search(req, res) {
  const { q, limit } = req.valid.query;
  const { articles, people, tags } = await service.search(q, limit);
  return ok(res, { articles: presentMany(articles), people, tags });
}
