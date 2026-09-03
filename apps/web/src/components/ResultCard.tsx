import { highlightText } from '../lib/highlight';
import { sanitizeDocumentUrl } from '../lib/safeUrl';
import type { CatalogRow } from '../types/catalog';
import { ExternalLinkIcon } from './ExternalLinkIcon';
import { Badge } from './ui';

type ResultCardProps = {
  row: CatalogRow;
  searchQuery?: string;
  onSelect: (row: CatalogRow) => void;
};

export function ResultCard({ row, searchQuery = '', onSelect }: ResultCardProps) {
  const safeUrl = sanitizeDocumentUrl(row.url);

  return (
    <article
      className="result-card"
      role="button"
      tabIndex={0}
      aria-label={`${row.title || 'Untitled'}. Open document.`}
      onClick={() => onSelect(row)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(row);
        }
      }}
    >
      <div className="flex items-start justify-between gap-2.5">
        <h2 className="result-card-title text-ink">
          {highlightText(row.title || 'Untitled', searchQuery)}
        </h2>
        <Badge tone="date">{row.lastUpdate || 'No date'}</Badge>
      </div>

      <Badge tone="source" className="mt-1 self-start">
        {highlightText(row.sourceSheet || 'Unknown source', searchQuery)}
      </Badge>

      {(row.tags || []).length ? (
        <p className="m-0 text-[0.76rem] text-muted">
          {highlightText((row.tags || []).join(', '), searchQuery)}
        </p>
      ) : null}

      <div className="result-card-actions">
        <button
          type="button"
          className="doc-link"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(row);
          }}
        >
          View
        </button>
        {safeUrl ? (
          <a
            className="doc-link doc-link-external"
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
          >
            Open Original
            <ExternalLinkIcon />
          </a>
        ) : (
          <span className="doc-link is-disabled">No URL</span>
        )}
      </div>

      <p className="absolute right-4 bottom-[18px] m-0 max-w-[36%] overflow-hidden text-right text-[0.76rem] text-ellipsis whitespace-nowrap text-muted">
        {highlightText(row.authors || 'Unknown author', searchQuery)}
      </p>
    </article>
  );
}
