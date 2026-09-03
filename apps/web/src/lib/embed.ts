import { classifyUrl } from '@h5-kb/shared';
import type { CatalogRow, LinkType } from '../types/catalog';
import { sanitizeDocumentUrl, sanitizeEmbedUrl } from './safeUrl';

export const PREVIEW_TIMEOUT_MS = 8_000;

export type PreviewState =
  | 'loading'
  | 'preview'
  | 'unsupported'
  | 'auth_required'
  | 'error';

/** Types we never attempt to iframe (CSP / framing blocked or not Google embeds). */
const NEVER_EMBED: ReadonlySet<LinkType | string> = new Set([
  'sharepoint',
  'onedrive',
  'external',
  'unknown',
]);

const PPT_EXT_RE = /\.(pptx?|ppsx?)(?:$|[?#])/i;
const PPT_HOST_RE = /(?:powerpoint\.office|office\.com\/.*powerpoint)/i;

export type EmbedPlan = {
  linkType: LinkType;
  embedUrl: string | null;
  canPreview: boolean;
  reason?: 'unsupported_type' | 'ppt' | 'missing_url' | 'invalid_embed' | 'unsafe_url';
};

function isPowerpointUrl(url: string) {
  return PPT_EXT_RE.test(url) || PPT_HOST_RE.test(url);
}

/** Resolve whether/how to embed a catalog row. Never mutates sharing settings. */
export function resolveEmbedPlan(row: CatalogRow): EmbedPlan {
  const url = String(row.url || '').trim();
  if (!url) {
    return {
      linkType: (row.linkType || 'external') as LinkType,
      embedUrl: null,
      canPreview: false,
      reason: 'missing_url',
    };
  }

  // Block javascript:/data:/etc. before any classification or embed attempt.
  if (!sanitizeDocumentUrl(url)) {
    return {
      linkType: (row.linkType || 'external') as LinkType,
      embedUrl: null,
      canPreview: false,
      reason: 'unsafe_url',
    };
  }

  if (isPowerpointUrl(url)) {
    return {
      linkType: (row.linkType || 'external') as LinkType,
      embedUrl: null,
      canPreview: false,
      reason: 'ppt',
    };
  }

  const classified = classifyUrl(url);
  const linkType = (row.linkType || classified.linkType) as LinkType;

  if (NEVER_EMBED.has(linkType)) {
    return {
      linkType,
      embedUrl: null,
      canPreview: false,
      reason: 'unsupported_type',
    };
  }

  const candidate = sanitizeEmbedUrl(row.embedUrl ?? classified.embedUrl ?? null);
  if (!candidate) {
    return {
      linkType,
      embedUrl: null,
      canPreview: false,
      reason: row.canPreview === false ? 'unsupported_type' : 'invalid_embed',
    };
  }

  if (row.canPreview === false) {
    return {
      linkType,
      embedUrl: null,
      canPreview: false,
      reason: 'unsupported_type',
    };
  }

  return {
    linkType,
    embedUrl: candidate,
    canPreview: true,
  };
}

export function logPreviewEvent(
  event: 'attempt' | 'success' | 'timeout' | 'error' | 'unsupported',
  detail: Record<string, unknown>
) {
  // Lightweight hook for Phase 4 tuning; swap for analytics later if needed.
  console.info(`[preview:${event}]`, detail);
}
