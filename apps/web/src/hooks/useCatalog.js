import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCatalog, CATALOG_QUERY_KEY } from '../lib/catalogApi.js';
import { loadCachedCatalog, saveCachedCatalog } from '../lib/catalogCache.js';

export const AUTO_SYNC_MS = 5 * 60 * 1000;

const cachedBootstrap = loadCachedCatalog();

/**
 * @param {{ enabled?: boolean }} [options]
 */
export function useCatalog(options = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: CATALOG_QUERY_KEY,
    queryFn: async () => {
      const payload = await fetchCatalog();
      saveCachedCatalog(payload);
      return payload;
    },
    enabled,
    staleTime: AUTO_SYNC_MS,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: AUTO_SYNC_MS,
    refetchIntervalInBackground: false,
    retry: 2,
    placeholderData: cachedBootstrap ?? undefined,
    initialData: cachedBootstrap ?? undefined,
    initialDataUpdatedAt: cachedBootstrap?.cachedAt,
  });
}

/**
 * Force-refresh catalog from the spreadsheet (bypasses CDN + Apps Script cache).
 * @returns {() => Promise<unknown>}
 */
export function useRefreshCatalog() {
  const queryClient = useQueryClient();
  return async () => {
    // Keep last-known-good localStorage until a successful response replaces it.
    // Clearing before fetch would leave no offline fallback if Apps Script/proxy fails.
    return queryClient.fetchQuery({
      queryKey: CATALOG_QUERY_KEY,
      queryFn: async () => {
        const payload = await fetchCatalog({ force: true });
        saveCachedCatalog(payload);
        return payload;
      },
      staleTime: 0,
    });
  };
}

/**
 * @param {import('@h5-kb/shared').CatalogPayload | undefined} payload
 * @param {import('@h5-kb/shared').CachedCatalogPayload | null} fallback
 */
export function resolveCatalogPayload(payload, fallback) {
  if (payload && Array.isArray(payload.rows) && payload.rows.length) {
    return payload;
  }
  if (fallback && Array.isArray(fallback.rows) && fallback.rows.length) {
    return fallback;
  }
  return payload || fallback || null;
}

/**
 * @param {import('@h5-kb/shared').CatalogPayload | null | undefined} payload
 */
export function getPayloadTimestamp(payload) {
  if (!payload) return null;
  if (typeof payload.cachedAt === 'number') return payload.cachedAt;
  const parsed = Date.parse(String(payload.updatedAt || ''));
  return Number.isFinite(parsed) ? parsed : null;
}
