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

export type FaqItem = {
  question: string;
  answer: string;
  answerHtml?: string;
};

export type CatalogPayload = {
  apiVersion: string;
  updatedAt: string;
  count: number;
  rows: CatalogRow[];
  faqs: FaqItem[];
  cachedAt?: number;
};
