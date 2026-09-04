/** Shared source-type labels and formatting (Articles table + article detail). */

export function sourceLabel(linkType?: string): string {
  const map: Record<string, string> = {
    google_slides: 'Google Slides',
    google_doc: 'Google Docs',
    google_sheet: 'Google Sheets',
    google_drive: 'Google Drive',
    sharepoint: 'SharePoint',
    onedrive: 'OneDrive',
    external: 'External',
  };
  return map[linkType || ''] || 'Document';
}

/**
 * Types where in-app iframe preview is unreliable for formatting/features.
 * Google Slides remains the only type we intentionally embed in-app.
 */
export function prefersSourceFallback(linkType?: string): boolean {
  return (
    linkType === 'google_doc' ||
    linkType === 'google_sheet' ||
    linkType === 'google_drive'
  );
}

/** CTA label for opening the source document in its native app. */
export function openOriginalLabel(linkType?: string): string {
  const label = sourceLabel(linkType);
  if (
    label === 'Document' ||
    label === 'External' ||
    label === 'SharePoint' ||
    label === 'OneDrive'
  ) {
    return 'Open Original';
  }
  return `Open Original in ${label}`;
}

/** Primary CTA inside the unsupported-preview fallback panel. */
export function previewFallbackCtaLabel(linkType?: string): string {
  if (linkType === 'google_doc') return 'Open in Google Docs';
  if (linkType === 'google_sheet') return 'Open in Google Sheets';
  return 'Open Original';
}

/** Copy for the intentional unsupported-preview state (not an error). */
export function previewFallbackCopy(linkType?: string): {
  title: string;
  body: string;
} {
  switch (linkType) {
    case 'google_doc':
      return {
        title: 'Preview unavailable',
        body: 'This Google Doc is best viewed in its original source to preserve formatting and document features.',
      };
    case 'google_sheet':
      return {
        title: 'Preview unavailable',
        body: 'This Google Sheet is best viewed in its original source to preserve formatting, formulas, and interactive features.',
      };
    case 'google_drive':
      return {
        title: 'Preview unavailable',
        body: 'This file is best viewed in its original source to preserve its formatting and interactive features.',
      };
    case 'google_slides':
      return {
        title: 'Preview unavailable',
        body: 'This Google Slides deck is best viewed in its original source for the complete viewing experience.',
      };
    default:
      return {
        title: 'Preview unavailable',
        body: "This document can't be previewed here. Open the original source for the complete viewing experience.",
      };
  }
}

export function formatCatalogDate(dateStr: string): string {
  if (!dateStr) return '—';
  if (/[A-Za-z]/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function authorInitials(authors: string): string {
  const first = authors.split(/[,&]/)[0]?.trim() || '';
  const parts = first.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] || ''}${parts[1]![0] || ''}`.toUpperCase();
  }
  return (first.slice(0, 2) || '?').toUpperCase();
}
