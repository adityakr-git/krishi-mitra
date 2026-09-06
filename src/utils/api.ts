// Strictly pointing to live Render backend
export const API_BASE_URL = 'https://krishi-mitra-4pot.onrender.com/api';

/**
 * Constructs a full API endpoint URL from a relative path.
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath.startsWith('/api/')) {
    return `${API_BASE_URL}${cleanPath.substring(4)}`;
  }
  return `${API_BASE_URL}${cleanPath}`;
}
