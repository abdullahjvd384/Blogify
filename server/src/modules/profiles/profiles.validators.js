import { z } from 'zod';

export const handleParamSchema = z.object({
  handle: z.string().trim().min(1).max(30),
});

export const profileFeedQuerySchema = z.object({
  cursor: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid cursor').optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
