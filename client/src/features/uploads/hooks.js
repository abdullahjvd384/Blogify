import { useMutation } from '@tanstack/react-query';
import { uploadImage } from './api';

/**
 * Returns a mutation for uploading an image. Call with { file, kind } where kind
 * is one of 'cover' | 'inline' | 'avatar'. Resolves to the Cloudinary URL.
 */
export function useUploadImage() {
  return useMutation({
    mutationFn: ({ file, kind }) => uploadImage(file, kind),
  });
}
