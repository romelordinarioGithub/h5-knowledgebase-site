/** Shared catalog types for the web app (mirrors @h5-kb/shared JSDoc). */

export type LinkType =
  | 'google_slides'
  | 'google_doc'
  | 'google_sheet'
  | 'google_drive'
  | 'sharepoint'
  | 'onedrive'
  | 'external'
  | 'unknown';

export type CatalogRow = {
  id: string;
  sourceSheet: string;
  title: string;
  url: string;
  lastUpdate: string;
  lastUpdateStamp: number;
  authors: string;
  tags: string[];
  featured?: boolean;
  linkType?: LinkType;
  provider?: LinkType;
  embedUrl?: string | null;
  canPreview?: boolean;
};

/** Structured FAQ block types from the spreadsheet (presentation-agnostic). */
export type FaqBlockType =
  | 'heading'
  | 'paragraph'
  | 'key_value'
  | 'callout'
  | 'list'
  | 'link';

export type FaqBlock = {
  order: number;
  type: FaqBlockType;
  title: string;
  content: string;
  /** Presentation hint only: warning | info | neutral | bullet | ordered | highlight | … */
  variant: string;
};

export type FaqItem = {
  /** Stable id from spreadsheet (e.g. FAQ-001). */
  id?: string;
  question: string;
  /** Plain-text fallback / legacy answers. */
  answer: string;
  /** Legacy rich-text HTML from Sheets (sanitized before render). */
  answerHtml?: string;
  /** Structured blocks; preferred over answer/answerHtml when present. */
  blocks?: FaqBlock[];
};

export type CatalogPayload = {
  apiVersion: string;
  updatedAt: string;
  count: number;
  rows: CatalogRow[];
  faqs: FaqItem[];
  cachedAt?: number;
};
