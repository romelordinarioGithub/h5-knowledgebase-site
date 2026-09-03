import { describe, expect, it } from 'vitest';
import { filterAndSearch, rowPassesFilters, sortRows } from './search';
import { makeRow } from '../test/fixtures';

const rows = [
  makeRow({
    id: '1',
    title: 'Zebra Setup',
    sourceSheet: 'Studio Setup',
    authors: 'Ada',
    tags: ['studio'],
    linkType: 'google_doc',
    lastUpdateStamp: 100,
    url: 'https://docs.google.com/document/d/a/edit',
  }),
  makeRow({
    id: '2',
    title: 'Alpha Guide',
    sourceSheet: 'Build Guides',
    authors: 'Bob',
    tags: ['build', 'dpa'],
    linkType: 'google_slides',
    lastUpdateStamp: 300,
    url: 'https://docs.google.com/presentation/d/b/edit',
  }),
  makeRow({
    id: '3',
    title: 'Middle Tool',
    sourceSheet: 'Internal Tools',
    authors: 'Cara',
    tags: ['tool'],
    linkType: 'external',
    lastUpdateStamp: 200,
    url: 'https://example.com/tool',
  }),
];

describe('rowPassesFilters', () => {
  it('passes when no filters set', () => {
    expect(rowPassesFilters(rows[0], '', '', '')).toBe(true);
  });

  it('filters by source sheet', () => {
    expect(rowPassesFilters(rows[0], 'Studio Setup', '', '')).toBe(true);
    expect(rowPassesFilters(rows[0], 'Build Guides', '', '')).toBe(false);
  });

  it('filters by document title', () => {
    expect(rowPassesFilters(rows[1], '', 'Alpha Guide', '')).toBe(true);
    expect(rowPassesFilters(rows[1], '', 'Zebra Setup', '')).toBe(false);
  });

  it('filters by linkType', () => {
    expect(rowPassesFilters(rows[2], '', '', 'external')).toBe(true);
    expect(rowPassesFilters(rows[2], '', '', 'google_doc')).toBe(false);
  });
});

describe('filterAndSearch', () => {
  it('returns all rows when search and filters empty', () => {
    expect(filterAndSearch(rows, '', '', '', '')).toHaveLength(3);
  });

  it('applies sheet filter then search', () => {
    const result = filterAndSearch(rows, 'alpha', 'Build Guides', '', '');
    expect(result.map((r) => r.id)).toEqual(['2']);
  });

  it('fuzzy-matches title and tags', () => {
    const byTitle = filterAndSearch(rows, 'zebra', '', '', '');
    expect(byTitle.map((r) => r.id)).toEqual(['1']);

    const byTag = filterAndSearch(rows, 'dpa', '', '', '');
    expect(byTag.map((r) => r.id)).toEqual(['2']);
  });

  it('matches authors', () => {
    const result = filterAndSearch(rows, 'cara', '', '', '');
    expect(result.map((r) => r.id)).toEqual(['3']);
  });
});

describe('sortRows', () => {
  it('sorts newest first by default', () => {
    expect(sortRows(rows, 'newest').map((r) => r.id)).toEqual(['2', '3', '1']);
  });

  it('sorts oldest first', () => {
    expect(sortRows(rows, 'oldest').map((r) => r.id)).toEqual(['1', '3', '2']);
  });

  it('sorts A–Z by title', () => {
    expect(sortRows(rows, 'az').map((r) => r.title)).toEqual([
      'Alpha Guide',
      'Middle Tool',
      'Zebra Setup',
    ]);
  });

  it('sorts Z–A by title', () => {
    expect(sortRows(rows, 'za').map((r) => r.title)).toEqual([
      'Zebra Setup',
      'Middle Tool',
      'Alpha Guide',
    ]);
  });

  it('does not mutate the input array', () => {
    const copy = [...rows];
    sortRows(rows, 'az');
    expect(rows.map((r) => r.id)).toEqual(copy.map((r) => r.id));
  });
});
