import mongoose from 'mongoose';
import { Comment } from '../../models/Comment.js';
import { Article } from '../../models/Article.js';
import { User } from '../../models/User.js';
import { notify } from '../notifications/notifications.service.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors.js';

const AUTHOR_FIELDS = { name: 1, username: 1, avatar_url: 1 };

function toObjId(id) {
  return new mongoose.Types.ObjectId(id);
}

/**
 * Lists comments for an article, newest first, cursor-paged. Top-level comments
 * by default; pass parentId to list the replies under one comment. Deleted
 * comments are returned as tombstones (body null) so reply threads stay intact.
 */
export async function listForArticle(articleId, { cursor, limit, parentId }) {
  const filter = {
    article_id: toObjId(articleId),
    parent_id: parentId ? toObjId(parentId) : null,
  };
  if (cursor) filter._id = { $lt: toObjId(cursor) };

  const docs = await Comment.find(filter).sort({ _id: -1 }).limit(limit + 1).lean();
  const hasMore = docs.length > limit;
  const page = hasMore ? docs.slice(0, limit) : docs;

  const items = await attachCommentAuthors(page);
  return {
    items,
    cursor: page.length ? page[page.length - 1]._id.toString() : null,
    hasMore,
  };
}

export async function create(articleId, authorId, { body, parentId }) {
  const article = await Article.findOne(
    { _id: articleId, deleted_at: null },
    { status: 1, author_id: 1 },
  ).lean();
  if (!article) throw new NotFoundError('Article not found');
  if (article.status !== 'published') {
    throw new ConflictError('Cannot comment on an unpublished article');
  }

  let parent = null;
  if (parentId) {
    parent = await Comment.findOne({ _id: parentId, article_id: toObjId(articleId) });
    if (!parent || parent.status === 'deleted') throw new NotFoundError('Parent comment not found');
    // One level of nesting only (Medium-style responses).
    if (parent.parent_id) throw new ValidationError('Replies cannot be nested further');
  }

  const comment = await Comment.create({
    article_id: toObjId(articleId),
    author_id: toObjId(authorId),
    parent_id: parent ? parent._id : null,
    body,
  });

  await Article.findByIdAndUpdate(articleId, { $inc: { 'stats_snapshot.comments_count': 1 } });
  if (parent) {
    await Comment.findByIdAndUpdate(parent._id, { $inc: { replies_count: 1 } });
    // A reply notifies the parent comment's author.
    await notify({
      recipientId: parent.author_id,
      actorId: authorId,
      type: 'reply',
      articleId: article._id,
      commentId: comment._id,
    });
  } else {
    // A top-level comment notifies the article's author.
    await notify({
      recipientId: article.author_id,
      actorId: authorId,
      type: 'comment',
      articleId: article._id,
      commentId: comment._id,
    });
  }

  const [presented] = await attachCommentAuthors([comment.toObject()]);
  return presented;
}

export async function edit(commentId, actor, body) {
  const comment = await Comment.findById(commentId);
  if (!comment || comment.status === 'deleted') throw new NotFoundError('Comment not found');
  assertOwnerOrAdmin(comment, actor);
  comment.body = body;
  comment.edited_at = new Date();
  await comment.save();
  const [presented] = await attachCommentAuthors([comment.toObject()]);
  return presented;
}

export async function remove(commentId, actor) {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new NotFoundError('Comment not found');
  assertOwnerOrAdmin(comment, actor);
  if (comment.status === 'deleted') return { deleted: true };

  comment.status = 'deleted';
  comment.body = '';
  await comment.save();

  await Article.findByIdAndUpdate(comment.article_id, {
    $inc: { 'stats_snapshot.comments_count': -1 },
  });
  if (comment.parent_id) {
    await Comment.findByIdAndUpdate(comment.parent_id, { $inc: { replies_count: -1 } });
  }
  return { deleted: true };
}

function assertOwnerOrAdmin(comment, actor) {
  if (!actor?.id) throw new ForbiddenError();
  if (actor.role === 'admin') return;
  if (comment.author_id.toString() !== actor.id) {
    throw new ForbiddenError('You can only modify your own comments');
  }
}

async function attachCommentAuthors(docs) {
  if (!docs.length) return [];
  const ids = [...new Set(docs.map((d) => d.author_id.toString()))];
  const users = await User.find({ _id: { $in: ids } }, AUTHOR_FIELDS).lean();
  const byId = new Map(users.map((u) => [u._id.toString(), u]));
  return docs.map((d) => {
    const u = byId.get(d.author_id.toString());
    const isDeleted = d.status === 'deleted';
    return {
      id: d._id.toString(),
      articleId: d.article_id.toString(),
      parentId: d.parent_id ? d.parent_id.toString() : null,
      body: isDeleted ? null : d.body,
      status: d.status,
      repliesCount: d.replies_count || 0,
      editedAt: d.edited_at || null,
      createdAt: d.created_at,
      author: u
        ? {
            id: u._id.toString(),
            name: u.name,
            username: u.username || null,
            avatarUrl: u.avatar_url || null,
          }
        : null,
    };
  });
}
