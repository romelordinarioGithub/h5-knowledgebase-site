/**
 * Validate/sanitize document and embed URLs.
 * Blocks javascript:, data:, and non-allowlisted embed hosts.
 */

const SAFE_HTTP = /^https?:$/i;

/** Hosts allowed for iframe embeds only. */
const EMBED_HOSTS = new Set(['docs.google.com', 'drive.google.com']);

/**
 * Google Docs / Drive embed path patterns (must match what classifyUrl builds).
 */
const SAFE_GOOGLE_EMBED_RE =
  /^https:\/\/(?:docs\.google\.com\/(?:presentation|document|spreadsheets)\/d\/[a-zA-Z0-9_-]+\/(?:embed|preview)(?:\?[^#]*)?|drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+\/preview(?:\?[^#]*)?)$/i;

/**
 * Parse a URL string into a URL object, or null if invalid / dangerous.
 * Rejects javascript:, data:, vbscript:, blob:, and non-http(s) schemes.
 */
export function parseSafeHttpUrl(raw: string | null | undefined): URL | null {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return null;

  // Block obvious dangerous schemes before URL() normalizes them away.
  if (/^(javascript|data|vbscript|blob|file):/i.test(trimmed)) {
    return null;
  }

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    // Relative or scheme-less — only allow absolute http(s) for document links.
    if (candidate.startsWith('/') || candidate.startsWith('#')) return null;
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (!SAFE_HTTP.test(parsed.protocol)) return null;
  if (!parsed.hostname) return null;

  // Reject credentials in URL (user:pass@host)
  if (parsed.username || parsed.password) return null;

  return parsed;
}

/**
 * Safe href for "Open Original" / external document links.
 * Returns null when the URL must not be used as an href.
 */
export function sanitizeDocumentUrl(raw: string | null | undefined): string | null {
  const parsed = parseSafeHttpUrl(raw);
  if (!parsed) return null;
  // Prefer https; allow http only if the source already used it.
  return parsed.toString();
}

/**
 * Validate an embed iframe src. Only Google Docs/Drive allowlisted hosts + paths.
 */
export function sanitizeEmbedUrl(raw: string | null | undefined): string | null {
  const parsed = parseSafeHttpUrl(raw);
  if (!parsed) return null;
  if (parsed.protocol !== 'https:') return null;
  if (!EMBED_HOSTS.has(parsed.hostname.toLowerCase())) return null;
  if (!SAFE_GOOGLE_EMBED_RE.test(parsed.toString())) return null;
  return parsed.toString();
}

export function isSafeEmbedUrl(url: string | null | undefined): url is string {
  return sanitizeEmbedUrl(url) !== null;
}
