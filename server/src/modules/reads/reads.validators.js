import { z } from 'zod';

const objectIdRegex = /^[a-f0-9]{24}$/;

export const readBodySchema = z.object({
  articleId: z.string().regex(objectIdRegex, 'Invalid articleId'),
});
