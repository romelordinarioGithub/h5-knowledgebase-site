import { useEffect, useId, useRef, useState } from 'react';
import {
  logPreviewEvent,
  PREVIEW_TIMEOUT_MS,
  resolveEmbedPlan,
  type PreviewState,
} from '../lib/embed';
import { linkTypeLabel } from '../lib/linkTypes';
import { sanitizeDocumentUrl } from '../lib/safeUrl';
import { resolveLinkType } from '../lib/search';
import {
  openOriginalLabel,
  prefersSourceFallback,
  previewFallbackCopy,
  previewFallbackCtaLabel,
  sourceLabel,
} from '../lib/sourceDisplay';
import { SourceIcon } from '../lib/SourceIcon';
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
  linkType,
  className,
}: {
  url: string | null | undefined;
  linkType?: string;
  className?: string;
}) {
  const safeUrl = sanitizeDocumentUrl(url);
  if (!safeUrl) {
    return <span className="doc-link is-disabled">No document URL</span>;
  }

  return (
    <a
      className={`kb-viewer-open-link ${className || ''}`}
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={openOriginalLabel(linkType)}
    >
      <span>Open Original</span>
      <ExternalLinkIcon />
    </a>
  );
}

function FallbackPanel({
  state,
  linkType,
  linkTypeLabelText,
  url,
  onRetry,
}: {
  state: FallbackState;
  linkType?: string;
  linkTypeLabelText: string;
  url: string | null | undefined;
  onRetry?: () => void;
}) {
  const safeUrl = sanitizeDocumentUrl(url);
  const ctaLabel = previewFallbackCtaLabel(linkType);

  const copy =
    state === 'unsupported'
      ? previewFallbackCopy(linkType)
      : state === 'auth_required'
        ? {
            title: 'Preview unavailable',
            body: 'This document may require Google sign-in. Open the original — we never change document sharing settings.',
          }
        : {
            title: 'Preview unavailable',
            body: "Preview isn't available for this document. You may need to open it directly.",
          };

  return (
    <div className="kb-viewer-fallback" role="status">
      <div className="kb-viewer-fallback-icon" aria-hidden="true">
        <SourceIcon linkType={linkType} size={40} />
      </div>
      <div className="kb-viewer-fallback-source">{linkTypeLabelText}</div>
      <div className="kb-viewer-fallback-copy">
        <h3 className="kb-viewer-fallback-title">{copy.title}</h3>
        <p className="kb-viewer-fallback-body">{copy.body}</p>
      </div>
      <div className="kb-viewer-fallback-actions">
        {safeUrl ? (
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="kb-viewer-fallback-cta"
          >
            {ctaLabel}
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

function ViewerToolbar({
  row,
  label,
  canPreview,
  showOpenOriginal,
}: {
  row: CatalogRow;
  label: string;
  canPreview: boolean;
  showOpenOriginal: boolean;
}) {
  const linkType = resolveLinkType(row);

  function handleFullscreen() {
    const el = document.getElementById(`kb-viewer-stage-${row.id}`);
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void el.requestFullscreen?.();
  }

  return (
    <div className="kb-viewer-toolbar">
      <div className="kb-viewer-toolbar-center">
        <span className="kb-viewer-toolbar-icon" aria-hidden="true">
          <SourceIcon linkType={linkType} size={18} />
        </span>
        <span>
          {label}
          {canPreview ? (
            <>
              {' · '}
              <span className="kb-viewer-toolbar-emphasis">In-app preview</span>
            </>
          ) : null}
        </span>
      </div>
      <div className="kb-viewer-toolbar-right">
        {showOpenOriginal ? <OpenOriginalLink url={row.url} linkType={linkType} /> : null}
        {canPreview ? (
          <button
            type="button"
            className="kb-viewer-tool-btn"
            aria-label="Fullscreen"
            title="Fullscreen"
            onClick={handleFullscreen}
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
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}

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
      <div className="kb-viewer">
        <div className="kb-viewer-stage kb-viewer-stage--fallback" id={`kb-viewer-stage-${row.id}`}>
          <FallbackPanel
            state={status}
            linkType={linkType}
            linkTypeLabelText={label}
            url={row.url}
            onRetry={status === 'error' ? onRetry : undefined}
          />
        </div>
        <ViewerToolbar row={row} label={label} canPreview={false} showOpenOriginal={false} />
      </div>
    );
  }

  return (
    <div
      className="kb-viewer"
      role="document"
      aria-label={`Document preview: ${row.title || 'document'}`}
    >
      <div className="kb-viewer-stage" id={`kb-viewer-stage-${row.id}`}>
        {status === 'loading' ? (
          <div className="kb-viewer-loading" aria-live="polite">
            <div className="skeleton h-10 w-10 rounded-full" aria-hidden="true" />
            <p className="m-0 text-sm text-muted">Loading preview…</p>
          </div>
        ) : null}

        <iframe
          key={`${row.id}-${attempt}`}
          id={iframeTitleId}
          title={`Preview: ${row.title || 'document'}`}
          src={embedUrl}
          className="kb-viewer-iframe"
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
      </div>
      <ViewerToolbar row={row} label={label} canPreview showOpenOriginal />
    </div>
  );
}

function UnsupportedPreview({
  row,
  reason,
  label,
  linkType,
}: {
  row: CatalogRow;
  reason?: string;
  label: string;
  linkType: string;
}) {
  useEffect(() => {
    logPreviewEvent('unsupported', {
      id: row.id,
      linkType,
      reason,
    });
  }, [row, reason, linkType]);

  return (
    <div className="kb-viewer">
      <div className="kb-viewer-stage kb-viewer-stage--fallback" id={`kb-viewer-stage-${row.id}`}>
        <FallbackPanel
          state="unsupported"
          linkType={linkType}
          linkTypeLabelText={label}
          url={row.url}
        />
      </div>
      <ViewerToolbar row={row} label={label} canPreview={false} showOpenOriginal={false} />
    </div>
  );
}

export function DocumentViewer({ row }: DocumentViewerProps) {
  const plan = resolveEmbedPlan(row);
  const linkType = plan.linkType;
  const label = sourceLabel(linkType) || linkTypeLabel(linkType);
  const [attempt, setAttempt] = useState(0);

  // Prefer polished open-original for Docs/Sheets/Drive where embeds are unreliable.
  if (!plan.canPreview || !plan.embedUrl || prefersSourceFallback(linkType)) {
    return (
      <UnsupportedPreview
        row={row}
        reason={plan.reason || (prefersSourceFallback(linkType) ? 'unsupported_type' : undefined)}
        label={label}
        linkType={linkType}
      />
    );
  }

  return (
    <PreviewAttempt
      key={`${row.id}-${attempt}`}
      row={row}
      embedUrl={plan.embedUrl}
      linkType={linkType}
      label={label}
      attempt={attempt}
      onRetry={() => setAttempt((n) => n + 1)}
    />
  );
}
