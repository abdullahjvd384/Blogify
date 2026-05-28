import { z } from 'zod';

export const notificationListQuerySchema = z.object({
  cursor: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid cursor').optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const notificationIdParamSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid id'),
});
