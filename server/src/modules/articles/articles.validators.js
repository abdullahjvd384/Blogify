import { z } from 'zod';

const tagsSchema = z
  .array(z.string().trim().min(1).max(40))
  .max(8)
  .default([])
  .transform((tags) => Array.from(new Set(tags.map((t) => t.toLowerCase()))));

export const createArticleSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(50_000).default(''),
  excerpt: z.string().trim().max(280).optional(),
  tags: tagsSchema,
  coverImageUrl: z.string().url().max(2048).optional(),
});

export const updateArticleSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().max(50_000).optional(),
    excerpt: z.string().trim().max(280).optional(),
    tags: tagsSchema.optional(),
    coverImageUrl: z.string().url().max(2048).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

export const articleIdParamSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid id'),
});

export const articleSlugParamSchema = z.object({
  slug: z.string().min(1).max(80),
});

export const feedQuerySchema = z.object({
  cursor: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid cursor').optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  tag: z.string().trim().min(1).max(40).optional(),
  authorId: z.string().regex(/^[a-f0-9]{24}$/).optional(),
});

export const minePagedQuerySchema = z.object({
  status: z.string().optional(),
  cursor: z.string().regex(/^[a-f0-9]{24}$/).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
