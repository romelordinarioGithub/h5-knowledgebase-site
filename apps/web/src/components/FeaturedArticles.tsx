import { getFeaturedArticleIcon } from '../lib/getFeaturedArticleIcon';
import { getCategoryBadgeClass } from '../lib/topics';
import type { CatalogRow } from '../types/catalog';

type FeaturedArticlesProps = {
  rows: CatalogRow[];
  onSelect: (row: CatalogRow) => void;
  loading?: boolean;
};

function featuredSubtext(row: CatalogRow): string {
  const tag = (row.tags || []).find((t) => {
    const lower = String(t).toLowerCase();
    return lower !== 'featured' && lower.length > 0;
  });
  if (tag) return String(tag);
  if (row.authors) return row.authors;
  return 'Internal guide';
}

export function FeaturedArticles({ rows, onSelect, loading }: FeaturedArticlesProps) {
  const items = rows.slice(0, 4);

  return (
    <section className="kb-featured-card" aria-label="Featured Articles and Runbooks">
      <div className="kb-featured-header">
        <div className="kb-featured-header-left">
          <div className="kb-featured-icon" aria-hidden="true">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4 5.6 21.2 8 14 2 9.2h7.6z" />
            </svg>
          </div>
          <div>
            <h2 className="kb-featured-title">Featured Articles &amp; Runbooks</h2>
            <p className="kb-featured-sub">Top-rated internal guides &amp; blueprints</p>
          </div>
        </div>
        <span className="kb-featured-count">{items.length} items</span>
      </div>

      <div className="kb-featured-list">
        {loading ? (
          Array.from({ length: 4 }, (_, i) => (
            <div
              key={`feat-skel-${i}`}
              className="skeleton"
              style={{ height: '2.75rem', borderRadius: '0.5rem' }}
            />
          ))
        ) : items.length ? (
          items.map((row) => {
            const Icon = getFeaturedArticleIcon(row);
            return (
              <button
                key={`feat-${row.id}`}
                type="button"
                className="kb-featured-row"
                aria-label={`Open featured article: ${row.title || 'Untitled'}`}
                onClick={() => onSelect(row)}
              >
                <div className="kb-featured-row-left">
                  <div className="kb-featured-row-icon" aria-hidden="true">
                    <Icon width={14} height={14} />
                  </div>
                  <div className="kb-featured-row-text">
                    <div className="kb-featured-row-title">{row.title || 'Untitled'}</div>
                    <div className="kb-featured-row-meta">
                      <span className={getCategoryBadgeClass(row.sourceSheet, 'tag')}>
                        {row.sourceSheet}
                      </span>
                      <span className="kb-featured-row-dot">• {featuredSubtext(row)}</span>
                    </div>
                  </div>
                </div>
                <svg
                  className="kb-featured-row-arrow"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            );
          })
        ) : (
          <p className="kb-featured-empty">No featured articles available.</p>
        )}
      </div>
    </section>
  );
}
