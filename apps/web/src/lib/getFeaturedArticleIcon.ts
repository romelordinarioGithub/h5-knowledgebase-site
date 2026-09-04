import type { ComponentType, SVGProps } from 'react';
import type { CatalogRow } from '../types/catalog';
import {
  FeaturedDocumentIcon,
  FeaturedGridIcon,
  FeaturedLinkIcon,
  FeaturedMapPinIcon,
  FeaturedSettingsIcon,
  FeaturedSlidersIcon,
  FeaturedSyncIcon,
  FeaturedTargetIcon,
  FeaturedVerifiedIcon,
  FeaturedWrenchIcon,
} from './featuredIcons';
import {
  BuildGuidesIcon,
  InternalToolsIcon,
  MasterTemplatesIcon,
  ProcessDocsIcon,
  StudioSetupIcon,
} from './topicIcons';

type IconProps = SVGProps<SVGSVGElement>;

type FeaturedIconKind =
  | 'document'
  | 'link'
  | 'sync'
  | 'verified'
  | 'target'
  | 'map'
  | 'sliders'
  | 'grid'
  | 'settings'
  | 'wrench';

const KEYWORD_RULES: Array<{ kind: FeaturedIconKind; pattern: RegExp }> = [
  { kind: 'verified', pattern: /\b(qa|escalation|verified|sla|hot.?fix|publish)\b/i },
  { kind: 'target', pattern: /\b(remarket|audience|retarget)\b/i },
  { kind: 'map', pattern: /\b(geo|geotarget|location|map.?pin|region)\b/i },
  {
    kind: 'sync',
    pattern: /\b(convert|converter|transform|reuse|rebuild|sync.?alt|identifier)\b/i,
  },
  { kind: 'link', pattern: /\b(feed|feeds|line.?item|dv360|placement|url.?link)\b/i },
  { kind: 'grid', pattern: /\b(template|templates|preset|module|grid)\b/i },
  {
    kind: 'sliders',
    pattern: /\b(dependent|selection|uvar|isdefault|configur|workflow|parameter)\b/i,
  },
  { kind: 'settings', pattern: /\b(setup|reference|studio|environment|spec)\b/i },
  { kind: 'wrench', pattern: /\b(tool|utility|formatter|diagnostic|script)\b/i },
];

const KIND_ICONS: Record<FeaturedIconKind, ComponentType<IconProps>> = {
  document: FeaturedDocumentIcon,
  link: FeaturedLinkIcon,
  sync: FeaturedSyncIcon,
  verified: FeaturedVerifiedIcon,
  target: FeaturedTargetIcon,
  map: FeaturedMapPinIcon,
  sliders: FeaturedSlidersIcon,
  grid: FeaturedGridIcon,
  settings: FeaturedSettingsIcon,
  wrench: FeaturedWrenchIcon,
};

const TOPIC_FALLBACK: Record<string, ComponentType<IconProps>> = {
  'Build Guides': BuildGuidesIcon,
  'Master Templates': MasterTemplatesIcon,
  'Studio Setup': StudioSetupIcon,
  'Process Docs': ProcessDocsIcon,
  'Internal Tools': InternalToolsIcon,
};

/**
 * Deterministic featured-row icon from title / tags / category.
 * Same inputs always yield the same icon (stable across reloads).
 */
export function getFeaturedArticleIcon(row: CatalogRow): ComponentType<IconProps> {
  const haystack = [row.title, row.sourceSheet, ...(row.tags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(haystack)) {
      return KIND_ICONS[rule.kind];
    }
  }

  return TOPIC_FALLBACK[row.sourceSheet] || FeaturedDocumentIcon;
}
