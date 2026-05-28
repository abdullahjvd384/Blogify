import { z } from 'zod';
import { USERNAME_RULES, PROFILE_LIMITS } from '@blogplatform/shared';

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

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(USERNAME_RULES.MIN, `Username must be at least ${USERNAME_RULES.MIN} characters`)
  .max(USERNAME_RULES.MAX, `Username must be at most ${USERNAME_RULES.MAX} characters`)
  .regex(new RegExp(USERNAME_RULES.PATTERN), 'Use only lowercase letters, numbers, - and _');

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    timezone: z.string().trim().min(1).max(64).optional(),
    username: usernameSchema.optional(),
    bio: z.string().trim().max(PROFILE_LIMITS.BIO_MAX).optional(),
    avatarUrl: z.string().url().max(2048).nullable().optional(),
  })
  .refine(
    (v) =>
      v.name !== undefined ||
      v.timezone !== undefined ||
      v.username !== undefined ||
      v.bio !== undefined ||
      v.avatarUrl !== undefined,
    { message: 'Provide at least one field to update' },
  );

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});
