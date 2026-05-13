import { z } from 'zod';

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
