import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { API_PREFIX } from '@blogplatform/shared';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { requestId } from './middleware/requestId.js';
import { errorHandler } from './middleware/error.js';
import { notFound } from './middleware/notFound.js';
import { asyncHandler } from './utils/asyncHandler.js';
import { stripeWebhook } from './modules/payments/payments.controller.js';
import { buildRouter } from './routes.js';
import { spaHandler, sitemapHandler, rssHandler } from './seo.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  // Disable CSP when this process also serves the SPA: the React build loads
  // remote images (Cloudinary) and the strict default policy would block them.
  app.use(helmet(env.SERVE_CLIENT ? { contentSecurityPolicy: false } : undefined));
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );
  app.use(cookieParser());

  // Stripe webhook must receive the raw body for signature verification, so it
  // is registered BEFORE the JSON body parser runs.
  app.post(
    `${API_PREFIX}/payments/webhook/stripe`,
    express.raw({ type: 'application/json' }),
    asyncHandler(stripeWebhook),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id,
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );

  app.use(API_PREFIX, buildRouter());

  // Single-service mode: serve the built SPA and let client-side routing handle
  // any non-API path. API 404s still fall through to `notFound` below.
  if (env.SERVE_CLIENT) {
    const clientDist = path.resolve(fileURLToPath(import.meta.url), '../../../client/dist');
    // Dynamic sitemap + RSS (before static so they aren't shadowed by a missing file).
    app.get('/sitemap.xml', asyncHandler(sitemapHandler));
    app.get('/rss.xml', asyncHandler(rssHandler));
    // Static assets (JS/CSS/images, robots.txt, favicon, manifest). Serves
    // index.html with default meta for "/".
    app.use(express.static(clientDist));
    // SPA fallback with per-article server-side SEO meta injection.
    app.get('*', (req, res, next) => {
      if (req.path.startsWith(API_PREFIX)) return next();
      return asyncHandler(spaHandler)(req, res, next);
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
