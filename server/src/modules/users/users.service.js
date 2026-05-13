import mongoose from 'mongoose';
import { User } from '../../models/User.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors.js';

const PROJECTION = { password_hash: 0 };

export async function listUsers({ cursor, limit, q, role, status }) {
  const filter = {};
  if (cursor) filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ email: new RegExp(safe, 'i') }, { name: new RegExp(safe, 'i') }];
  }

  const docs = await User.find(filter, PROJECTION)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();
  const hasMore = docs.length > limit;
  const items = hasMore ? docs.slice(0, limit) : docs;
  return {
    items,
    cursor: items.length ? items[items.length - 1]._id.toString() : null,
    hasMore,
  };
}

/**
 * Admin update: change role or status (ban/unban). Guard against the admin
 * locking themselves out by ban or demoting their own role.
 */
export async function adminUpdate(userId, admin, patch) {
  if (admin.id === userId) {
    if (patch.role && patch.role !== 'admin') {
      throw new ValidationError("You can't change your own role");
    }
    if (patch.status && patch.status !== 'active') {
      throw new ValidationError("You can't ban or delete yourself");
    }
  }

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  if (patch.role !== undefined) {
    user.role = patch.role;
  }

  if (patch.status !== undefined) {
    if (patch.status === 'banned') {
      user.banned_at = new Date();
      user.banned_reason = patch.bannedReason || null;
    } else if (patch.status === 'deleted') {
      user.deleted_at = new Date();
    } else if (patch.status === 'active') {
      // Reactivating: clear ban/delete markers.
      user.banned_at = null;
      user.banned_reason = null;
      user.deleted_at = null;
    }
    user.status = patch.status;
  }

  await user.save();
  const obj = user.toObject();
  delete obj.password_hash;
  return obj;
}

export async function getStats() {
  const [total, byRole, byStatus] = await Promise.all([
    User.countDocuments(),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  return {
    total,
    byRole: Object.fromEntries(byRole.map((r) => [r._id, r.count])),
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
  };
}
