import { isAuthorized } from '../lib/auth.js';
import {
  CACHE_TTL_SECONDS,
  STALE_WHILE_REVALIDATE_SECONDS,
  fetchCatalogWithRetry,
  sendCorsPreflight,
  sendJson,
} from '../lib/catalog.js';
import { checkRateLimit, clientIp, RATE_LIMIT_HEADERS } from '../lib/rateLimit.js';

export const config = {
  // Node serverless (not Edge) — Hobby allows up to 60s; Apps Script cold starts need it.
  maxDuration: 60,
};

/**
 * GET /api/catalog — fetches Apps Script JSON (no JSONP), caches at the Vercel CDN,
 * retries with backoff, optional X-API-Key validation, and per-IP rate limiting.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    sendCorsPreflight(req, res);
    return;
  }

  if (req.method !== 'GET') {
    sendJson(req, res, { error: 'Method not allowed' }, 405);
    return;
  }

  const ip = clientIp(req);
  const rate = checkRateLimit(`catalog:${ip}`);
  if (!rate.allowed) {
    sendJson(
      req,
      res,
      { error: 'Too many requests', retryAfter: rate.retryAfterSec },
      429,
      {
        'Retry-After': String(rate.retryAfterSec),
        'X-RateLimit-Limit': String(RATE_LIMIT_HEADERS.max),
        'X-RateLimit-Remaining': '0',
        'Cache-Control': 'no-store',
      }
    );
    return;
  }

  if (!isAuthorized(req)) {
    sendJson(req, res, { error: 'Unauthorized' }, 401, { 'Cache-Control': 'no-store' });
    return;
  }

  const appsScriptUrl = process.env.APPS_SCRIPT_URL;
  if (!appsScriptUrl) {
    sendJson(req, res, { error: 'APPS_SCRIPT_URL is not configured' }, 503);
    return;
  }

  try {
    const payload = await fetchCatalogWithRetry(appsScriptUrl);
    sendJson(req, res, payload, 200, {
      'Cache-Control': `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`,
      'X-RateLimit-Limit': String(RATE_LIMIT_HEADERS.max),
      'X-RateLimit-Remaining': String(rate.remaining),
    });
  } catch (error) {
    sendJson(
      req,
      res,
      {
        error: 'Failed to fetch catalog',
        message: error instanceof Error ? error.message : String(error),
      },
      502,
      { 'Cache-Control': 'no-store' }
    );
  }
}
