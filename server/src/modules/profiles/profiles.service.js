import mongoose from 'mongoose';
import { User } from '../../models/User.js';
import { Follow } from '../../models/Follow.js';
import { NotFoundError } from '../../utils/errors.js';

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

// Fields safe to expose on a public profile.
const PUBLIC_FIELDS = {
  name: 1,
  username: 1,
  bio: 1,
  avatar_url: 1,
  role: 1,
  followers_count: 1,
  following_count: 1,
  created_at: 1,
};

/**
 * Resolves a profile by handle, which may be either a 24-hex ObjectId or a
 * username. Excludes soft-deleted users. Returns the lean user doc or throws.
 */
export async function resolveUser(handle, projection = PUBLIC_FIELDS) {
  const query = OBJECT_ID_RE.test(handle)
    ? { _id: new mongoose.Types.ObjectId(handle) }
    : { username: handle.toLowerCase() };
  const user = await User.findOne({ ...query, deleted_at: null }, projection).lean();
  if (!user) throw new NotFoundError('Profile not found');
  return user;
}

/**
 * Public profile + viewer-relative flags (is_following / is_me).
 */
export async function getProfile(handle, viewerId) {
  const user = await resolveUser(handle);
  const isMe = Boolean(viewerId) && user._id.toString() === viewerId;
  let isFollowing = false;
  if (viewerId && !isMe) {
    isFollowing = Boolean(
      await Follow.exists({ follower_id: viewerId, following_id: user._id }),
    );
  }
  return { ...user, is_me: isMe, is_following: isFollowing };
}
