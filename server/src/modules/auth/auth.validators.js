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

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(128),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(32).max(128),
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    timezone: z.string().trim().min(1).max(64).optional(),
  })
  .refine((v) => v.name !== undefined || v.timezone !== undefined, {
    message: 'Provide at least one field to update',
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});
