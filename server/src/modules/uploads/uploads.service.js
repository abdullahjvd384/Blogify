import { signUpload } from '../../services/cloudinary.js';
import { env } from '../../config/env.js';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

const FOLDERS = {
  cover: 'articles/covers',
  inline: 'articles/inline',
  avatar: 'avatars',
};

/**
 * Builds a signed direct-upload payload for the browser. The folder is pinned
 * per upload kind so the client can only write into its own namespace.
 */
export function getUploadSignature(kind) {
  const folder = `${env.CLOUDINARY_UPLOAD_FOLDER}/${FOLDERS[kind] || 'misc'}`;
  const signed = signUpload(folder);
  return {
    ...signed,
    maxBytes: MAX_BYTES,
    allowedFormats: ALLOWED_FORMATS,
  };
}
