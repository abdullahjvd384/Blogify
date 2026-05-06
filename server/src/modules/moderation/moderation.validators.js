import { z } from 'zod';

const objectIdRegex = /^[a-f0-9]{24}$/;

export const moderationIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid id'),
});

export const moderationQueueQuerySchema = z.object({
  cursor: z.string().regex(objectIdRegex).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(['needs_review', 'submitted', 'in_review', 'rejected']).default('needs_review'),
});

export const adminRejectBodySchema = z.object({
  reasons: z
    .array(z.string().trim().min(1).max(200))
    .min(1, 'At least one reason is required')
    .max(5),
});

export const adminApproveBodySchema = z
  .object({
    note: z.string().trim().max(200).optional(),
  })
  .partial()
  .default({});
