import { useEffect, useId, useRef, useState } from 'react';
import {
  logPreviewEvent,
  PREVIEW_TIMEOUT_MS,
  resolveEmbedPlan,
  type PreviewState,
} from '../lib/embed';
import { linkTypeLabel } from '../lib/linkTypes';
import { sanitizeDocumentUrl } from '../lib/safeUrl';
import type { CatalogRow } from '../types/catalog';
import { ExternalLinkIcon } from './ExternalLinkIcon';
import { Button } from './ui';

type DocumentViewerProps = {
  row: CatalogRow;
};

const IFRAME_SANDBOX = 'allow-scripts allow-same-origin allow-popups allow-forms';

type FallbackState = Extract<PreviewState, 'unsupported' | 'auth_required' | 'error'>;

function OpenOriginalLink({
  url,
  className,
}: {
  url: string | null | undefined;
  className?: string;
}) {
  const safeUrl = sanitizeDocumentUrl(url);
  if (!safeUrl) {
    return <span className="doc-link is-disabled">No document URL</span>;
  }

  return (
    <a
      className={`doc-link doc-link-external inline-flex items-center gap-1.5 ${className || ''}`}
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      Open Original
      <ExternalLinkIcon />
    </a>
  );
}

function FallbackPanel({
  state,
  linkTypeLabelText,
  url,
  onRetry,
}: {
  state: FallbackState;
  linkTypeLabelText: string;
  url: string | null | undefined;
  onRetry?: () => void;
}) {
  const safeUrl = sanitizeDocumentUrl(url);
  const copy = {
    unsupported: {
      title: 'Preview not supported',
      body: `${linkTypeLabelText} links cannot be embedded here (provider framing restrictions). Open the original document instead.`,
    },
    auth_required: {
      title: 'Preview unavailable',
      body: 'This document may require Google sign-in, or framing is blocked. Open the original — we never change document sharing settings.',
    },
    error: {
      title: "Preview isn't available",
      body: "Preview isn't available for this document. You may need to open it directly.",
    },
  }[state];

  return (
    <div
      className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 rounded-[18px] border border-dashed border-line bg-[#f7f6fa] px-6 py-10 text-center"
      role="status"
    >
      <div className="max-w-md">
        <h3 className="m-0 text-[1.15rem] font-semibold text-ink">{copy.title}</h3>
        <p className="mt-2 mb-0 text-[0.92rem] leading-relaxed text-muted">{copy.body}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {safeUrl ? (
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[0.95rem] font-normal text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark"
          >
            Open Original
            <ExternalLinkIcon />
          </a>
        ) : null}
        {state === 'error' && onRetry ? (
          <Button type="button" variant="secondary" onClick={onRetry}>
            Try preview again
          </Button>
        ) : null}
      </div>
    </div>
  );
}

type AttemptStatus = 'loading' | 'preview' | 'auth_required' | 'error';

function PreviewAttempt({
  row,
  embedUrl,
  linkType,
  label,
  attempt,
  onRetry,
}: {
  row: CatalogRow;
  embedUrl: string;
  linkType: string;
  label: string;
  attempt: number;
  onRetry: () => void;
}) {
  const iframeTitleId = useId();
  const [status, setStatus] = useState<AttemptStatus>('loading');
  const loadedRef = useRef(false);

  useEffect(() => {
    loadedRef.current = false;
    logPreviewEvent('attempt', {
      id: row.id,
      linkType,
      embedUrl,
      attempt,
    });

    const timer = window.setTimeout(() => {
      if (loadedRef.current) return;
      setStatus('auth_required');
      logPreviewEvent('timeout', {
        id: row.id,
        linkType,
        ms: PREVIEW_TIMEOUT_MS,
      });
    }, PREVIEW_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [row.id, linkType, embedUrl, attempt]);

  if (status === 'auth_required' || status === 'error') {
    return (
      <FallbackPanel
        state={status}
        linkTypeLabelText={label}
        url={row.url}
        onRetry={status === 'error' ? onRetry : undefined}
      />
    );
  }

  return (
    <div
      className="relative flex min-h-[420px] flex-col overflow-hidden rounded-[18px] border border-line bg-surface shadow-card"
      role="document"
      aria-label={`Document preview: ${row.title || 'document'}`}
    >
      {status === 'loading' ? (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface/90 px-4"
          aria-live="polite"
        >
          <div className="skeleton h-10 w-10 rounded-full" aria-hidden="true" />
          <p className="m-0 text-sm text-muted">Loading preview…</p>
        </div>
      ) : null}

      <iframe
        key={`${row.id}-${attempt}`}
        id={iframeTitleId}
        title={`Preview: ${row.title || 'document'}`}
        src={embedUrl}
        className="min-h-[420px] w-full flex-1 border-0 bg-white"
        sandbox={IFRAME_SANDBOX}
        referrerPolicy="no-referrer"
        allow="fullscreen"
        onLoad={() => {
          loadedRef.current = true;
          setStatus((prev) => {
            if (prev === 'auth_required' || prev === 'error') return prev;
            logPreviewEvent('success', { id: row.id, linkType });
            return 'preview';
          });
        }}
        onError={() => {
          loadedRef.current = true;
          setStatus('error');
          logPreviewEvent('error', { id: row.id, linkType });
        }}
      />

      <div className="flex items-center justify-between gap-3 border-t border-line bg-[#faf9fc] px-4 py-2.5 text-[0.8rem] text-muted">
        <span>In-app preview · {label}</span>
        <OpenOriginalLink url={row.url} />
      </div>
    </div>
  );
}

function UnsupportedPreview({
  rowId,
  linkType,
  reason,
  label,
  url,
}: {
  rowId: string;
  linkType: string;
  reason?: string;
  label: string;
  url: string | null | undefined;
}) {
  useEffect(() => {
    logPreviewEvent('unsupported', { id: rowId, linkType, reason });
  }, [rowId, linkType, reason]);

  return <FallbackPanel state="unsupported" linkTypeLabelText={label} url={url} />;
}

export function DocumentViewer({ row }: DocumentViewerProps) {
  const plan = resolveEmbedPlan(row);
  const label = linkTypeLabel(plan.linkType);
  const [attempt, setAttempt] = useState(0);

  if (!plan.canPreview || !plan.embedUrl) {
    return (
      <UnsupportedPreview
        rowId={row.id}
        linkType={plan.linkType}
        reason={plan.reason}
        label={label}
        url={row.url}
      />
    );
  }

  return (
    <PreviewAttempt
      key={`${row.id}-${attempt}`}
      row={row}
      embedUrl={plan.embedUrl}
      linkType={plan.linkType}
      label={label}
      attempt={attempt}
      onRetry={() => setAttempt((n) => n + 1)}
    />
  );
}
