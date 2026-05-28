import { z } from 'zod';
import { COMMENT_LIMITS } from '@blogplatform/shared';

const objectId = z.string().regex(/^[a-f0-9]{24}$/, 'Invalid id');

export const articleIdParamSchema = z.object({
  id: objectId,
});

export const commentIdParamSchema = z.object({
  id: objectId,
  commentId: objectId,
});

export const listCommentsQuerySchema = z.object({
  cursor: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid cursor').optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  parentId: objectId.optional(),
});

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, 'Comment cannot be empty').max(COMMENT_LIMITS.MAX_BODY),
  parentId: objectId.nullable().optional(),
});

export const editCommentSchema = z.object({
  body: z.string().trim().min(1, 'Comment cannot be empty').max(COMMENT_LIMITS.MAX_BODY),
});
