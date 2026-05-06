import { z } from 'zod';
import { PLAN_KEYS } from '@blogplatform/shared';

export const checkoutBodySchema = z.object({
  planKey: z.enum(PLAN_KEYS),
});

export const txnRefParamSchema = z.object({
  txnRefNo: z.string().min(1).max(40),
});
