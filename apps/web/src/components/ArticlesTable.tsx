import { useMemo, useState, type RefObject } from 'react';
import { SORT_OPTIONS } from '../lib/constants';
import type { SortKey } from '../lib/search';
import { formatCatalogDate, sourceLabel } from '../lib/sourceDisplay';
import { SourceIcon } from '../lib/SourceIcon';
import { getCategoryBadgeClass } from '../lib/topics';
import type { CatalogRow } from '../types/catalog';

type ArticlesTableProps = {
  rows: CatalogRow[];
  onSelect: (row: CatalogRow) => void;
  loading?: boolean;
  tableRef?: RefObject<HTMLElement | null>;
  selectedSort: SortKey;
  onSortChange: (value: SortKey) => void;
};

function pageNumbers(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 'ellipsis', total];
  if (current >= total - 2) return [1, 'ellipsis', total - 2, total - 1, total];
  return [1, 'ellipsis', current, 'ellipsis', total];
}

export function ArticlesTable({
  rows,
  onSelect,
  loading,
  tableRef,
  selectedSort,
  onSortChange,
}: ArticlesTableProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = rows.length ? (safePage - 1) * pageSize + 1 : 0;
  const end = Math.min(safePage * pageSize, rows.length);
  const pageRows = useMemo(
    () => rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [rows, safePage, pageSize]
  );

  return (
    <section
      ref={tableRef}
      className="kb-articles"
      aria-label="All Articles and Documentation"
    >
      <div className="kb-articles-header">
        <div>
          <h2 className="kb-section-title">All Articles &amp; Documentation</h2>
          <p className="kb-section-sub">
            Central registry of Google Docs, Sheets, Slides, and Drive documentation
          </p>
        </div>
        <div className="kb-articles-actions">
          <div className="kb-sort-wrap">
            <button
              type="button"
              className={`kb-ctrl-btn${sortOpen ? ' is-active' : ''}`}
              aria-expanded={sortOpen}
              aria-haspopup="listbox"
              onClick={() => setSortOpen((v) => !v)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--kb-outline)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
              Sort
            </button>
            {sortOpen ? (
              <ul className="kb-sort-menu" role="listbox" aria-label="Sort By">
                {SORT_OPTIONS.map((opt) => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selectedSort === opt.value}
                      className={`kb-sort-option${selectedSort === opt.value ? ' is-selected' : ''}`}
                      onClick={() => {
                        onSortChange(opt.value);
                        setSortOpen(false);
                      }}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>

      <div className="kb-table-container">
        <div className="kb-table-header">
          <div>Article Title</div>
          <div>Category</div>
          <div>Source</div>
          <div>Updated</div>
          <div>Author</div>
        </div>

        <div className="kb-table-body">
          {loading ? (
            Array.from({ length: 5 }, (_, i) => (
              <div
                key={`art-skel-${i}`}
                className="skeleton"
                style={{ height: '2.75rem', margin: '0.5rem 1.25rem', borderRadius: '0.25rem' }}
              />
            ))
          ) : pageRows.length ? (
            pageRows.map((row) => (
              <div
                key={row.id}
                className="kb-table-row"
                role="button"
                tabIndex={0}
                aria-label={`${row.title || 'Untitled'}. Open document.`}
                onClick={() => onSelect(row)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(row);
                  }
                }}
              >
                <div className="kb-table-title-cell">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--kb-primary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0 }}
                    aria-hidden="true"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span className="kb-table-row-title">{row.title || 'Untitled'}</span>
                </div>

                <div>
                  <span className={getCategoryBadgeClass(row.sourceSheet)}>{row.sourceSheet}</span>
                </div>

                <div className="kb-table-source-cell">
                  <SourceIcon linkType={row.linkType || row.provider} />
                  <span>{sourceLabel(row.linkType || row.provider)}</span>
                </div>

                <div className="kb-table-date-cell">{formatCatalogDate(row.lastUpdate)}</div>

                <div className="kb-table-author-cell">{row.authors?.trim() || '—'}</div>
              </div>
            ))
          ) : (
            <p className="kb-table-empty">No matching results. Try adjusting your search or category.</p>
          )}
        </div>

        <div className="kb-pagination" aria-label="Pagination">
          <div className="kb-pagination-meta">
            <span>
              Showing{' '}
              <strong>
                {rows.length ? `${start}–${end}` : '0'}
              </strong>{' '}
              of <strong>{rows.length}</strong> entries
            </span>
            <span className="kb-pagination-sep" aria-hidden="true">
              •
            </span>
            <label className="kb-page-size">
              <span>Show</span>
              <select
                value={pageSize}
                aria-label="Rows per page"
                onChange={(e) => {
                  setPageSize(Number(e.currentTarget.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>per page</span>
            </label>
          </div>

          <div className="kb-pagination-controls">
            <button
              type="button"
              className="kb-page-nav"
              disabled={safePage <= 1}
              aria-label="Previous page"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Prev
            </button>

            {pageNumbers(safePage, totalPages).map((item, idx) =>
              item === 'ellipsis' ? (
                <span key={`e-${idx}`} className="kb-page-ellipsis" aria-hidden="true">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={`kb-page-num${item === safePage ? ' is-active' : ''}`}
                  aria-label={`Page ${item}`}
                  aria-current={item === safePage ? 'page' : undefined}
                  onClick={() => setPage(item)}
                >
                  {item}
                </button>
              )
            )}

            <button
              type="button"
              className="kb-page-nav"
              disabled={safePage >= totalPages}
              aria-label="Next page"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <svg
                width="12"
                height="12"
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
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
