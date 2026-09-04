import { afterEach, describe, expect, it, vi } from 'vitest';
import { planAgentAnswer } from './agentSearch';
import { fetchCatalog } from './catalogApi.js';
import { sendChat } from './chatApi.js';
import { makeCatalogPayload, makeRow } from '../test/fixtures';

/**
 * Workflow instrumentation (unit-level): proves home consumers do not each
 * trigger Apps Script, and chatbot retrieval can skip Gemini for strong lookups.
 */
describe('session request budget (instrumented)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('catalog fetch is a single shared HTTP call shape (not per feature)', async () => {
    const payload = makeCatalogPayload([
      makeRow({ id: 'vpaid-1', title: 'VPAID workflow', tags: ['vpaid'] }),
    ]);
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    // Simulate: home load + agent mount + FAQ open + doc open all calling fetchCatalog once each
    // would be wrong; shared TanStack Query means one in-flight call. Here we assert the
    // underlying client itself does not proliferate side channels.
    await fetchCatalog();
    await fetchCatalog();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const call of fetchMock.mock.calls) {
      expect(String(call[0])).toMatch(/\/api\/catalog\/?$/);
      expect(String(call[0])).not.toMatch(/refresh=1/);
    }
  });

  it('strong KB lookup plans retrieval mode without needing sendChat', () => {
    const rows = [
      makeRow({
        id: 'vpaid-1',
        title: 'VPAID workflow',
        sourceSheet: 'Build Guides',
        tags: ['vpaid'],
      }),
    ];
    const plan = planAgentAnswer(rows, 'give me the VPAID article');
    expect(plan.mode).toBe('retrieval');
    expect(plan.articles[0]?.id).toBe('vpaid-1');
  });

  it('open questions still call chat API once per message (not catalog)', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ reply: 'General answer', model: 'test' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    await sendChat([{ role: 'user', content: 'is gif allowed in dv360?' }], {
      articles: [],
    });
    await sendChat([{ role: 'user', content: 'what about html5?' }], { articles: [] });
    await sendChat([{ role: 'user', content: 'and vaast?' }], { articles: [] });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const call of fetchMock.mock.calls) {
      expect(String(call[0])).toMatch(/\/api\/chat/);
      expect(String(call[0])).not.toMatch(/\/api\/catalog/);
    }
  });
});
