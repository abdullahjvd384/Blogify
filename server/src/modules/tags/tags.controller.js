import * as service from './tags.service.js';
import { ok } from '../../utils/response.js';

export async function follow(req, res) {
  return ok(res, await service.follow(req.user.id, req.valid.params.tag));
}

export async function unfollow(req, res) {
  return ok(res, await service.unfollow(req.user.id, req.valid.params.tag));
}

export async function getTag(req, res) {
  return ok(res, { tag: await service.getTag(req.valid.params.tag, req.user?.id) });
}

export async function listFollowed(req, res) {
  return ok(res, { tags: await service.listFollowedTags(req.user.id) });
}
