import { z } from 'zod';
import { UPLOAD_KINDS } from '@blogplatform/shared';

export const signUploadSchema = z.object({
  kind: z.enum(UPLOAD_KINDS),
});
