const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is not set. Did you copy client/.env.example?');
}

export const env = Object.freeze({
  apiBaseUrl,
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  // Memberships are on hold until a Pakistan-friendly payment processor is wired.
  // Set VITE_PAYMENTS_ENABLED=true to switch the purchase UI back on.
  paymentsEnabled: import.meta.env.VITE_PAYMENTS_ENABLED === 'true',
});
