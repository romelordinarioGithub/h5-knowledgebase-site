import { describe, expect, it } from 'vitest';
import { classifyUrl } from '@h5-kb/shared';

describe('classifyUrl', () => {
  it('returns external for empty input', () => {
    expect(classifyUrl('')).toEqual({
      linkType: 'external',
      provider: 'external',
      embedUrl: null,
      canPreview: false,
    });
    expect(classifyUrl(null)).toEqual({
      linkType: 'external',
      provider: 'external',
      embedUrl: null,
      canPreview: false,
    });
  });

  it('builds google_doc preview embedUrl', () => {
    const result = classifyUrl('https://docs.google.com/document/d/abc123XYZ/edit');
    expect(result).toEqual({
      linkType: 'google_doc',
      provider: 'google_doc',
      embedUrl: 'https://docs.google.com/document/d/abc123XYZ/preview',
      canPreview: true,
    });
  });

  it('builds google_sheet preview embedUrl', () => {
    const result = classifyUrl(
      'https://docs.google.com/spreadsheets/d/sheetId99/edit#gid=0'
    );
    expect(result.linkType).toBe('google_sheet');
    expect(result.embedUrl).toBe(
      'https://docs.google.com/spreadsheets/d/sheetId99/preview'
    );
    expect(result.canPreview).toBe(true);
  });

  it('builds google_slides embed URL with player params', () => {
    const result = classifyUrl(
      'https://docs.google.com/presentation/d/slidesId55/edit'
    );
    expect(result.linkType).toBe('google_slides');
    expect(result.embedUrl).toBe(
      'https://docs.google.com/presentation/d/slidesId55/embed?start=false&loop=false&delayms=3000'
    );
    expect(result.canPreview).toBe(true);
  });

  it('builds google_drive file preview embedUrl', () => {
    const result = classifyUrl('https://drive.google.com/file/d/fileId77/view');
    expect(result).toEqual({
      linkType: 'google_drive',
      provider: 'google_drive',
      embedUrl: 'https://drive.google.com/file/d/fileId77/preview',
      canPreview: true,
    });
  });

  it('marks drive folders as non-previewable', () => {
    const result = classifyUrl(
      'https://drive.google.com/drive/folders/folderId88'
    );
    expect(result.linkType).toBe('google_drive');
    expect(result.embedUrl).toBeNull();
    expect(result.canPreview).toBe(false);
  });

  it('classifies SharePoint as non-previewable', () => {
    const result = classifyUrl(
      'https://contoso.sharepoint.com/sites/team/Shared%20Documents/doc.docx'
    );
    expect(result).toEqual({
      linkType: 'sharepoint',
      provider: 'sharepoint',
      embedUrl: null,
      canPreview: false,
    });
  });

  it('classifies OneDrive as non-previewable', () => {
    expect(classifyUrl('https://onedrive.live.com/?id=abc').linkType).toBe('onedrive');
    expect(classifyUrl('https://1drv.ms/w/s!abc').canPreview).toBe(false);
  });

  it('classifies unknown hosts as external', () => {
    const result = classifyUrl('https://example.com/docs/guide');
    expect(result).toEqual({
      linkType: 'external',
      provider: 'external',
      embedUrl: null,
      canPreview: false,
    });
  });

  it('accepts scheme-less Google Doc URLs', () => {
    const result = classifyUrl('docs.google.com/document/d/xyz789/edit');
    expect(result.linkType).toBe('google_doc');
    expect(result.embedUrl).toContain('/preview');
  });
});
