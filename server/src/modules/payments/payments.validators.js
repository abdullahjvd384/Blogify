import { z } from 'zod';
import { PAYMENT_STATUSES, PLAN_KEYS } from '@blogplatform/shared';

export const checkoutBodySchema = z.object({
  planKey: z.enum(PLAN_KEYS),
});

export const txnRefParamSchema = z.object({
  txnRefNo: z.string().min(1).max(40),
});

const PAID_PLANS = PLAN_KEYS.filter((k) => k !== 'free');

export const manualSubmitSchema = z.object({
  planKey: z.enum(PAID_PLANS),
  txnRefNo: z
    .string()
    .trim()
    .min(4, 'Transaction ID must be at least 4 characters')
    .max(40),
  senderPhone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{8,20}$/, 'Enter a valid phone number'),
  note: z.string().trim().max(280).optional(),
});

export const minePaymentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const adminPaymentsQuerySchema = z.object({
  status: z.enum(PAYMENT_STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const paymentIdParamSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid payment id'),
});

export const rejectPaymentSchema = z.object({
  reason: z.string().trim().min(1, 'Reason is required').max(280),
});
