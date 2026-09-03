import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchCatalog, getCatalogApiUrl } from './catalogApi.js';
import { makeCatalogPayload, makeRow } from '../test/fixtures';

describe('catalogApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('getCatalogApiUrl defaults to /api/catalog when env unset', () => {
    expect(getCatalogApiUrl()).toBe('/api/catalog');
  });

  it('fetchCatalog returns parsed payload on success', async () => {
    const payload = makeCatalogPayload([makeRow({ id: 'row-1' })]);
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await fetchCatalog();
    expect(result.count).toBe(1);
    expect(result.rows[0].id).toBe('row-1');
    expect(fetch).toHaveBeenCalledWith(
      '/api/catalog',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Accept: 'application/json' }),
      })
    );
  });

  it('fetchCatalog throws on invalid JSON', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('not-json', { status: 200 })
    );
    await expect(fetchCatalog()).rejects.toThrow('invalid JSON');
  });

  it('fetchCatalog throws with API error message on non-OK', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: 'Upstream timeout' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    await expect(fetchCatalog()).rejects.toThrow('Upstream timeout');
  });

  it('fetchCatalog throws when rows missing', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ apiVersion: 'x', faqs: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    await expect(fetchCatalog()).rejects.toThrow('Invalid catalog payload');
  });
});
