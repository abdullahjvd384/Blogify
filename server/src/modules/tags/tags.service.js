import mongoose from 'mongoose';
import { TagFollow } from '../../models/TagFollow.js';
import { Article } from '../../models/Article.js';

function toObjId(id) {
  return new mongoose.Types.ObjectId(id);
}

function normalizeTag(tag) {
  return String(tag || '').toLowerCase().trim();
}

export async function follow(userId, rawTag) {
  const tag = normalizeTag(rawTag);
  try {
    await TagFollow.create({ user_id: toObjId(userId), tag });
  } catch (err) {
    if (err?.code !== 11000) throw err; // already following → idempotent
  }
  return { tag, following: true };
}

export async function unfollow(userId, rawTag) {
  const tag = normalizeTag(rawTag);
  await TagFollow.deleteOne({ user_id: toObjId(userId), tag });
  return { tag, following: false };
}

/** Tag overview: article count, follower count, and the viewer's follow state. */
export async function getTag(rawTag, viewerId) {
  const tag = normalizeTag(rawTag);
  const [articleCount, followerCount, isFollowing] = await Promise.all([
    Article.countDocuments({ status: 'published', deleted_at: null, tags: tag }),
    TagFollow.countDocuments({ tag }),
    viewerId ? TagFollow.exists({ user_id: toObjId(viewerId), tag }).then(Boolean) : false,
  ]);
  return { tag, articleCount, followerCount, isFollowing };
}

/** Tags the user follows (plain strings). */
export async function listFollowedTags(userId) {
  const rows = await TagFollow.find({ user_id: toObjId(userId) }).sort({ _id: -1 }).lean();
  return rows.map((r) => r.tag);
}
