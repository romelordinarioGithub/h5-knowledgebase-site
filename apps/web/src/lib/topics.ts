import type { ComponentType, SVGProps } from 'react';
import {
  BuildGuidesIcon,
  InternalToolsIcon,
  MasterTemplatesIcon,
  ProcessDocsIcon,
  StudioSetupIcon,
} from './topicIcons';

type IconProps = SVGProps<SVGSVGElement>;

const TOPIC_ICONS: Record<string, ComponentType<IconProps>> = {
  'Build Guides': BuildGuidesIcon,
  'Master Templates': MasterTemplatesIcon,
  'Studio Setup': StudioSetupIcon,
  'Process Docs': ProcessDocsIcon,
  'Internal Tools': InternalToolsIcon,
};

/** Stable category → color tone for pills across Featured + Articles table. */
export type CategoryTone = 'purple' | 'blue' | 'teal' | 'amber' | 'slate';

const CATEGORY_TONES: Record<string, CategoryTone> = {
  'Build Guides': 'purple',
  'Master Templates': 'blue',
  'Studio Setup': 'teal',
  'Process Docs': 'amber',
  'Internal Tools': 'slate',
};

export function getCategoryTone(sheetName: string): CategoryTone {
  return CATEGORY_TONES[sheetName] || 'slate';
}

/** Shared category pill classes: shape base + consistent color tone. */
export function getCategoryBadgeClass(
  sheetName: string,
  shape: 'pill' | 'tag' = 'pill'
): string {
  const base = shape === 'pill' ? 'kb-badge' : 'kb-feat-cat';
  return `${base} kb-cat-${getCategoryTone(sheetName)}`;
}

export function getTopicIcon(sheetName: string) {
  return TOPIC_ICONS[sheetName] || BuildGuidesIcon;
}

export function getTopicSubtitle(sheetName: string, count: number) {
  const copy: Record<string, string> = {
    'Build Guides': 'Step-by-step setup and verified launch instructions',
    'Master Templates': 'Pre-built modules, format presets, and assets',
    'Studio Setup': 'Environment configuration and feed specs',
    'Process Docs': 'Standard operating guides and review gates',
    'Internal Tools': 'Diagnostic scripts, formatters, and utilities',
  };

  return copy[sheetName] || `${count} articles available`;
}
