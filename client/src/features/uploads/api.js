import { api } from '@/lib/api';

export const uploadsApi = {
  getSignature: (kind) => api.post('/uploads/signature', { kind }).then((r) => r.data.data),
};

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Uploads a single image to Cloudinary using a server-generated signature.
 * Bytes go directly browser → Cloudinary; our server never proxies the file.
 * Returns the Cloudinary secure URL.
 */
export async function uploadImage(file, kind) {
  if (!file) throw new Error('No file selected');
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Unsupported image type — use JPG, PNG, WEBP or GIF');
  }

  const sig = await uploadsApi.getSignature(kind);
  if (file.size > sig.maxBytes) {
    throw new Error(`Image is too large (max ${Math.round(sig.maxBytes / (1024 * 1024))}MB)`);
  }

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', sig.timestamp);
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upload failed: ${text.slice(0, 200) || res.status}`);
  }
  const json = await res.json();
  return json.secure_url;
}
