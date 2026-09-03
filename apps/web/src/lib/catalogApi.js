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
 * @returns {Promise<CatalogPayload>}
 */
export async function fetchCatalog() {
  const url = getCatalogApiUrl();
  const response = await fetch(url, {
    method: 'GET',
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
