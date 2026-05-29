import * as service from './subscriptions.service.js';
import { present } from '../../utils/presenter.js';
import { ok } from '../../utils/response.js';

export async function listPlans(_req, res) {
  return ok(res, { plans: service.listPlans() });
}

export async function getMine(req, res) {
  const { subscription, isMember, usage, plan } = await service.getMine(req.user.id);
  return ok(res, {
    subscription: present(subscription),
    isMember,
    usage,
    plan,
  });
}
