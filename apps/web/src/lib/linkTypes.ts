import type { LinkType } from '../types/catalog';

export const LINK_TYPE_LABELS: Record<LinkType, string> = {
  google_slides: 'Google Slides',
  google_doc: 'Google Doc',
  google_sheet: 'Google Sheet',
  google_drive: 'Google Drive',
  sharepoint: 'SharePoint',
  onedrive: 'OneDrive',
  external: 'External link',
  unknown: 'Unknown',
};

export function linkTypeLabel(linkType: string) {
  return LINK_TYPE_LABELS[linkType as LinkType] || linkType;
}
