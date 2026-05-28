import mongoose from 'mongoose';
import { Follow } from '../../models/Follow.js';
import { User } from '../../models/User.js';
import { notify } from '../notifications/notifications.service.js';
import { ConflictError, NotFoundError } from '../../utils/errors.js';

const SUMMARY_FIELDS = { name: 1, username: 1, avatar_url: 1, bio: 1 };

function toObjId(id) {
  return new mongoose.Types.ObjectId(id);
}

/**
 * Follow a user. Idempotent: following twice is a no-op (the unique index makes
 * the second insert a duplicate, which we swallow). Keeps the denormalized
 * follower/following counters in sync, mirroring the vote-count pattern.
 */
export async function follow(followerId, targetId) {
  if (followerId === targetId) throw new ConflictError('You cannot follow yourself');

  const target = await User.findOne({ _id: targetId, deleted_at: null }, { _id: 1 }).lean();
  if (!target) throw new NotFoundError('User not found');

  try {
    await Follow.create({ follower_id: toObjId(followerId), following_id: toObjId(targetId) });
  } catch (err) {
    if (err?.code === 11000) {
      // Already following — return current count without double-incrementing.
      const current = await User.findById(targetId, { followers_count: 1 }).lean();
      return { following: true, followersCount: current?.followers_count || 0 };
    }
    throw err;
  }

  const [updatedTarget] = await Promise.all([
    User.findByIdAndUpdate(
      targetId,
      { $inc: { followers_count: 1 } },
      { new: true, projection: { followers_count: 1 } },
    ).lean(),
    User.findByIdAndUpdate(followerId, { $inc: { following_count: 1 } }).lean(),
  ]);

  await notify({ recipientId: targetId, actorId: followerId, type: 'follow' });

  return { following: true, followersCount: updatedTarget?.followers_count || 0 };
}

/** Unfollow a user. Idempotent: only decrements when an edge actually existed. */
export async function unfollow(followerId, targetId) {
  const removed = await Follow.findOneAndDelete({
    follower_id: toObjId(followerId),
    following_id: toObjId(targetId),
  });

  if (!removed) {
    const current = await User.findById(targetId, { followers_count: 1 }).lean();
    return { following: false, followersCount: current?.followers_count || 0 };
  }

  const [updatedTarget] = await Promise.all([
    User.findByIdAndUpdate(
      targetId,
      { $inc: { followers_count: -1 } },
      { new: true, projection: { followers_count: 1 } },
    ).lean(),
    User.findByIdAndUpdate(followerId, { $inc: { following_count: -1 } }).lean(),
  ]);

  return { following: false, followersCount: updatedTarget?.followers_count || 0 };
}

/** Users who follow `targetId`, newest first, cursor-paged. */
export async function listFollowers(targetId, { cursor, limit }) {
  return pageFollowEdges(
    { following_id: toObjId(targetId) },
    (edge) => edge.follower_id,
    { cursor, limit },
  );
}

/** Users that `targetId` follows, newest first, cursor-paged. */
export async function listFollowing(targetId, { cursor, limit }) {
  return pageFollowEdges(
    { follower_id: toObjId(targetId) },
    (edge) => edge.following_id,
    { cursor, limit },
  );
}

async function pageFollowEdges(filter, pickUserId, { cursor, limit }) {
  const q = { ...filter };
  if (cursor) q._id = { $lt: toObjId(cursor) };

  const edges = await Follow.find(q).sort({ _id: -1 }).limit(limit + 1).lean();
  const hasMore = edges.length > limit;
  const page = hasMore ? edges.slice(0, limit) : edges;

  const userIds = page.map((e) => pickUserId(e).toString());
  const users = await User.find({ _id: { $in: userIds }, deleted_at: null }, SUMMARY_FIELDS).lean();
  const byId = new Map(users.map((u) => [u._id.toString(), u]));

  const items = page
    .map((e) => byId.get(pickUserId(e).toString()))
    .filter(Boolean);

  return {
    items,
    cursor: page.length ? page[page.length - 1]._id.toString() : null,
    hasMore,
  };
}
