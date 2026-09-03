import { matchSorter } from 'match-sorter';
import { classifyUrl } from '@h5-kb/shared';
import type { CatalogRow, LinkType } from '../types/catalog';

export type SortKey = 'newest' | 'oldest' | 'az' | 'za';

export const SEARCH_DEBOUNCE_MS = 200;

function urlHostname(url: string) {
  try {
    return new URL(url.includes('://') ? url : `https://${url}`).hostname;
  } catch {
    return '';
  }
}

export function resolveLinkType(row: CatalogRow): LinkType {
  if (row.linkType) return row.linkType;
  return classifyUrl(row.url).linkType as LinkType;
}

export function rowPassesFilters(
  row: CatalogRow,
  selectedSheet: string,
  type: string,
  linkType: string
) {
  if (selectedSheet && row.sourceSheet !== selectedSheet) return false;
  if (type && row.title !== type) return false;
  if (linkType && resolveLinkType(row) !== linkType) return false;
  return true;
}

/** Filter by sheet/title/linkType, then fuzzy-match search across key fields. */
export function filterAndSearch(
  rows: CatalogRow[],
  search: string,
  selectedSheet: string,
  type: string,
  linkType: string
) {
  const filtered = rows.filter((row) =>
    rowPassesFilters(row, selectedSheet, type, linkType)
  );

  const query = search.trim();
  if (!query) return filtered;

  return matchSorter(filtered, query, {
    keys: [
      'title',
      'authors',
      'sourceSheet',
      (item) => (item.tags || []).join(' '),
      (item) => urlHostname(item.url || ''),
    ],
  });
}

export function sortRows(data: CatalogRow[], sortKey: SortKey) {
  const sorted = [...data];

  if (sortKey === 'oldest') {
    sorted.sort((a, b) => a.lastUpdateStamp - b.lastUpdateStamp);
    return sorted;
  }

  if (sortKey === 'az') {
    sorted.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
    return sorted;
  }

  if (sortKey === 'za') {
    sorted.sort((a, b) => String(b.title || '').localeCompare(String(a.title || '')));
    return sorted;
  }

  sorted.sort((a, b) => b.lastUpdateStamp - a.lastUpdateStamp);
  return sorted;
}
