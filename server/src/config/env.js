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

  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),

  GROQ_API_KEY: z.string().optional(),
  GROQ_MODERATION_MODEL: z.string().default('llama-3.3-70b-versatile'),

  JAZZCASH_MERCHANT_ID: z.string().optional(),
  JAZZCASH_PASSWORD: z.string().optional(),
  JAZZCASH_INTEGRITY_SALT: z.string().optional(),
  JAZZCASH_RETURN_URL: z.string().url().optional(),
  // Manual-payment flow: the JazzCash mobile account users send money to.
  JAZZCASH_RECEIVER_NUMBER: z.string().default('03364514852'),
  JAZZCASH_RECEIVER_NAME: z.string().default('Blogify'),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Blog Platform <noreply@example.com>'),

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
