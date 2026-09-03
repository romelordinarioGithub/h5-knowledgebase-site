import type { CatalogRow } from '../types/catalog';

export function isFeaturedRow(row: CatalogRow) {
  if (row.featured === true) return true;
  return (row.tags || []).some((tag) => String(tag).toLowerCase() === 'featured');
}

export function initializeFeaturedRanking(data: CatalogRow[]) {
  const flagged = data.filter(isFeaturedRow);
  if (flagged.length) {
    return flagged.slice(0, 5);
  }

  const randomized = [...data];
  for (let i = randomized.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [randomized[i], randomized[j]] = [randomized[j], randomized[i]];
  }
  return randomized.slice(0, 5);
}

export function preserveFeaturedRows(currentFeaturedRows: CatalogRow[], nextRows: CatalogRow[]) {
  const rowById = new Map(nextRows.map((row) => [row.id, row]));
  const kept = currentFeaturedRows.map((row) => rowById.get(row.id)).filter(Boolean) as CatalogRow[];
  const used = new Set(kept.map((row) => row.id));

  const fillers = [
    ...nextRows.filter((row) => isFeaturedRow(row) && !used.has(row.id)),
    ...nextRows.filter((row) => !isFeaturedRow(row) && !used.has(row.id)),
  ];

  for (const row of fillers) {
    if (kept.length >= 5) break;
    kept.push(row);
    used.add(row.id);
  }

  return kept.slice(0, 5);
}
