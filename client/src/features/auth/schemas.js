import { z } from 'zod';
import { USERNAME_RULES, PROFILE_LIMITS } from '@blogplatform/shared';

export const loginFormSchema = z.object({
  email: z.string().email('Enter a valid email').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const signupFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: z.string().email('Enter a valid email').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const forgotPasswordFormSchema = z.object({
  email: z.string().email('Enter a valid email').toLowerCase(),
});

export const resetPasswordFormSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    confirm: z.string().min(1, 'Confirm your password'),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match",
    path: ['confirm'],
  });

export const profileFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(USERNAME_RULES.MIN, `At least ${USERNAME_RULES.MIN} characters`)
    .max(USERNAME_RULES.MAX, `At most ${USERNAME_RULES.MAX} characters`)
    .regex(new RegExp(USERNAME_RULES.PATTERN), 'Use lowercase letters, numbers, - and _'),
  bio: z.string().trim().max(PROFILE_LIMITS.BIO_MAX, `Keep it under ${PROFILE_LIMITS.BIO_MAX} characters`),
  timezone: z.string().trim().min(1, 'Timezone is required').max(64),
});

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128),
    confirm: z.string().min(1, 'Confirm your password'),
  })
  .refine((v) => v.newPassword === v.confirm, {
    message: "Passwords don't match",
    path: ['confirm'],
  });
