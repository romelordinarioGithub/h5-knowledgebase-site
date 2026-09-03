import { describe, expect, it } from 'vitest';
import { resolveEmbedPlan } from './embed';
import { makeRow } from '../test/fixtures';

describe('resolveEmbedPlan', () => {
  it('returns preview plan for google_doc with valid embedUrl', () => {
    const plan = resolveEmbedPlan(
      makeRow({
        url: 'https://docs.google.com/document/d/abc123XYZ/edit',
        embedUrl: 'https://docs.google.com/document/d/abc123XYZ/preview',
        linkType: 'google_doc',
        canPreview: true,
      })
    );
    expect(plan.canPreview).toBe(true);
    expect(plan.embedUrl).toBe(
      'https://docs.google.com/document/d/abc123XYZ/preview'
    );
    expect(plan.linkType).toBe('google_doc');
  });

  it('builds embed from classifier when row.embedUrl is missing', () => {
    const plan = resolveEmbedPlan(
      makeRow({
        url: 'https://docs.google.com/presentation/d/slides99/edit',
        embedUrl: null,
        linkType: undefined,
        canPreview: undefined,
      })
    );
    expect(plan.canPreview).toBe(true);
    expect(plan.embedUrl).toContain('/embed?');
    expect(plan.linkType).toBe('google_slides');
  });

  it('rejects missing URL', () => {
    const plan = resolveEmbedPlan(makeRow({ url: '', embedUrl: null }));
    expect(plan).toMatchObject({
      canPreview: false,
      embedUrl: null,
      reason: 'missing_url',
    });
  });

  it('rejects unsafe javascript: URLs', () => {
    const plan = resolveEmbedPlan(
      makeRow({ url: 'javascript:alert(1)', embedUrl: null })
    );
    expect(plan.reason).toBe('unsafe_url');
    expect(plan.canPreview).toBe(false);
  });

  it('rejects PowerPoint URLs', () => {
    const plan = resolveEmbedPlan(
      makeRow({
        url: 'https://example.com/deck.pptx',
        linkType: 'external',
        embedUrl: null,
      })
    );
    expect(plan.reason).toBe('ppt');
    expect(plan.canPreview).toBe(false);
  });

  it('skips SharePoint / OneDrive / external without iframe', () => {
    expect(
      resolveEmbedPlan(
        makeRow({
          url: 'https://contoso.sharepoint.com/file.docx',
          linkType: 'sharepoint',
          embedUrl: null,
        })
      ).reason
    ).toBe('unsupported_type');

    expect(
      resolveEmbedPlan(
        makeRow({
          url: 'https://onedrive.live.com/?id=1',
          linkType: 'onedrive',
          embedUrl: null,
        })
      ).canPreview
    ).toBe(false);

    expect(
      resolveEmbedPlan(
        makeRow({
          url: 'https://example.com/tool',
          linkType: 'external',
          embedUrl: null,
        })
      ).reason
    ).toBe('unsupported_type');
  });

  it('honors canPreview: false from payload', () => {
    const plan = resolveEmbedPlan(
      makeRow({
        url: 'https://docs.google.com/document/d/abc123XYZ/edit',
        embedUrl: 'https://docs.google.com/document/d/abc123XYZ/preview',
        canPreview: false,
      })
    );
    expect(plan.canPreview).toBe(false);
    expect(plan.embedUrl).toBeNull();
    expect(plan.reason).toBe('unsupported_type');
  });

  it('rejects non-allowlisted embed hosts', () => {
    const plan = resolveEmbedPlan(
      makeRow({
        url: 'https://docs.google.com/document/d/abc123XYZ/edit',
        embedUrl: 'https://evil.example/embed',
        canPreview: true,
      })
    );
    expect(plan.canPreview).toBe(false);
    expect(plan.reason).toBe('invalid_embed');
  });
});
