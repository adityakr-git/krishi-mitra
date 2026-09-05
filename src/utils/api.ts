/**
 * API Base URL for cross-device authentication and testing.
 * Automatically adapts:
 * - If VITE_BACKEND_URL is defined, uses that.
 * - If accessed from a mobile device on the same Wi-Fi (e.g. 192.168.x.x:5173 or 10.x.x.x:5173),
 *   it dynamically uses http://{window.location.hostname}:5000/api so mobile testing works out-of-the-box!
 * - Defaults to http://localhost:5000/api
 */
export const API_BASE_URL = (() => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl && envUrl.trim()) {
    const raw = envUrl.trim().replace(/\/+$/, '');
    return raw.endsWith('/api') ? raw : `${raw}/api`;
  }
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
})();

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
