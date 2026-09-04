import { describe, expect, it } from 'vitest';
import { getRelatedArticles, relatedArticleBlurb } from './relatedArticles';
import { makeRow } from '../test/fixtures';

describe('getRelatedArticles', () => {
  it('prefers same source sheet then shared tags', () => {
    const current = makeRow({
      id: 'a',
      sourceSheet: 'Studio Setup',
      tags: ['studio', 'feed'],
    });
    const sameSheet = makeRow({
      id: 'b',
      sourceSheet: 'Studio Setup',
      title: 'Same sheet',
      tags: [],
      lastUpdateStamp: 1,
    });
    const sharedTags = makeRow({
      id: 'c',
      sourceSheet: 'Build Guides',
      title: 'Shared tags',
      tags: ['feed'],
      lastUpdateStamp: 2,
    });
    const unrelated = makeRow({
      id: 'd',
      sourceSheet: 'FAQ',
      title: 'Unrelated',
      tags: ['other'],
    });

    const related = getRelatedArticles(current, [current, sameSheet, sharedTags, unrelated], 4);
    expect(related.map((r) => r.id)).toEqual(['b', 'c']);
  });

  it('excludes the current article', () => {
    const current = makeRow({ id: 'a', sourceSheet: 'Studio Setup' });
    const other = makeRow({ id: 'b', sourceSheet: 'Studio Setup' });
    expect(getRelatedArticles(current, [current, other]).map((r) => r.id)).toEqual(['b']);
  });
});

describe('relatedArticleBlurb', () => {
  it('uses a non-featured tag when available', () => {
    expect(relatedArticleBlurb(makeRow({ tags: ['featured', 'studio'] }))).toBe('studio');
  });

  it('returns null when no usable tag exists', () => {
    expect(relatedArticleBlurb(makeRow({ tags: ['featured'] }))).toBeNull();
    expect(relatedArticleBlurb(makeRow({ tags: [] }))).toBeNull();
  });
});
