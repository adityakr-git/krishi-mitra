/**
 * Utility to construct API URLs compatible with both local Vite development proxy
 * and separate production domains (e.g. Firebase Hosting frontend calling Render backend).
 *
 * If VITE_BACKEND_URL is defined (e.g., in production: https://krishi-mitra-backend.onrender.com),
 * it prepends that base URL.
 * If VITE_BACKEND_URL is not set (e.g., local dev), it returns the relative path,
 * which Vite proxies directly to http://localhost:5001.
 */
export function getApiUrl(path: string): string {
  const rawBase = import.meta.env.VITE_BACKEND_URL;
  const baseUrl = rawBase ? rawBase.trim().replace(/\/+$/, '') : '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
}
