import type { CatalogRow } from '../types/catalog';

/**
 * Related articles: prefer same source sheet, then shared tags.
 * Deterministic order for stable UI (no random shuffle).
 */
export function getRelatedArticles(
  current: CatalogRow,
  all: CatalogRow[],
  limit = 4
): CatalogRow[] {
  const currentTags = new Set(
    (current.tags || []).map((t) => String(t).toLowerCase()).filter(Boolean)
  );

  const scored = all
    .filter((row) => row.id !== current.id)
    .map((row) => {
      const sheetBonus = row.sourceSheet === current.sourceSheet ? 10 : 0;
      const tagBonus = (row.tags || []).reduce((sum, tag) => {
        return currentTags.has(String(tag).toLowerCase()) ? sum + 1 : sum;
      }, 0);
      return { row, score: sheetBonus + tagBonus };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.row.lastUpdateStamp !== a.row.lastUpdateStamp) {
        return (b.row.lastUpdateStamp || 0) - (a.row.lastUpdateStamp || 0);
      }
      return (a.row.title || '').localeCompare(b.row.title || '');
    });

  return scored.slice(0, limit).map((item) => item.row);
}

/** Short related-row blurb from real catalog fields only (no invented copy). */
export function relatedArticleBlurb(row: CatalogRow): string | null {
  const tag = (row.tags || []).find((t) => {
    const lower = String(t).toLowerCase();
    return lower !== 'featured' && lower.length > 0;
  });
  if (tag) return String(tag);
  return null;
}
