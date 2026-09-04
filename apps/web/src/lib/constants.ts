import type { FaqItem } from '../types/catalog';
import type { SortKey } from './search';

export const DEFAULT_FAQS: FaqItem[] = [
  {
    question: 'How do I search effectively?',
    answer:
      'Type keywords from titles, tags, authors, or source sheets. Press / or ⌘K (Ctrl+K) to focus search. Matches are highlighted in results.',
  },
  {
    question: 'How do categories and search work?',
    answer:
      'Use the sidebar or topic cards to browse by category, search from the hero, and sort the article list. Shareable URLs keep your category and search state.',
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

/** Dispatched when FAQ "Ask Agent" should focus the Knowledge Agent composer. */
export const FOCUS_AGENT_EVENT = 'kb:focus-agent';
