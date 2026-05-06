import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authRequired } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { readBodySchema } from './reads.validators.js';
import * as ctrl from './reads.controller.js';

const router = Router();

router.use(authRequired);

router.post('/start', validate(readBodySchema), asyncHandler(ctrl.start));
router.post('/heartbeat', validate(readBodySchema), asyncHandler(ctrl.heartbeat));
router.post('/end', validate(readBodySchema), asyncHandler(ctrl.end));

export { router as readsRouter };
