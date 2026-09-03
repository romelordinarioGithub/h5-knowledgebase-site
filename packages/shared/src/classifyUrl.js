/** @typedef {'google_slides' | 'google_doc' | 'google_sheet' | 'google_drive' | 'sharepoint' | 'onedrive' | 'external'} LinkType */

/**
 * @typedef {Object} UrlClassification
 * @property {LinkType} linkType
 * @property {LinkType} provider
 * @property {string | null} embedUrl
 * @property {boolean} canPreview
 */

const GOOGLE_DOC_RE = /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/;
const GOOGLE_SHEET_RE = /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;
const GOOGLE_SLIDES_RE = /docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/;
const GOOGLE_DRIVE_FILE_RE = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
const GOOGLE_DRIVE_FOLDER_RE = /drive\.google\.com\/(?:drive\/folders|open\?id=)([a-zA-Z0-9_-]+)/;
const SHAREPOINT_RE = /\.sharepoint\.com/i;
const ONEDRIVE_RE = /(?:onedrive\.live\.com|1drv\.ms|onedrive\.com)/i;

/**
 * @param {string | null | undefined} raw
 * @returns {UrlClassification}
 */
export function classifyUrl(raw) {
  const url = String(raw || '').trim();
  if (!url) {
    return { linkType: 'external', provider: 'external', embedUrl: null, canPreview: false };
  }

  let normalized = url;
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  let docMatch = url.match(GOOGLE_DOC_RE);
  if (docMatch) {
    const id = docMatch[1];
    return {
      linkType: 'google_doc',
      provider: 'google_doc',
      embedUrl: `https://docs.google.com/document/d/${id}/preview`,
      canPreview: true,
    };
  }

  let sheetMatch = url.match(GOOGLE_SHEET_RE);
  if (sheetMatch) {
    const id = sheetMatch[1];
    return {
      linkType: 'google_sheet',
      provider: 'google_sheet',
      embedUrl: `https://docs.google.com/spreadsheets/d/${id}/preview`,
      canPreview: true,
    };
  }

  let slidesMatch = url.match(GOOGLE_SLIDES_RE);
  if (slidesMatch) {
    const id = slidesMatch[1];
    return {
      linkType: 'google_slides',
      provider: 'google_slides',
      embedUrl: `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&delayms=3000`,
      canPreview: true,
    };
  }

  let driveFileMatch = url.match(GOOGLE_DRIVE_FILE_RE);
  if (driveFileMatch) {
    const id = driveFileMatch[1];
    return {
      linkType: 'google_drive',
      provider: 'google_drive',
      embedUrl: `https://drive.google.com/file/d/${id}/preview`,
      canPreview: true,
    };
  }

  if (GOOGLE_DRIVE_FOLDER_RE.test(url) || url.includes('drive.google.com')) {
    return { linkType: 'google_drive', provider: 'google_drive', embedUrl: null, canPreview: false };
  }

  if (SHAREPOINT_RE.test(normalized)) {
    return { linkType: 'sharepoint', provider: 'sharepoint', embedUrl: null, canPreview: false };
  }

  if (ONEDRIVE_RE.test(normalized)) {
    return { linkType: 'onedrive', provider: 'onedrive', embedUrl: null, canPreview: false };
  }

  return { linkType: 'external', provider: 'external', embedUrl: null, canPreview: false };
}
