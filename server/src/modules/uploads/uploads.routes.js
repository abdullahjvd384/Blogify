import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authRequired } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { signUploadSchema } from './uploads.validators.js';
import * as ctrl from './uploads.controller.js';

const router = Router();

router.post('/signature', authRequired, validate(signUploadSchema), asyncHandler(ctrl.sign));

export { router as uploadsRouter };
