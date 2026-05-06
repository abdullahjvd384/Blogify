import { z } from 'zod';
import { VOTE_VALUES } from '@blogplatform/shared';

export const articleIdParamSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid id'),
});

export const castVoteBodySchema = z.object({
  value: z
    .number({ required_error: 'value is required' })
    .int()
    .refine((v) => VOTE_VALUES.includes(v), { message: 'value must be 1 or -1' }),
});
