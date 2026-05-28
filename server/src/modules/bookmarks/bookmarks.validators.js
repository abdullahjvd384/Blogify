import { z } from 'zod';

export const articleIdParamSchema = z.object({
  articleId: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid article id'),
});

export const bookmarkListQuerySchema = z.object({
  cursor: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid cursor').optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
