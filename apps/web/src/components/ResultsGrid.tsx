import { useRef, type RefObject } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { VIRTUALIZE_THRESHOLD } from '../lib/constants';
import type { CatalogRow } from '../types/catalog';
import { ResultCard } from './ResultCard';

type ResultsGridProps = {
  rows: CatalogRow[];
  searchQuery?: string;
  onSelect: (row: CatalogRow) => void;
  loading?: boolean;
  gridRef?: RefObject<HTMLElement | null>;
};

export function ResultsGrid({
  rows,
  searchQuery = '',
  onSelect,
  loading,
  gridRef,
}: ResultsGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const useVirtual = rows.length > VIRTUALIZE_THRESHOLD;

  // @tanstack/react-virtual intentionally returns unstable function identities.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: useVirtual ? rows.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 188,
    overscan: 8,
  });

  if (loading) {
    return (
      <section
        ref={gridRef}
        className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5"
        aria-busy="true"
        aria-label="Loading results"
      >
        {Array.from({ length: 6 }, (_, index) => (
          <div key={`card-skel-${index}`} className="skeleton min-h-[160px] rounded-card" />
        ))}
      </section>
    );
  }

  if (!rows.length) {
    return (
      <section ref={gridRef} className="mt-4" aria-live="polite">
        <div className="rounded-card border border-dashed border-line bg-[#f7f6fa] p-5 text-muted">
          No matching results. Try adjusting your search or filters.
        </div>
      </section>
    );
  }

  if (!useVirtual) {
    return (
      <section
        ref={gridRef}
        className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5"
        aria-label="Search results"
      >
        {rows.map((row) => (
          <ResultCard
            key={row.id}
            row={row}
            searchQuery={searchQuery}
            onSelect={onSelect}
          />
        ))}
      </section>
    );
  }

  return (
    <section ref={gridRef} className="mt-4" aria-label="Search results">
      <div ref={parentRef} className="max-h-[70vh] overflow-auto pr-1">
        <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
          {virtualizer.getVirtualItems().map((item) => {
            const row = rows[item.index];
            return (
              <div
                key={row.id}
                className="absolute top-0 left-0 w-full pb-3.5"
                style={{
                  height: `${item.size}px`,
                  transform: `translateY(${item.start}px)`,
                }}
              >
                <ResultCard row={row} searchQuery={searchQuery} onSelect={onSelect} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
