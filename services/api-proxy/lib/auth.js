/**
 * Proxy access control helpers (API key + optional CORS origin allowlist).
 */

/**
 * @param {import('http').IncomingMessage} req
 * @returns {boolean}
 */
export function isAuthorized(req) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    // Production should set API_KEY; without it the endpoint is open (documented in SECURITY.md).
    return true;
  }

  const provided = String(req.headers['x-api-key'] || '');
  return provided.length > 0 && provided === apiKey;
}

/**
 * @returns {string[]}
 */
export function allowedOrigins() {
  const raw = process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS || '';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * @param {import('http').IncomingMessage} req
 * @returns {string}
 */
export function resolveCorsOrigin(req) {
  const allowlist = allowedOrigins();
  if (!allowlist.length) return '*';

  const origin = String(req.headers.origin || '');
  if (origin && allowlist.includes(origin)) return origin;
  // Non-browser clients (curl, server) have no Origin — allow without reflecting.
  if (!origin) return allowlist[0];
  return 'null';
}
