import dns from 'node:dns';
// Prefer Google/Cloudflare DNS for SRV lookups (Atlas, Upstash) when the
// system resolver is flaky (common on some home/ISP networks).
dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);

import http from 'node:http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDb, disconnectDb } from './config/db.js';
import { redis, disconnectRedis } from './config/redis.js';
import { createApp } from './app.js';
import { startModerationWorker } from '../workers/moderation.worker.js';
import { startContentWorker } from '../workers/content.worker.js';
import { scheduleContentJobs } from './queues/content.js';

async function main() {
  await connectDb();

  // Redis powers the BullMQ queues but must NOT be fatal to boot. If it's
  // unreachable (e.g. Upstash over its monthly request quota), the web server
  // should still start, serve content from Mongo, and pass the /healthz check.
  // We only start the background workers when Redis actually answered; otherwise
  // the app runs in degraded mode (no auto-content/moderation) rather than
  // crash-looping the whole deploy.
  let redisOk = false;
  try {
    await redis.ping();
    redisOk = true;
  } catch (err) {
    logger.error(
      { err: err.message },
      'redis unavailable at boot — starting in degraded mode (background workers disabled)',
    );
  }

  const app = createApp();
  const server = http.createServer(app);

  // Single-service mode: run the workers inside the API process so one free web
  // service handles both. For scale, run a dedicated `start:worker`.
  let inlineWorker;
  let contentWorker;
  if (env.RUN_WORKER && redisOk) {
    try {
      inlineWorker = startModerationWorker();
      logger.info('moderation worker started (in-process)');

      // Automated article pipeline (OpenAI web-search research + write -> auto
      // publish). The worker runs whenever the content AI is configured (so the
      // admin "generate now" trigger works); the recurring schedule is gated on
      // AUTO_CONTENT_ENABLED.
      if (env.OPENAI_API_KEY) {
        contentWorker = startContentWorker();
        logger.info('auto-content worker started (in-process)');
        if (env.AUTO_CONTENT_ENABLED) {
          await scheduleContentJobs();
        }
      }
    } catch (err) {
      logger.error(
        { err: err.message },
        'worker/schedule init failed — continuing without background jobs',
      );
    }
  } else if (env.RUN_WORKER && !redisOk) {
    logger.warn('RUN_WORKER is set but Redis is unavailable — skipping worker startup');
  }

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'server listening');
  });

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'shutdown initiated');
    server.close(async () => {
      if (inlineWorker) {
        try {
          await inlineWorker.close();
        } catch (err) {
          logger.error({ err }, 'error closing inline worker');
        }
      }
      if (contentWorker) {
        try {
          await contentWorker.close();
        } catch (err) {
          logger.error({ err }, 'error closing content worker');
        }
      }
      try {
        await disconnectDb();
      } catch (err) {
        logger.error({ err }, 'error closing mongo');
      }
      try {
        await disconnectRedis();
      } catch (err) {
        logger.error({ err }, 'error closing redis');
      }
      logger.info('shutdown complete');
      process.exit(0);
    });
    setTimeout(() => {
      logger.warn('forced shutdown after 10s');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => logger.error({ reason }, 'unhandledRejection'));
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'uncaughtException');
    shutdown('uncaughtException');
  });
}

main().catch((err) => {
  logger.fatal({ err }, 'fatal boot error');
  process.exit(1);
});
