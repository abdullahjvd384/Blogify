import { Router } from 'express';
import mongoose from 'mongoose';
import { redis } from '../../config/redis.js';
import { ok } from '../../utils/response.js';

const router = Router();

router.get('/healthz', (_req, res) => {
  ok(res, { status: 'ok', uptime: process.uptime() });
});

router.get('/readyz', async (_req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  let redisOk = false;
  try {
    redisOk = (await redis.ping()) === 'PONG';
  } catch {
    redisOk = false;
  }
  const ready = mongoOk && redisOk;
  res.status(ready ? 200 : 503).json({
    data: { status: ready ? 'ready' : 'degraded', mongo: mongoOk, redis: redisOk },
  });
});

export { router as healthRouter };
