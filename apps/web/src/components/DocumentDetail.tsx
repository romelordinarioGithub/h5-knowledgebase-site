import type { ReactNode } from 'react';
import { linkTypeLabel } from '../lib/linkTypes';
import { sanitizeDocumentUrl } from '../lib/safeUrl';
import { resolveLinkType } from '../lib/search';
import type { CatalogRow } from '../types/catalog';
import { ExternalLinkIcon } from './ExternalLinkIcon';
import { Badge, Tag } from './ui';

type DocumentDetailProps = {
  row: CatalogRow;
  footer?: ReactNode;
};

export function DocumentDetail({ row, footer }: DocumentDetailProps) {
  const linkType = resolveLinkType(row);
  const safeUrl = sanitizeDocumentUrl(row.url);

  return (
    <>
      <p className="m-0 font-semibold text-[#5c5674]">Source: {row.sourceSheet || 'Unknown'}</p>
      <h2 className="m-0 text-left text-[1.6rem] text-[#19152e]">{row.title || 'Untitled'}</h2>
      <p className="m-0 text-[0.84rem] text-muted">Authors: {row.authors || 'Unknown'}</p>
      <p className="m-0 text-[0.84rem] text-muted">Last Update: {row.lastUpdate || 'Not set'}</p>
      <div className="mt-0.5 flex flex-wrap gap-1.5">
        {(row.tags || []).map((tag, index) => (
          <Tag key={`detail-tag-${tag}-${index}`}>{tag}</Tag>
        ))}
      </div>
      <Badge tone="soft" className="self-start">
        {linkTypeLabel(linkType)}
      </Badge>
      {safeUrl ? (
        <a
          className="doc-link doc-link-external mt-3 inline-flex items-center gap-1.5"
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Original
          <ExternalLinkIcon />
        </a>
      ) : (
        <span className="doc-link is-disabled mt-3">No document URL</span>
      )}
      {footer}
    </>
  );
}
