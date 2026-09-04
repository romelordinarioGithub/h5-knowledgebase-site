import { isAuthorized } from '../lib/auth.js';
import { sendCorsPreflight, sendJson } from '../lib/catalog.js';
import {
  DEFAULT_GEMINI_FALLBACK_MODEL,
  DEFAULT_GEMINI_MODEL,
  buildArticlesSystemAddon,
  generateChatReplyWithFallback,
  normalizeChatArticles,
  normalizeChatMessages,
  readJsonBody,
} from '../lib/gemini.js';
import { checkRateLimit, clientIp, RATE_LIMIT_HEADERS } from '../lib/rateLimit.js';

export const config = {
  maxDuration: 60,
};

/**
 * POST /api/chat — Knowledge Agent reply via Gemini Developer API (free tier compatible).
 *
 * Body: {
 *   messages: Array<{ role: 'user' | 'assistant', content: string }>,
 *   articles?: Array<{ id: string, title: string, category: string, tags?: string[] }>
 * }
 * Response: { reply: string, model: string, fallbackUsed?: boolean }
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    sendCorsPreflight(req, res);
    return;
  }

  if (req.method !== 'POST') {
    sendJson(req, res, { error: 'Method not allowed' }, 405, { 'Cache-Control': 'no-store' });
    return;
  }

  const ip = clientIp(req);
  const rate = checkRateLimit(`chat:${ip}`);
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    sendJson(
      req,
      res,
      { error: 'GEMINI_API_KEY is not configured' },
      503,
      { 'Cache-Control': 'no-store' }
    );
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(req, res, { error: 'Invalid JSON body' }, 400, { 'Cache-Control': 'no-store' });
    return;
  }

  const normalized = normalizeChatMessages(body);
  if (!normalized.ok) {
    sendJson(req, res, { error: normalized.error }, 400, { 'Cache-Control': 'no-store' });
    return;
  }

  const articles = normalizeChatArticles(
    body && typeof body === 'object' ? /** @type {{ articles?: unknown }} */ (body).articles : undefined
  );
  if (articles === null) {
    sendJson(
      req,
      res,
      { error: 'articles must be an array of { id, title, category, tags? }' },
      400,
      { 'Cache-Control': 'no-store' }
    );
    return;
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || DEFAULT_GEMINI_FALLBACK_MODEL;

  try {
    const result = await generateChatReplyWithFallback({
      apiKey,
      model,
      fallbackModel,
      messages: normalized.messages,
      systemAddon: buildArticlesSystemAddon(articles),
    });

    sendJson(
      req,
      res,
      {
        reply: result.reply,
        model: result.model,
        fallbackUsed: result.fallbackUsed,
      },
      200,
      {
        'Cache-Control': 'no-store',
        'X-RateLimit-Limit': String(RATE_LIMIT_HEADERS.max),
        'X-RateLimit-Remaining': String(rate.remaining),
      }
    );
  } catch (error) {
    const status = Number(/** @type {{ status?: number }} */ (error).status) || 502;
    const safeStatus = status >= 400 && status < 600 ? status : 502;
    sendJson(
      req,
      res,
      {
        error: 'Failed to generate chat reply',
        message: error instanceof Error ? error.message : String(error),
      },
      safeStatus >= 500 ? 502 : safeStatus,
      { 'Cache-Control': 'no-store' }
    );
  }
}
