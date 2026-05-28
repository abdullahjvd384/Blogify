import { z } from 'zod';

export const tagParamSchema = z.object({
  tag: z.string().trim().min(1).max(40),
});
