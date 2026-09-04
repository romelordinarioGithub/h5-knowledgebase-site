import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getChatApiUrl, sendChat } from './chatApi.js';

describe('chatApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('getChatApiUrl defaults to /api/chat when env unset', () => {
    expect(getChatApiUrl()).toBe('/api/chat');
  });

  it('sendChat returns reply on success', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ reply: 'Hello from Gemini', model: 'gemini-3.6-flash' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await sendChat([{ role: 'user', content: 'Hi' }]);
    expect(result.reply).toBe('Hello from Gemini');
    expect(result.model).toBe('gemini-3.6-flash');
    expect(fetch).toHaveBeenCalledWith(
      '/api/chat',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Accept: 'application/json',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Hi' }] }),
      })
    );
  });

  it('sendChat throws on invalid JSON', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('not-json', { status: 200 }));
    await expect(sendChat([{ role: 'user', content: 'Hi' }])).rejects.toThrow('invalid JSON');
  });

  it('sendChat throws with API error message on non-OK', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: 'GEMINI_API_KEY is not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    await expect(sendChat([{ role: 'user', content: 'Hi' }])).rejects.toThrow(
      'GEMINI_API_KEY is not configured'
    );
  });

  it('sendChat throws when reply missing', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ model: 'gemini-3.6-flash' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    await expect(sendChat([{ role: 'user', content: 'Hi' }])).rejects.toThrow(
      'Invalid chat payload'
    );
  });
});
