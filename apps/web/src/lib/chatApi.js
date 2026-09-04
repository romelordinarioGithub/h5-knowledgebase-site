const DEFAULT_CHAT_URL = '/api/chat';

/**
 * @returns {string}
 */
export function getChatApiUrl() {
  if (import.meta.env.VITE_CHAT_API_URL) {
    return import.meta.env.VITE_CHAT_API_URL;
  }

  // Local Vite proxies /api → api-proxy. Do not derive from production catalog URL.
  if (import.meta.env.DEV) {
    return DEFAULT_CHAT_URL;
  }

  const catalogUrl = import.meta.env.VITE_CATALOG_API_URL;
  if (typeof catalogUrl === 'string' && catalogUrl.includes('/api/catalog')) {
    return catalogUrl.replace(/\/api\/catalog\/?$/, '/api/chat');
  }

  return DEFAULT_CHAT_URL;
}

/**
 * @returns {HeadersInit}
 */
function buildHeaders() {
  /** @type {Record<string, string>} */
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey) headers['X-API-Key'] = apiKey;
  return headers;
}

/**
 * @typedef {{ role: 'user' | 'assistant', content: string }} ChatMessage
 * @typedef {{ id: string, title: string, category: string, tags?: string[] }} ChatArticleContext
 */

/**
 * @param {ChatMessage[]} messages
 * @param {{ articles?: ChatArticleContext[] }} [options]
 * @returns {Promise<{ reply: string, model: string }>}
 */
export async function sendChat(messages, options = {}) {
  const body = {
    messages,
    ...(Array.isArray(options.articles) ? { articles: options.articles } : {}),
  };

  const response = await fetch(getChatApiUrl(), {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let payload;

  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error('Chat API returned invalid JSON');
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  if (!payload || typeof payload.reply !== 'string' || !payload.reply.trim()) {
    throw new Error('Invalid chat payload');
  }

  return {
    reply: payload.reply.trim(),
    model: typeof payload.model === 'string' ? payload.model : '',
  };
}
