import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearCachedCatalog,
  formatRelativeTime,
  loadCachedCatalog,
  saveCachedCatalog,
} from './catalogCache.js';
import { resolveCatalogPayload } from '../hooks/useCatalog.js';
import { makeCatalogPayload, makeRow } from '../test/fixtures';

const CACHE_KEY = 'h5-kb-catalog-v1';

describe('catalogCache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('saveCachedCatalog writes payload with cachedAt', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-03T12:00:00.000Z'));

    const payload = makeCatalogPayload([makeRow({ id: 'cached-1' })]);
    saveCachedCatalog(payload);

    const raw = localStorage.getItem(CACHE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.rows[0].id).toBe('cached-1');
    expect(parsed.cachedAt).toBe(Date.parse('2026-09-03T12:00:00.000Z'));
  });

  it('loadCachedCatalog returns null when empty or corrupt', () => {
    expect(loadCachedCatalog()).toBeNull();

    localStorage.setItem(CACHE_KEY, '{bad');
    expect(loadCachedCatalog()).toBeNull();

    localStorage.setItem(CACHE_KEY, JSON.stringify({ count: 0 }));
    expect(loadCachedCatalog()).toBeNull();
  });

  it('loadCachedCatalog round-trips saved payload', () => {
    const payload = makeCatalogPayload([makeRow({ id: 'roundtrip' })]);
    saveCachedCatalog(payload);
    const loaded = loadCachedCatalog();
    expect(loaded?.rows[0].id).toBe('roundtrip');
    expect(typeof loaded?.cachedAt).toBe('number');
  });

  it('clearCachedCatalog removes the entry', () => {
    saveCachedCatalog(makeCatalogPayload());
    expect(loadCachedCatalog()).not.toBeNull();
    clearCachedCatalog();
    expect(loadCachedCatalog()).toBeNull();
  });

  it('resolveCatalogPayload prefers live rows, then cache fallback', () => {
    const live = makeCatalogPayload([makeRow({ id: 'live' })]);
    const cached = {
      ...makeCatalogPayload([makeRow({ id: 'stale' })]),
      cachedAt: 1,
    };

    expect(resolveCatalogPayload(live, cached)?.rows[0].id).toBe('live');
    expect(resolveCatalogPayload(undefined, cached)?.rows[0].id).toBe('stale');
    expect(
      resolveCatalogPayload(makeCatalogPayload([]), cached)?.rows[0].id
    ).toBe('stale');
    expect(resolveCatalogPayload(undefined, null)).toBeNull();
  });

  it('formatRelativeTime formats recent timestamps', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-03T12:00:00.000Z'));

    expect(formatRelativeTime(Date.now() - 10_000)).toBe('just now');
    expect(formatRelativeTime(Date.now() - 5 * 60_000)).toBe('5 minutes ago');
    expect(formatRelativeTime(Date.now() - 2 * 3600_000)).toBe('2 hours ago');
    expect(formatRelativeTime(Date.now() - 3 * 86400_000)).toBe('3 days ago');
    expect(formatRelativeTime('not-a-date')).toBe('unknown time');
  });
});
