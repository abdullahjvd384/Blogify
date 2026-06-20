import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  MONGO_URI: z.string().url(),
  REDIS_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: z
    .union([z.string(), z.boolean()])
    .transform((v) => (typeof v === 'string' ? v === 'true' : v))
    .default(false),
  // 'lax' works for same-origin (single-service) deploys; switch to 'none'
  // (requires COOKIE_SECURE=true) when the SPA and API live on different domains.
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),

  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),

  // When true, Express serves the built React app (client/dist) and falls back
  // to index.html for client-side routes. Enables a single-service deploy.
  SERVE_CLIENT: z
    .union([z.string(), z.boolean()])
    .transform((v) => (typeof v === 'string' ? v === 'true' : v))
    .default(false),

  // When true, the moderation BullMQ worker boots inside the API process instead
  // of a separate `start:worker` process. Lets one free web service do both.
  RUN_WORKER: z
    .union([z.string(), z.boolean()])
    .transform((v) => (typeof v === 'string' ? v === 'true' : v))
    .default(false),

  GROQ_API_KEY: z.string().optional(),
  GROQ_MODERATION_MODEL: z.string().default('llama-3.3-70b-versatile'),

  JAZZCASH_MERCHANT_ID: z.string().optional(),
  JAZZCASH_PASSWORD: z.string().optional(),
  JAZZCASH_INTEGRITY_SALT: z.string().optional(),
  JAZZCASH_RETURN_URL: z.string().url().optional(),
  // Manual-payment flow: the JazzCash mobile account users send money to.
  JAZZCASH_RECEIVER_NUMBER: z.string().default('03364514852'),
  JAZZCASH_RECEIVER_NAME: z.string().default('Blogify'),

  // Stripe (USD card payments). Optional so the app boots without it; the
  // checkout endpoint returns a clear error if a session is requested while unset.
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Blog Platform <noreply@example.com>'),

  // Cloudinary image hosting. Optional so the app boots without it; the uploads
  // endpoint throws a clear error if a signature is requested while unset.
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default('blog'),

  SENTRY_DSN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

/** Validated, immutable environment configuration. */
export const env = Object.freeze(parsed.data);

export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
