import { z } from 'zod';
import { WITHDRAWAL_STATUSES } from '@blogplatform/shared';

const periodKey = z.string().regex(/^\d{4}-\d{2}$/, 'Period must be YYYY-MM');

export const periodQuerySchema = z.object({ periodKey });
export const closePeriodSchema = z.object({ periodKey });

export const requestWithdrawalSchema = z.object({
  amountPaisa: z.coerce.number().int().positive(),
  accountNumber: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{8,20}$/, 'Enter a valid JazzCash account number'),
});

export const withdrawalIdParamSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid id'),
});

export const adminWithdrawalsQuerySchema = z.object({
  status: z.enum(WITHDRAWAL_STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const rejectWithdrawalSchema = z.object({
  note: z.string().trim().max(280).optional(),
});
