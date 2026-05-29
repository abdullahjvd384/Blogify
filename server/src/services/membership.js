import { Subscription } from '../models/Subscription.js';

/**
 * Single source of truth for "is this an active member?". A subscription counts
 * as a member when it's the `member` plan, active, and not past its period end
 * (null period_end = never expires, e.g. grandfathered/comped accounts).
 */
export function isMemberSub(sub) {
  if (!sub) return false;
  if (sub.plan !== 'member' || sub.status !== 'active') return false;
  if (sub.current_period_end && sub.current_period_end.getTime?.() < Date.now()) return false;
  return true;
}

/** Convenience loader: returns whether the given user is an active member. */
export async function isMember(userId) {
  const sub = await Subscription.findOne(
    { user_id: userId },
    { plan: 1, status: 1, current_period_end: 1 },
  ).lean();
  return isMemberSub(sub);
}
