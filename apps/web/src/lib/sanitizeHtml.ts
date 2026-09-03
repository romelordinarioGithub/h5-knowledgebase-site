import DOMPurify from 'dompurify';
import type { Config as DomPurifyConfig } from 'dompurify';

/** Allowed tags/attrs for FAQ answerHtml from the spreadsheet. */
const FAQ_PURIFY_CONFIG: DomPurifyConfig = {
  ALLOWED_TAGS: [
    'a',
    'b',
    'strong',
    'i',
    'em',
    'u',
    'br',
    'p',
    'ul',
    'ol',
    'li',
    'span',
    'code',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'title'],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target'],
};

/**
 * Sanitize FAQ HTML before dangerouslySetInnerHTML.
 */
export function sanitizeFaqHtml(dirty: string | null | undefined): string {
  const raw = String(dirty || '');
  if (!raw.trim()) return '';

  const clean = DOMPurify.sanitize(raw, FAQ_PURIFY_CONFIG);

  // Ensure external links open safely.
  if (typeof document !== 'undefined') {
    const template = document.createElement('template');
    template.innerHTML = clean;
    template.content.querySelectorAll('a[href]').forEach((anchor) => {
      const href = anchor.getAttribute('href') || '';
      if (/^(javascript|data|vbscript):/i.test(href) || href.trim().startsWith('#')) {
        anchor.removeAttribute('href');
        return;
      }
      anchor.setAttribute('rel', 'noopener noreferrer');
      if (!anchor.getAttribute('target')) {
        anchor.setAttribute('target', '_blank');
      }
    });
    return template.innerHTML;
  }

  return clean;
}
