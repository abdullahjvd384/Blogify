import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authOptional } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { searchQuerySchema } from './search.validators.js';
import * as ctrl from './search.controller.js';

const router = Router();

router.get('/', authOptional, validate(searchQuerySchema, 'query'), asyncHandler(ctrl.search));

export { router as searchRouter };
