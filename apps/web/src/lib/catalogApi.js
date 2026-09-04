/** @typedef {import('@h5-kb/shared').CatalogPayload} CatalogPayload */

const DEFAULT_CATALOG_URL = '/api/catalog';

/**
 * @returns {string}
 */
export function getCatalogApiUrl() {
  return import.meta.env.VITE_CATALOG_API_URL || DEFAULT_CATALOG_URL;
}

/**
 * @returns {HeadersInit | undefined}
 */
function buildHeaders() {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) return undefined;
  return { 'X-API-Key': apiKey };
}

/**
 * @param {{ force?: boolean }} [options]
 * @returns {Promise<CatalogPayload>}
 */
export async function fetchCatalog(options = {}) {
  const base = getCatalogApiUrl();
  const url = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  // Omit cache-busting on normal loads so Vercel CDN (s-maxage) can serve warm responses.
  // Force refresh bypasses CDN + Apps Script CacheService via refresh=1 + no-store.
  if (options.force) {
    url.searchParams.set('refresh', '1');
    url.searchParams.set('ts', String(Date.now()));
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    cache: options.force ? 'no-store' : 'default',
    headers: {
      Accept: 'application/json',
      ...buildHeaders(),
    },
  });

  const text = await response.text();
  let payload;

  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error('Catalog API returned invalid JSON');
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  if (!payload || !Array.isArray(payload.rows)) {
    throw new Error('Invalid catalog payload');
  }

  return payload;
}

export const CATALOG_QUERY_KEY = ['catalog'];
