import type { CatalogRow } from '../types/catalog';

type FeaturedArticlesProps = {
  rows: CatalogRow[];
  onSelect: (row: CatalogRow) => void;
  loading?: boolean;
};

export function FeaturedArticles({ rows, onSelect, loading }: FeaturedArticlesProps) {
  return (
    <section className="mt-14 rounded-lg border border-[#e7e1f3] bg-[#f7f6fa] p-[34px] max-[820px]:p-5">
      <h2 className="m-0 text-left text-[2rem] text-primary">Featured Articles</h2>
      <div className="mt-[18px] grid gap-3">
        {loading ? (
          Array.from({ length: 5 }, (_, index) => (
            <div key={`featured-skel-${index}`} className="skeleton h-10 w-full" />
          ))
        ) : rows.length ? (
          rows.map((row) => (
            <article
              key={`featured-${row.id}`}
              className="flex cursor-pointer items-center justify-between gap-3 border-b border-[#e7e1f3] py-2.5 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark"
              role="button"
              tabIndex={0}
              aria-label={`Open featured article: ${row.title || 'Untitled'}`}
              onClick={() => onSelect(row)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(row);
                }
              }}
            >
              <span className="text-ink">{row.title || 'Untitled'}</span>
              <i className="not-italic font-bold text-primary" aria-hidden="true">
                →
              </i>
            </article>
          ))
        ) : (
          <p className="m-0 py-1 text-[0.95rem] text-muted">
            No featured articles for the current filters.
          </p>
        )}
      </div>
    </section>
  );
}
