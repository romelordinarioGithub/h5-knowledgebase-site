import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { resolveLinkType } from '../lib/search';
import { sanitizeDocumentUrl } from '../lib/safeUrl';
import {
  authorInitials,
  formatCatalogDate,
  openOriginalLabel,
  sourceLabel,
} from '../lib/sourceDisplay';
import { SourceIcon } from '../lib/SourceIcon';
import type { CatalogRow } from '../types/catalog';
import { ExternalLinkIcon } from './ExternalLinkIcon';

const BOOKMARK_KEY = 'h5-kb-bookmarks';

function readBookmarks(): Set<string> {
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

function writeBookmarks(ids: Set<string>) {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...ids]));
}

type DocumentDetailProps = {
  row: CatalogRow;
  footer?: ReactNode;
  /** When false, only show source type (Open Original lives in the viewer). Default true. */
  showOpenAction?: boolean;
};

export function DocumentDetail({ row, footer, showOpenAction = true }: DocumentDetailProps) {
  const linkType = resolveLinkType(row);
  const safeUrl = sanitizeDocumentUrl(row.url);
  const typeLabel = sourceLabel(linkType);
  const openLabel = openOriginalLabel(linkType);
  const tags = (row.tags || []).filter(Boolean);
  const authors = row.authors?.trim() || '';
  const [bookmarked, setBookmarked] = useState(() => readBookmarks().has(row.id));

  function toggleBookmark() {
    const next = readBookmarks();
    if (next.has(row.id)) {
      next.delete(row.id);
      setBookmarked(false);
      toast.message('Bookmark removed');
    } else {
      next.add(row.id);
      setBookmarked(true);
      toast.success('Bookmarked');
    }
    writeBookmarks(next);
  }

  async function shareLink() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  }

  return (
    <div className="kb-doc-meta">
      <div className="kb-doc-meta-top">
        <span className="kb-doc-source-badge">
          <span className="kb-doc-source-dot" aria-hidden="true" />
          Source: {row.sourceSheet || 'Unknown'}
        </span>
        <div className="kb-doc-meta-actions">
          <button
            type="button"
            className="kb-doc-icon-btn"
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
            aria-pressed={bookmarked}
            onClick={toggleBookmark}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={bookmarked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <button
            type="button"
            className="kb-doc-icon-btn"
            aria-label="Share link"
            onClick={() => {
              void shareLink();
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
        </div>
      </div>

      <div>
        <h1 className="kb-doc-title">{row.title || 'Untitled'}</h1>
      </div>

      <div className="kb-doc-meta-list">
        {authors ? (
          <div className="kb-doc-meta-row">
            <span className="kb-doc-meta-label">Authors:</span>
            <span className="kb-doc-meta-value">
              <span className="kb-doc-author-avatar" aria-hidden="true">
                {authorInitials(authors)}
              </span>
              {authors}
            </span>
          </div>
        ) : null}
        <div className="kb-doc-meta-row">
          <span className="kb-doc-meta-label">Last Update:</span>
          <span className="kb-doc-meta-value">{formatCatalogDate(row.lastUpdate)}</span>
        </div>
      </div>

      {tags.length ? (
        <div className="kb-doc-tags-block">
          <span className="kb-doc-section-label">TAGS</span>
          <div className="kb-doc-tags">
            {tags.map((tag, index) => (
              <span key={`detail-tag-${tag}-${index}`} className="kb-doc-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="kb-doc-open-block">
        <span className="kb-doc-type-pill">
          <SourceIcon linkType={linkType} size={16} />
          {typeLabel}
        </span>
        {showOpenAction ? (
          safeUrl ? (
            <a
              className="kb-doc-open-btn"
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{openLabel}</span>
              <ExternalLinkIcon />
            </a>
          ) : (
            <span className="kb-doc-open-btn is-disabled">No document URL</span>
          )
        ) : null}
      </div>

      {footer}
    </div>
  );
}
