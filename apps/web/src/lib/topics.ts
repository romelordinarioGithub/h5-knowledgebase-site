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

export function getTopicIcon(sheetName: string) {
  return TOPIC_ICONS[sheetName] || BuildGuidesIcon;
}

export function getTopicSubtitle(sheetName: string, count: number) {
  const copy: Record<string, string> = {
    'Build Guides': 'Follow easy steps to build and launch with confidence',
    'Master Templates': 'Pre-built templates to help you create with ease',
    'Studio Setup': 'Setup references for launching studio workflows',
    'Process Docs': 'Process documentation for repeatable execution',
    'Internal Tools': 'Access essential tools to streamline your workflow',
  };

  return copy[sheetName] || `${count} articles available`;
}
