import * as service from './uploads.service.js';
import { ok } from '../../utils/response.js';
import { ForbiddenError } from '../../utils/errors.js';

export async function sign(req, res) {
  const { kind } = req.valid.body;
  // Article images are writer-only; avatars are allowed for any signed-in user.
  if (kind !== 'avatar' && req.user.role !== 'writer' && req.user.role !== 'admin') {
    throw new ForbiddenError('Only writers can upload article images');
  }
  const payload = service.getUploadSignature(kind);
  return ok(res, payload);
}
