/**
 * Shared catalog fetch helpers for the Vercel API proxy.
 */

import { resolveCorsOrigin } from './auth.js';

export const CACHE_TTL_SECONDS = 300;
export const STALE_WHILE_REVALIDATE_SECONDS = 600;
/** Keep under Vercel maxDuration (60s) even with one retry. */
export const UPSTREAM_TIMEOUT_MS = 45_000;
export const MAX_RETRIES = 2;
export const INITIAL_BACKOFF_MS = 500;

export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export function applyCors(req, res) {
  const origin = resolveCorsOrigin(req);
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (origin !== '*') {
    res.setHeader('Vary', 'Origin');
  }
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {unknown} body
 * @param {number} [status]
 * @param {Record<string, string>} [extraHeaders]
 */
export function sendJson(req, res, body, status = 200, extraHeaders = {}) {
  applyCors(req, res);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }
  for (const [key, value] of Object.entries(extraHeaders)) {
    res.setHeader(key, value);
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export function sendCorsPreflight(req, res) {
  applyCors(req, res);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }
  res.statusCode = 204;
  res.end();
}

/**
 * @param {string} appsScriptUrl
 */
export async function fetchCatalogWithRetry(appsScriptUrl) {
  let lastError;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      return await fetchCatalogOnce(appsScriptUrl);
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES - 1) {
        await sleep(INITIAL_BACKOFF_MS * 2 ** attempt);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/**
 * @param {string} appsScriptUrl
 */
async function fetchCatalogOnce(appsScriptUrl) {
  const upstreamUrl = new URL(appsScriptUrl);
  upstreamUrl.searchParams.set('ts', String(Date.now()));

  // Apps Script web apps only reliably see query params (not custom headers).
  const upstreamKey = process.env.APPS_SCRIPT_API_KEY;
  if (upstreamKey) {
    upstreamUrl.searchParams.set('key', upstreamKey);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Apps Script HTTP ${response.status}: ${text.slice(0, 200)}`);
    }

    if (text.trim().startsWith('<!DOCTYPE') || text.includes('Sign in')) {
      throw new Error('Apps Script returned sign-in page — check deployment access');
    }

    const payload = JSON.parse(text);
    if (!payload || !Array.isArray(payload.rows)) {
      throw new Error('Invalid catalog payload from Apps Script');
    }

    return payload;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Apps Script timed out after ${UPSTREAM_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** @param {number} ms */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
