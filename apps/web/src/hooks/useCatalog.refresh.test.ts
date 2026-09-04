import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadCachedCatalog, saveCachedCatalog } from '../lib/catalogCache.js';
import { CATALOG_QUERY_KEY, fetchCatalog } from '../lib/catalogApi.js';
import { makeCatalogPayload, makeRow } from '../test/fixtures';

vi.mock('../lib/catalogApi.js', async () => {
  const actual = await vi.importActual<typeof import('../lib/catalogApi.js')>('../lib/catalogApi.js');
  return {
    ...actual,
    fetchCatalog: vi.fn(),
  };
});

/**
 * Mirrors useRefreshCatalog: force-fetch, save on success, never clear before success.
 */
async function forceRefreshCatalog(queryClient: QueryClient) {
  return queryClient.fetchQuery({
    queryKey: CATALOG_QUERY_KEY,
    queryFn: async () => {
      const payload = await fetchCatalog({ force: true });
      saveCachedCatalog(payload);
      return payload;
    },
    staleTime: 0,
  });
}

describe('force refresh failure safety', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(fetchCatalog).mockReset();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('keeps last-known-good localStorage when force refresh fails', async () => {
    saveCachedCatalog(makeCatalogPayload([makeRow({ id: 'good' })]));
    expect(loadCachedCatalog()?.rows[0].id).toBe('good');

    vi.mocked(fetchCatalog).mockRejectedValue(new Error('Apps Script timed out'));

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await expect(forceRefreshCatalog(client)).rejects.toThrow('Apps Script timed out');
    expect(loadCachedCatalog()?.rows[0].id).toBe('good');
  });

  it('replaces localStorage only after a successful force refresh', async () => {
    saveCachedCatalog(makeCatalogPayload([makeRow({ id: 'old' })]));
    vi.mocked(fetchCatalog).mockResolvedValue(makeCatalogPayload([makeRow({ id: 'fresh' })]));

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await forceRefreshCatalog(client);
    expect(loadCachedCatalog()?.rows[0].id).toBe('fresh');
    expect(fetchCatalog).toHaveBeenCalledWith({ force: true });
  });
});
