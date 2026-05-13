import { z } from 'zod';
import { USER_ROLES, USER_STATUSES } from '@blogplatform/shared';

export const listUsersQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().max(80).optional(),
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(USER_STATUSES).optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid user id'),
});

// Admin role is intentionally not assignable via this endpoint — promote a user
// to admin manually (seed script or direct DB edit) so a compromised admin
// account can't mint new ones.
const ASSIGNABLE_ROLES = USER_ROLES.filter((r) => r !== 'admin');

export const updateUserSchema = z
  .object({
    role: z.enum(ASSIGNABLE_ROLES).optional(),
    status: z.enum(USER_STATUSES).optional(),
    bannedReason: z.string().trim().max(280).optional(),
  })
  .refine((v) => v.role !== undefined || v.status !== undefined, {
    message: 'At least one of role or status must be provided',
  });
