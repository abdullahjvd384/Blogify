import { PLANS, PLAN_KEYS, DEFAULT_PLAN } from '@blogplatform/shared';
import { Subscription } from '../../models/Subscription.js';
import { User } from '../../models/User.js';
import { getMeterUsage } from '../../services/meter.js';
import { isMemberSub } from '../../services/membership.js';

/** Static plan catalog. Source of truth lives in shared/. */
export function listPlans() {
  return PLAN_KEYS.map((key) => PLANS[key]);
}

/**
 * Returns the caller's subscription + membership status. For non-members we also
 * include the free member-only-story meter usage; members read unlimited so the
 * meter is omitted. Lazily creates a free subscription for legacy rows.
 */
export async function getMine(userId) {
  let sub = await Subscription.findOne({ user_id: userId }).lean();
  if (!sub) {
    sub = (
      await Subscription.create({ user_id: userId, plan: DEFAULT_PLAN, status: 'active' })
    ).toObject();
  }

  const member = isMemberSub(sub);
  let usage = null;
  if (!member) {
    const user = await User.findById(userId, { timezone: 1 }).lean();
    const tz = user?.timezone || 'Asia/Karachi';
    usage = await getMeterUsage(userId, tz);
  }

  return {
    subscription: sub,
    isMember: member,
    usage, // null for members; meter snapshot for free users
    plan: PLANS[sub.plan] || PLANS[DEFAULT_PLAN],
  };
}
