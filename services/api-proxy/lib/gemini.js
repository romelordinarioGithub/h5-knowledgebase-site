/**
 * Gemini Developer API helpers for the Knowledge Agent chat endpoint.
 */

export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';
export const DEFAULT_GEMINI_FALLBACK_MODEL = 'gemini-3.5-flash-lite';
/** Fail over to Lite sooner when Flash is hung / overloaded. Keep sum under Vercel maxDuration (60s). */
export const GEMINI_PRIMARY_TIMEOUT_MS = 15_000;
export const GEMINI_FALLBACK_TIMEOUT_MS = 40_000;
/** @deprecated use GEMINI_PRIMARY_TIMEOUT_MS / GEMINI_FALLBACK_TIMEOUT_MS */
export const GEMINI_TIMEOUT_MS = GEMINI_FALLBACK_TIMEOUT_MS;
export const MAX_MESSAGES = 20;
export const MAX_MESSAGE_CHARS = 4_000;

export const SYSTEM_PROMPT = `You are the Knowledge Agent for the H5 Knowledge Base (Smartly H5 team).
When Knowledge Base articles are supplied, prefer them and do not invent article titles, IDs, or URLs.
The app renders clickable cards separately — never invent internal links.
When no Knowledge Base articles are supplied, answer helpfully from general industry knowledge (for example DV360, Studio, creative trafficking).
In that case, briefly note that no matching internal H5 article was found, then answer the question.
Do not invent internal Smartly/H5 policy or fake documentation links.
Keep answers concise.`;

/**
 * @param {unknown} value
 * @returns {Array<{ id: string, title: string, category: string, tags: string[] }> | null}
 */
export function normalizeChatArticles(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  if (value.length > 8) return null;

  /** @type {Array<{ id: string, title: string, category: string, tags: string[] }>} */
  const articles = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const id = String(/** @type {{ id?: unknown }} */ (item).id || '').trim();
    const title = String(/** @type {{ title?: unknown }} */ (item).title || '').trim();
    const category = String(/** @type {{ category?: unknown }} */ (item).category || '').trim();
    const tagsRaw = /** @type {{ tags?: unknown }} */ (item).tags;
    if (!id || !title) return null;
    if (id.length > 200 || title.length > 300 || category.length > 200) return null;
    const tags = Array.isArray(tagsRaw)
      ? tagsRaw
          .filter((tag) => typeof tag === 'string')
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 8)
      : [];
    articles.push({ id, title, category: category || 'Knowledge Base', tags });
  }
  return articles;
}

/**
 * @param {Array<{ id: string, title: string, category: string, tags: string[] }>} articles
 */
export function buildArticlesSystemAddon(articles) {
  if (!articles.length) {
    return `AVAILABLE INTERNAL KNOWLEDGE BASE ARTICLES:
(none matched this question)

No internal article matched. Answer the user's question using general knowledge.
Start with a short note that nothing matched in the H5 Knowledge Base, then provide a useful answer.
Do not invent internal article titles or URLs.`;
  }

  const listing = articles
    .map((article, index) => {
      const tags = article.tags.length ? article.tags.join(', ') : '(none)';
      return `${index + 1}. Title: ${article.title}
   Category: ${article.category}
   Tags: ${tags}
   Id: ${article.id}`;
    })
    .join('\n\n');

  return `AVAILABLE INTERNAL KNOWLEDGE BASE ARTICLES:

${listing}

Answer using these results when relevant. Do not invent titles or URLs. The app will show clickable cards for these articles.`;
}

/**
 * @param {unknown} body
 * @returns {{ ok: true, messages: Array<{ role: 'user' | 'assistant', content: string }> } | { ok: false, error: string }}
 */
export function normalizeChatMessages(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const raw = /** @type {{ messages?: unknown }} */ (body).messages;
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: 'messages must be a non-empty array' };
  }
  if (raw.length > MAX_MESSAGES) {
    return { ok: false, error: `messages cannot exceed ${MAX_MESSAGES} items` };
  }

  /** @type {Array<{ role: 'user' | 'assistant', content: string }>} */
  const messages = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      return { ok: false, error: 'Each message must be an object' };
    }
    const role = /** @type {{ role?: unknown, content?: unknown }} */ (item).role;
    const content = /** @type {{ role?: unknown, content?: unknown }} */ (item).content;

    if (role !== 'user' && role !== 'assistant') {
      return { ok: false, error: 'message.role must be "user" or "assistant"' };
    }
    if (typeof content !== 'string') {
      return { ok: false, error: 'message.content must be a string' };
    }
    const trimmed = content.trim();
    if (!trimmed) {
      return { ok: false, error: 'message.content cannot be empty' };
    }
    if (trimmed.length > MAX_MESSAGE_CHARS) {
      return { ok: false, error: `message.content cannot exceed ${MAX_MESSAGE_CHARS} characters` };
    }
    messages.push({ role, content: trimmed });
  }

  if (messages[messages.length - 1].role !== 'user') {
    return { ok: false, error: 'The last message must be from the user' };
  }

  return { ok: true, messages };
}

/**
 * @param {Array<{ role: 'user' | 'assistant', content: string }>} messages
 */
export function toGeminiContents(messages) {
  return messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));
}

/**
 * @param {unknown} payload
 * @returns {string}
 */
export function extractGeminiText(payload) {
  const candidates = /** @type {{ candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }} */ (
    payload
  ).candidates;
  if (!Array.isArray(candidates) || !candidates.length) {
    throw new Error('Gemini returned no candidates');
  }

  const parts = candidates[0]?.content?.parts;
  if (!Array.isArray(parts) || !parts.length) {
    throw new Error('Gemini returned an empty response');
  }

  const text = parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  return text;
}

/**
 * True when Gemini is capacity/rate limited / timed out and a lighter model may succeed.
 * @param {unknown} error
 */
export function isCapacityError(error) {
  const status = Number(/** @type {{ status?: number }} */ (error)?.status);
  if (status === 429 || status === 503 || status === 504) return true;

  const message = String(/** @type {{ message?: string }} */ (error)?.message || '').toLowerCase();
  return (
    message.includes('high demand') ||
    message.includes('try again later') ||
    message.includes('resource exhausted') ||
    message.includes('unavailable') ||
    message.includes('overloaded') ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('temporarily') ||
    message.includes('timed out') ||
    message.includes('timeout')
  );
}

/**
 * @param {string} primary
 * @param {string} [fallback]
 * @returns {string[]}
 */
export function resolveModelChain(primary, fallback = DEFAULT_GEMINI_FALLBACK_MODEL) {
  const models = [primary];
  if (fallback && fallback !== primary) models.push(fallback);
  return models;
}

/**
 * @param {{
 *   apiKey: string,
 *   model?: string,
 *   timeoutMs?: number,
 *   messages: Array<{ role: 'user' | 'assistant', content: string }>,
 *   systemAddon?: string,
 * }} opts
 * @returns {Promise<{ reply: string, model: string }>}
 */
export async function generateChatReply({
  apiKey,
  model = DEFAULT_GEMINI_MODEL,
  timeoutMs = GEMINI_FALLBACK_TIMEOUT_MS,
  messages,
  systemAddon = '',
}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const systemText = systemAddon
    ? `${SYSTEM_PROMPT}\n\n${systemAddon}`
    : SYSTEM_PROMPT;

  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemText }],
        },
        contents: toGeminiContents(messages),
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 768,
        },
      }),
    });

    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(`Gemini returned non-JSON (HTTP ${response.status})`);
    }

    if (!response.ok) {
      const message =
        payload?.error?.message ||
        payload?.message ||
        `Gemini HTTP ${response.status}: ${text.slice(0, 200)}`;
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return {
      reply: extractGeminiText(payload),
      model,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutError = new Error(`Gemini timed out after ${timeoutMs}ms`);
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Tries primary model, then Flash-Lite on capacity / high-demand / timeout errors.
 * @param {{
 *   apiKey: string,
 *   model?: string,
 *   fallbackModel?: string,
 *   messages: Array<{ role: 'user' | 'assistant', content: string }>,
 *   systemAddon?: string,
 * }} opts
 * @returns {Promise<{ reply: string, model: string, fallbackUsed: boolean }>}
 */
export async function generateChatReplyWithFallback({
  apiKey,
  model = DEFAULT_GEMINI_MODEL,
  fallbackModel = DEFAULT_GEMINI_FALLBACK_MODEL,
  messages,
  systemAddon = '',
}) {
  const chain = resolveModelChain(model, fallbackModel);
  /** @type {unknown} */
  let lastError;

  for (let i = 0; i < chain.length; i += 1) {
    const timeoutMs = i === 0 ? GEMINI_PRIMARY_TIMEOUT_MS : GEMINI_FALLBACK_TIMEOUT_MS;
    try {
      const result = await generateChatReply({
        apiKey,
        model: chain[i],
        timeoutMs,
        messages,
        systemAddon,
      });
      return {
        ...result,
        fallbackUsed: i > 0,
      };
    } catch (error) {
      lastError = error;
      const hasNext = i < chain.length - 1;
      if (!hasNext || !isCapacityError(error)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/**
 * Read JSON body from a Node/Vercel request.
 * @param {import('http').IncomingMessage & { body?: unknown }} req
 * @returns {Promise<unknown>}
 */
export function readJsonBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      return Promise.resolve(req.body ? JSON.parse(req.body) : {});
    }
    return Promise.resolve(req.body);
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}
