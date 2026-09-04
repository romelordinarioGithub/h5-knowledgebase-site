import { Link } from 'react-router-dom';
import { getFeaturedArticleIcon } from '../lib/getFeaturedArticleIcon';
import { getRelatedArticles, relatedArticleBlurb } from '../lib/relatedArticles';
import { formatCatalogDate } from '../lib/sourceDisplay';
import { getCategoryBadgeClass } from '../lib/topics';
import type { CatalogRow } from '../types/catalog';

type RelatedArticlesProps = {
  current: CatalogRow;
  rows: CatalogRow[];
  onSelect: (row: CatalogRow) => void;
};

export function RelatedArticles({ current, rows, onSelect }: RelatedArticlesProps) {
  const related = getRelatedArticles(current, rows, 4);
  const viewAllHref = current.sourceSheet
    ? `/browse/${encodeURIComponent(current.sourceSheet)}`
    : '/';

  return (
    <section className="kb-related" aria-label="Related Articles and Runbooks">
      <div className="kb-related-header">
        <div className="kb-related-header-left">
          <span className="kb-related-header-icon" aria-hidden="true">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </span>
          <div>
            <h2 className="kb-related-title">Related Articles &amp; Runbooks</h2>
            <p className="kb-related-sub">Curated recommendations based on this workflow</p>
          </div>
        </div>
        <div className="kb-related-header-right">
          {related.length ? (
            <span className="kb-related-count">{related.length} Recommended</span>
          ) : null}
          <Link to={viewAllHref} className="kb-related-view-all">
            View all
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </div>

      {related.length ? (
        <div className="kb-related-list">
          {related.map((row) => {
            const Icon = getFeaturedArticleIcon(row);
            const blurb = relatedArticleBlurb(row);
            return (
              <button
                key={`related-${row.id}`}
                type="button"
                className="kb-related-row"
                aria-label={`Open related article: ${row.title || 'Untitled'}`}
                onClick={() => onSelect(row)}
              >
                <div className="kb-related-row-main">
                  <div className="kb-related-row-icon" aria-hidden="true">
                    <Icon width={20} height={20} />
                  </div>
                  <div className="kb-related-row-text">
                    <div className="kb-related-row-title-line">
                      <span className="kb-related-row-title">{row.title || 'Untitled'}</span>
                      {row.sourceSheet ? (
                        <span className={getCategoryBadgeClass(row.sourceSheet, 'tag')}>
                          {row.sourceSheet}
                        </span>
                      ) : null}
                    </div>
                    {blurb ? <p className="kb-related-row-blurb">{blurb}</p> : null}
                    <div className="kb-related-row-meta">
                      {row.lastUpdate ? (
                        <span>Updated {formatCatalogDate(row.lastUpdate)}</span>
                      ) : null}
                      {row.authors?.trim() ? (
                        <>
                          {row.lastUpdate ? <span aria-hidden="true">•</span> : null}
                          <span>By {row.authors.trim()}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
                <span className="kb-related-row-arrow" aria-hidden="true">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="kb-related-empty">No related articles found for this document.</p>
      )}
    </section>
  );
}
