import { describe, expect, it } from 'vitest';
import {
  groupFaqSheetRows,
  normalizeFaqItem,
  normalizeFaqs,
  segmentFaqBlocks,
  splitListItems,
} from './faq';

describe('faq', () => {
  it('groups spreadsheet rows by FAQ ID and Block Order', () => {
    const faqs = groupFaqSheetRows([
      {
        faqId: 'FAQ-001',
        question: 'Expense update',
        blockOrder: 3,
        blockType: 'key_value',
        title: 'TIN',
        content: '010',
        variant: 'highlight',
      },
      {
        faqId: 'FAQ-001',
        question: 'Expense update',
        blockOrder: 1,
        blockType: 'heading',
        title: 'Expense update',
      },
      {
        faqId: 'FAQ-001',
        question: 'Expense update',
        blockOrder: 2,
        blockType: 'paragraph',
        content: 'First paragraph',
      },
      {
        faqId: 'FAQ-002',
        question: 'Timesheet',
        blockOrder: 1,
        blockType: 'list',
        content: 'Step A\nStep B',
        variant: 'ordered',
      },
    ]);

    expect(faqs).toHaveLength(2);
    expect(faqs[0].id).toBe('FAQ-001');
    expect(faqs[0].blocks?.map((b) => b.type)).toEqual([
      'heading',
      'paragraph',
      'key_value',
    ]);
    expect(faqs[0].blocks?.[2].variant).toBe('highlight');
    expect(faqs[1].question).toBe('Timesheet');
  });

  it('segments consecutive key_value blocks into one panel group', () => {
    const segments = segmentFaqBlocks([
      { order: 1, type: 'heading', title: 'Q', content: '', variant: '' },
      { order: 2, type: 'paragraph', title: '', content: 'Intro', variant: '' },
      {
        order: 3,
        type: 'key_value',
        title: 'Name',
        content: 'Acme',
        variant: '',
      },
      {
        order: 4,
        type: 'key_value',
        title: 'TIN',
        content: '123',
        variant: 'highlight',
      },
      {
        order: 5,
        type: 'callout',
        title: 'Note',
        content: 'Careful',
        variant: 'warning',
      },
    ]);

    expect(segments).toEqual([
      {
        kind: 'block',
        block: expect.objectContaining({ type: 'paragraph' }),
      },
      {
        kind: 'key_value_group',
        blocks: [
          expect.objectContaining({ title: 'Name' }),
          expect.objectContaining({ title: 'TIN', variant: 'highlight' }),
        ],
      },
      {
        kind: 'block',
        block: expect.objectContaining({ type: 'callout', variant: 'warning' }),
      },
    ]);
  });

  it('merges consecutive list rows into one list group for ordered numbering', () => {
    const segments = segmentFaqBlocks([
      { order: 1, type: 'heading', title: 'Q', content: '', variant: '' },
      {
        order: 2,
        type: 'list',
        title: '',
        content: 'Login to your workday account',
        variant: 'ordered',
      },
      {
        order: 3,
        type: 'list',
        title: '',
        content: 'Go to Menu > Apps > Time',
        variant: 'ordered',
      },
      {
        order: 4,
        type: 'list',
        title: '',
        content: 'Under Enter Time, select a week',
        variant: 'ordered',
      },
      {
        order: 5,
        type: 'callout',
        title: '',
        content: 'Note',
        variant: 'neutral',
      },
    ]);

    expect(segments).toEqual([
      {
        kind: 'list_group',
        blocks: [
          expect.objectContaining({ content: 'Login to your workday account' }),
          expect.objectContaining({ content: 'Go to Menu > Apps > Time' }),
          expect.objectContaining({ content: 'Under Enter Time, select a week' }),
        ],
      },
      {
        kind: 'block',
        block: expect.objectContaining({ type: 'callout' }),
      },
    ]);
  });

  it('converts legacy answer-only FAQs into a paragraph block', () => {
    const item = normalizeFaqItem({
      question: 'How do filters work?',
      answer: 'Combine filters in the URL.',
    });
    expect(item?.blocks).toEqual([
      {
        order: 1,
        type: 'paragraph',
        title: '',
        content: 'Combine filters in the URL.',
        variant: '',
      },
    ]);
  });

  it('keeps legacy answerHtml without inventing blocks', () => {
    const item = normalizeFaqItem({
      question: 'Linked answer?',
      answer: 'See docs',
      answerHtml: 'See <a href="https://example.com">docs</a>',
    });
    expect(item?.blocks).toEqual([]);
    expect(item?.answerHtml).toContain('<a href');
  });

  it('splits list content on newlines and strips markers', () => {
    expect(splitListItems('1. One\n2. Two\n• Three')).toEqual(['One', 'Two', 'Three']);
  });

  it('normalizeFaqs drops empty items', () => {
    expect(
      normalizeFaqs([
        { question: '', answer: 'x' },
        { question: 'Valid', answer: 'Yes' },
      ])
    ).toHaveLength(1);
  });
});
