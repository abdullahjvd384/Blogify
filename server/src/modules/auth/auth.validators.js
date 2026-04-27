import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long');

export const signupSchema = z.object({
  email: z.string().email().max(254).toLowerCase(),
  password: passwordSchema,
  name: z.string().min(1).max(80).trim(),
  timezone: z.string().min(1).max(64).optional(),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});
