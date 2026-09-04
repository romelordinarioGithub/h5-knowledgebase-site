import { describe, expect, it } from 'vitest';
import {
  extractSearchTerms,
  isDirectLookupRequest,
  isStrongMatch,
  planAgentAnswer,
  searchKnowledgeArticles,
} from './agentSearch';
import { makeRow } from '../test/fixtures';

const rows = [
  makeRow({
    id: 'vpaid-1',
    title: 'VPAID workflow',
    sourceSheet: 'Build Guides',
    tags: ['vpaid', 'video'],
  }),
  makeRow({
    id: 'gwd-1',
    title: 'GWD guideline',
    sourceSheet: 'Build Guides',
    tags: ['gwd', 'html5'],
  }),
  makeRow({
    id: 'filter-1',
    title: 'Browser or Device Filtering via CSS',
    sourceSheet: 'Studio Setup',
    tags: ['css', 'filtering', 'browser'],
  }),
  makeRow({
    id: 'studio-1',
    title: 'Studio Setup Reference Guide',
    sourceSheet: 'Studio Setup',
    tags: ['studio', 'setup'],
  }),
  makeRow({
    id: 'dv360-1',
    title: 'DV360 Line Item Feeds',
    sourceSheet: 'Studio Setup',
    tags: ['dv360', 'feeds'],
  }),
  makeRow({
    id: 'unrelated-1',
    title: 'QA Escalation Checklist',
    sourceSheet: 'Process Docs',
    tags: ['qa'],
  }),
];

describe('extractSearchTerms', () => {
  it('keeps topic terms from link-style questions', () => {
    expect(extractSearchTerms('give me the article link of the vpaid')).toEqual(['vpaid']);
  });
});

describe('isDirectLookupRequest', () => {
  it('detects link/article lookup phrasing', () => {
    expect(isDirectLookupRequest('give me the article link of the vpaid')).toBe(true);
    expect(isDirectLookupRequest('where is the studio setup documentation?')).toBe(true);
    expect(isDirectLookupRequest('how does VPAID work in general?')).toBe(false);
  });
});

describe('searchKnowledgeArticles', () => {
  it('ranks VPAID title/tag hits first', () => {
    const hits = searchKnowledgeArticles(rows, 'give me the article link of the vpaid');
    expect(hits[0]?.row.id).toBe('vpaid-1');
    expect(isStrongMatch(hits[0], 'give me the article link of the vpaid')).toBe(true);
  });

  it('finds GWD guideline', () => {
    const hits = searchKnowledgeArticles(rows, 'find the GWD guideline');
    expect(hits[0]?.row.id).toBe('gwd-1');
  });

  it('ranks browser filtering strongly', () => {
    const hits = searchKnowledgeArticles(rows, 'show me documentation about browser filtering');
    expect(hits[0]?.row.id).toBe('filter-1');
  });

  it('finds studio setup docs', () => {
    const hits = searchKnowledgeArticles(rows, 'where is the studio setup documentation?');
    expect(hits[0]?.row.id).toBe('studio-1');
  });

  it('returns empty for unknown terms', () => {
    expect(searchKnowledgeArticles(rows, 'give me the zxqqq article link')).toEqual([]);
  });
});

describe('planAgentAnswer', () => {
  it('bypasses Gemini for strong direct lookups', () => {
    const plan = planAgentAnswer(rows, 'give me the article link of the vpaid');
    expect(plan.mode).toBe('retrieval');
    expect(plan.articles[0]?.id).toBe('vpaid-1');
    expect(plan.message).toContain('H5 Knowledge Base');
  });

  it('falls back to Gemini when a lookup finds no KB articles', () => {
    const plan = planAgentAnswer(rows, 'give me the zxqqq article');
    expect(plan.mode).toBe('gemini');
    expect(plan.articles).toEqual([]);
  });

  it('falls back to Gemini for open questions with no KB match', () => {
    const plan = planAgentAnswer(rows, 'is gif allowed in dv360?');
    expect(plan.mode).toBe('gemini');
    expect(plan.articles).toEqual([]);
  });

  it('uses gemini mode for open questions with KB context', () => {
    const plan = planAgentAnswer(rows, 'how should we approach VPAID builds?');
    expect(plan.mode).toBe('gemini');
    expect(plan.articles.some((a) => a.id === 'vpaid-1')).toBe(true);
  });
});
