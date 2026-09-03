/**
 * Simple in-memory sliding-window rate limiter.
 * Soft protection on serverless (per-instance); combine with API_KEY for real access control.
 */

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX) || 60;

/** @type {Map<string, { windowStart: number, count: number }>} */
const buckets = new Map();

const MAX_BUCKETS = 5_000;

/**
 * @param {import('http').IncomingMessage} req
 * @returns {string}
 */
export function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '')
    .split(',')[0]
    .trim();
  if (forwarded) return forwarded;
  const realIp = String(req.headers['x-real-ip'] || '').trim();
  if (realIp) return realIp;
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * @param {string} key
 * @returns {{ allowed: boolean, remaining: number, retryAfterSec: number }}
 */
export function checkRateLimit(key) {
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) {
    for (const [id, bucket] of buckets) {
      if (now - bucket.windowStart > WINDOW_MS) buckets.delete(id);
    }
  }

  let bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    bucket = { windowStart: now, count: 0 };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  const remaining = Math.max(0, MAX_REQUESTS - bucket.count);
  const retryAfterSec = Math.max(
    1,
    Math.ceil((WINDOW_MS - (now - bucket.windowStart)) / 1000)
  );

  if (bucket.count > MAX_REQUESTS) {
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  return { allowed: true, remaining, retryAfterSec };
}

export const RATE_LIMIT_HEADERS = {
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
};
