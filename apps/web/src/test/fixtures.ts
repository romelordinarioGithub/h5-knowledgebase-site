import type { CatalogPayload, CatalogRow } from '../types/catalog';

export function makeRow(overrides: Partial<CatalogRow> = {}): CatalogRow {
  return {
    id: '1198250871-entry-1',
    sourceSheet: 'Build Guides',
    title: 'Sample Build Guide',
    url: 'https://docs.google.com/document/d/abc123XYZ/edit',
    lastUpdate: 'Feb 2025',
    lastUpdateStamp: 1738368000000,
    authors: 'Test Author',
    tags: ['build', 'guide'],
    linkType: 'google_doc',
    provider: 'google_doc',
    embedUrl: 'https://docs.google.com/document/d/abc123XYZ/preview',
    canPreview: true,
    ...overrides,
  };
}

export function makeCatalogPayload(
  rows: CatalogRow[] = [makeRow()],
  overrides: Partial<CatalogPayload> = {}
): CatalogPayload {
  return {
    apiVersion: 'test-1',
    updatedAt: '2026-09-03T00:00:00.000Z',
    count: rows.length,
    rows,
    faqs: [
      {
        id: 'FAQ-TEST',
        question: 'What is this?',
        answer: 'A knowledge base.',
        blocks: [
          {
            order: 1,
            type: 'paragraph',
            title: '',
            content: 'A knowledge base.',
            variant: '',
          },
        ],
      },
    ],
    ...overrides,
  };
}

/** Fixture rows covering preview matrix link types for E2E / integration. */
export const E2E_FIXTURE_ROWS: CatalogRow[] = [
  makeRow({
    id: 'doc-google-doc',
    title: 'Alpha Google Doc',
    sourceSheet: 'Build Guides',
    url: 'https://docs.google.com/document/d/docIdAAA/edit',
    linkType: 'google_doc',
    provider: 'google_doc',
    embedUrl: 'https://docs.google.com/document/d/docIdAAA/preview',
    canPreview: true,
    lastUpdateStamp: 2000,
  }),
  makeRow({
    id: 'doc-google-slides',
    title: 'Beta Google Slides',
    sourceSheet: 'Master Templates',
    url: 'https://docs.google.com/presentation/d/slidesIdBBB/edit',
    linkType: 'google_slides',
    provider: 'google_slides',
    embedUrl:
      'https://docs.google.com/presentation/d/slidesIdBBB/embed?start=false&loop=false&delayms=3000',
    canPreview: true,
    lastUpdateStamp: 3000,
  }),
  makeRow({
    id: 'doc-sharepoint',
    title: 'Gamma SharePoint File',
    sourceSheet: 'Process Docs',
    url: 'https://contoso.sharepoint.com/sites/team/Shared%20Documents/file.docx',
    linkType: 'sharepoint',
    provider: 'sharepoint',
    embedUrl: null,
    canPreview: false,
    lastUpdateStamp: 1000,
  }),
  makeRow({
    id: 'doc-external',
    title: 'Delta External Tool',
    sourceSheet: 'Internal Tools',
    url: 'https://example.com/tool',
    linkType: 'external',
    provider: 'external',
    embedUrl: null,
    canPreview: false,
    lastUpdateStamp: 4000,
  }),
];

export const E2E_CATALOG = makeCatalogPayload(E2E_FIXTURE_ROWS);
