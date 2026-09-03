import type { FaqItem } from '../types/catalog';
import type { SortKey } from './search';

export const DEFAULT_FAQS: FaqItem[] = [
  {
    question: 'How do I search effectively?',
    answer:
      'Type keywords from titles, tags, authors, or source sheets. Press / to focus search. Matches are highlighted in results.',
  },
  {
    question: 'How do filters work?',
    answer:
      'Combine Source Sheet, Document Title, Link Type, and Sort. Filters sync to the URL so you can share filtered views.',
  },
  {
    question: 'Where do featured articles come from?',
    answer:
      'Rows marked Featured in the spreadsheet (Y/yes/1) are preferred. If none are marked, a random selection is shown.',
  },
  {
    question: 'How do I open full document details?',
    answer:
      'Click a card or View to open the in-app detail page. Use Open Original to open the source file in a new tab.',
  },
  {
    question: 'Why can’t I see data sometimes?',
    answer: 'If data fails to load, verify sharing/access settings and refresh once.',
  },
];

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest update' },
  { value: 'oldest', label: 'Oldest update' },
  { value: 'az', label: 'Title A-Z' },
  { value: 'za', label: 'Title Z-A' },
];

export const VIRTUALIZE_THRESHOLD = 100;
