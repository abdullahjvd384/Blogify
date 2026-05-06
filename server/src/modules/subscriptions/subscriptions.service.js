import { PLANS, PLAN_KEYS, DEFAULT_PLAN } from '@blogplatform/shared';
import { Subscription } from '../../models/Subscription.js';
import { User } from '../../models/User.js';
import { getUsage } from '../../services/quota.js';

/** Static plan catalog. Source of truth lives in shared/. */
export function listPlans() {
  return PLAN_KEYS.map((key) => PLANS[key]);
}

/**
 * Returns the caller's subscription enriched with today's usage.
 * If a Subscription row is missing (legacy data), we lazily create a free one.
 */
export async function getMine(userId) {
  let sub = await Subscription.findOne({ user_id: userId }).lean();
  if (!sub) {
    sub = (
      await Subscription.create({ user_id: userId, plan: DEFAULT_PLAN, status: 'active' })
    ).toObject();
  }

  const user = await User.findById(userId, { timezone: 1 }).lean();
  const tz = user?.timezone || 'Asia/Karachi';
  const usage = await getUsage(userId, sub.plan, tz);

  return { subscription: sub, usage, plan: PLANS[sub.plan] || PLANS[DEFAULT_PLAN] };
}
