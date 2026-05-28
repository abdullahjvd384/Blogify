import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

let configured = false;

function ensureConfigured() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary is not configured (set CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)');
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
}

export function isConfigured() {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
  );
}

/**
 * Generates a short-lived signature so the browser can upload an image directly
 * to Cloudinary. The signed params pin the destination folder, so a leaked
 * client signature can't write outside its namespace. Format/size limits are
 * additionally enforced by the Cloudinary upload preset (dashboard) and by the
 * client before upload.
 *
 * @param {string} folder - Cloudinary folder the upload is pinned to.
 * @returns {{ cloudName, apiKey, timestamp, signature, folder }}
 */
export function signUpload(folder) {
  ensureConfigured();
  const timestamp = Math.round(Date.now() / 1000);
  const params = { folder, timestamp };
  const signature = cloudinary.utils.api_sign_request(params, env.CLOUDINARY_API_SECRET);
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
  };
}
