import * as service from './reads.service.js';
import { ok } from '../../utils/response.js';

export async function start(req, res) {
  const result = await service.start(req.user.id, req.valid.body.articleId);
  return ok(res, result, 201);
}

export async function heartbeat(req, res) {
  const result = await service.heartbeat(req.user.id, req.valid.body.articleId);
  return ok(res, result);
}

export async function end(req, res) {
  const result = await service.end(req.user.id, req.valid.body.articleId, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  return ok(res, result);
}
