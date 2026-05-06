import * as service from './votes.service.js';
import { ok } from '../../utils/response.js';

export async function cast(req, res) {
  const { totals, myVote } = await service.castVote(
    req.user.id,
    req.valid.params.id,
    req.valid.body.value,
  );
  return ok(res, { totals, myVote });
}

export async function clear(req, res) {
  const { totals, myVote } = await service.clearVote(req.user.id, req.valid.params.id);
  return ok(res, { totals, myVote });
}
