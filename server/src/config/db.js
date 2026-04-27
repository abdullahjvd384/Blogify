import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

mongoose.set('strictQuery', true);

/** Connect to MongoDB. Throws on failure so the boot process can fail fast. */
export async function connectDb() {
  await mongoose.connect(env.MONGO_URI, {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 10_000,
  });
  logger.info({ uri: env.MONGO_URI.replace(/\/\/[^@]*@/, '//***:***@') }, 'mongo connected');
}

export async function disconnectDb() {
  await mongoose.disconnect();
  logger.info('mongo disconnected');
}

export { mongoose };
