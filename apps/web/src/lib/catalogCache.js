const CATALOG_CACHE_KEY = 'h5-kb-catalog-v1';

/**
 * @returns {import('@h5-kb/shared').CachedCatalogPayload | null}
 */
export function loadCachedCatalog() {
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.rows)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * @param {import('@h5-kb/shared').CatalogPayload} payload
 */
export function saveCachedCatalog(payload) {
  try {
    const entry = {
      ...payload,
      cachedAt: Date.now(),
    };
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Quota or private mode — non-fatal.
  }
}

/**
 * @param {number | string | undefined} value
 */
export function formatRelativeTime(value) {
  const timestamp = typeof value === 'number' ? value : Date.parse(String(value || ''));
  if (!Number.isFinite(timestamp)) return 'unknown time';

  const diffMs = Date.now() - timestamp;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  }
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(diffSec / 86400);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
