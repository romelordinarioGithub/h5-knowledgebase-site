import { matchSorter } from 'match-sorter';
import type { CatalogRow } from '../types/catalog';

export const AGENT_RESULT_LIMIT = 5;
/** Minimum boosted score to treat a hit as a strong direct-lookup match. */
export const STRONG_MATCH_SCORE = 50;

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'me',
  'my',
  'i',
  'give',
  'get',
  'find',
  'show',
  'send',
  'where',
  'is',
  'are',
  'do',
  'we',
  'have',
  'for',
  'of',
  'to',
  'about',
  'article',
  'articles',
  'link',
  'links',
  'url',
  'documentation',
  'docs',
  'doc',
  'guide',
  'guides',
  'please',
  'can',
  'you',
  'need',
  'want',
  'any',
  'our',
  'in',
  'on',
  'with',
  'from',
  'that',
  'this',
  'and',
  'or',
  'how',
  'should',
  'would',
  'could',
  'approach',
  'build',
  'builds',
  'work',
  'works',
  'working',
  'using',
  'use',
  'make',
  'creating',
  'create',
  'help',
  'explain',
]);

const LOOKUP_PATTERN =
  /\b(link|url|article|articles|guide|guides|doc|docs|documentation|where(?:'s| is)|find|show(?:\s+me)?|give(?:\s+me)?|send(?:\s+me)?|do\s+we\s+have|looking\s+for)\b/i;

export type AgentArticle = {
  id: string;
  title: string;
  category: string;
  subtitle: string;
  tags: string[];
};

export type ScoredAgentHit = {
  row: CatalogRow;
  score: number;
};

export function normalizeAgentQuery(query: string): string {
  return String(query || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s/+._-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Strip filler words so "give me the article link of the vpaid" → ["vpaid"]. */
export function extractSearchTerms(query: string): string[] {
  const normalized = normalizeAgentQuery(query);
  if (!normalized) return [];

  const terms = normalized
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));

  return [...new Set(terms)];
}

export function isDirectLookupRequest(query: string): boolean {
  return LOOKUP_PATTERN.test(String(query || ''));
}

function urlHostname(url: string) {
  try {
    return new URL(url.includes('://') ? url : `https://${url}`).hostname;
  } catch {
    return '';
  }
}

function scoreRow(row: CatalogRow, terms: string[], matchRank: number): number {
  let score = matchRank;
  const title = String(row.title || '').toLowerCase();
  const tags = (row.tags || []).map((t) => String(t).toLowerCase());
  const tagsJoined = tags.join(' ');
  const sheet = String(row.sourceSheet || '').toLowerCase();
  const authors = String(row.authors || '').toLowerCase();

  for (const term of terms) {
    if (title === term) score += 100;
    else if (title.startsWith(term)) score += 70;
    else if (title.includes(term)) score += 50;

    if (tags.some((tag) => tag === term || tag.includes(term))) score += 30;
    else if (tagsJoined.includes(term)) score += 20;

    if (sheet.includes(term)) score += 12;
    if (authors.includes(term)) score += 5;
  }

  return score;
}

/**
 * Search catalog rows for the Knowledge Agent (reuses match-sorter + light boosts).
 */
export function searchKnowledgeArticles(
  rows: CatalogRow[],
  query: string,
  options: { limit?: number } = {}
): ScoredAgentHit[] {
  const limit = options.limit ?? AGENT_RESULT_LIMIT;
  const terms = extractSearchTerms(query);
  const searchQuery = terms.join(' ') || normalizeAgentQuery(query);
  if (!searchQuery || !Array.isArray(rows) || !rows.length) return [];

  const matched = matchSorter(rows, searchQuery, {
    keys: [
      'title',
      (item) => (item.tags || []).join(' '),
      'sourceSheet',
      'authors',
      (item) => urlHostname(item.url || ''),
    ],
  });

  const scored = matched.map((row, index) => ({
    row,
    score: scoreRow(row, terms, matched.length - index),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.row.lastUpdateStamp || 0) - (a.row.lastUpdateStamp || 0);
  });

  return scored.slice(0, limit);
}

export function toAgentArticle(row: CatalogRow): AgentArticle {
  const tags = (row.tags || []).map((t) => String(t)).filter(Boolean);
  const usableTag = tags.find((t) => t.toLowerCase() !== 'featured') || '';
  return {
    id: row.id,
    title: row.title || 'Untitled',
    category: row.sourceSheet || 'Knowledge Base',
    subtitle: usableTag || row.sourceSheet || 'Knowledge Base article',
    tags,
  };
}

export function toAgentArticles(hits: ScoredAgentHit[]): AgentArticle[] {
  return hits.map((hit) => toAgentArticle(hit.row));
}

export function isStrongMatch(hit: ScoredAgentHit | undefined, query: string): boolean {
  if (!hit || hit.score < STRONG_MATCH_SCORE) return false;
  const terms = extractSearchTerms(query);
  if (!terms.length) return hit.score >= STRONG_MATCH_SCORE + 20;
  const title = String(hit.row.title || '').toLowerCase();
  const tags = (hit.row.tags || []).map((t) => String(t).toLowerCase());
  return terms.some(
    (term) => title.includes(term) || tags.some((tag) => tag.includes(term))
  );
}

export function formatFoundMessage(count: number): string {
  if (count <= 0) {
    return "I couldn't find a matching article in the H5 Knowledge Base. Try a different title, keyword, or category.";
  }
  if (count === 1) {
    return 'I found this article in the H5 Knowledge Base:';
  }
  return `I found ${count} relevant articles in the H5 Knowledge Base:`;
}

export const NO_RESULTS_MESSAGE = formatFoundMessage(0);

/**
 * Decide whether to skip Gemini (strong direct lookup) or call it with KB context.
 * When nothing matches the KB, still use Gemini for a general-knowledge answer.
 */
export function planAgentAnswer(rows: CatalogRow[], query: string) {
  const hits = searchKnowledgeArticles(rows, query, { limit: AGENT_RESULT_LIMIT });
  const articles = toAgentArticles(hits);
  const lookup = isDirectLookupRequest(query);

  if (lookup && hits.length && isStrongMatch(hits[0], query)) {
    return {
      mode: 'retrieval' as const,
      message: formatFoundMessage(articles.length),
      articles,
      hits,
    };
  }

  return {
    mode: 'gemini' as const,
    message: null as string | null,
    articles,
    hits,
  };
}

/** Compact article context for the Gemini request (no authoritative URLs). */
export function toGeminiArticleContext(articles: AgentArticle[]) {
  return articles.map((article) => ({
    id: article.id,
    title: article.title,
    category: article.category,
    tags: article.tags.slice(0, 6),
  }));
}
