import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function IconBase(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props} />
  );
}

export function BuildGuidesIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <line x1="5" y1="6" x2="19" y2="6" />
      <circle cx="9" cy="6" r="2" />
      <line x1="5" y1="12" x2="19" y2="12" />
      <circle cx="15" cy="12" r="2" />
      <line x1="5" y1="18" x2="19" y2="18" />
      <circle cx="11" cy="18" r="2" />
    </IconBase>
  );
}

export function MasterTemplatesIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <line x1="4" y1="10" x2="20" y2="10" />
    </IconBase>
  );
}

export function StudioSetupIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .32 1.76l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.6 1.6 0 0 0 15 19.4a1.6 1.6 0 0 0-1 .86 1.6 1.6 0 0 0-.15.66V21a2 2 0 1 1-4 0v-.09a1.6 1.6 0 0 0-1.15-1.52 1.6 1.6 0 0 0-1.76.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.6 1.6 0 0 0 4.6 15a1.6 1.6 0 0 0-.86-1 1.6 1.6 0 0 0-.66-.15H3a2 2 0 1 1 0-4h.09a1.6 1.6 0 0 0 1.52-1.15 1.6 1.6 0 0 0-.32-1.76l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.6 1.6 0 0 0 9 4.6a1.6 1.6 0 0 0 1-.86 1.6 1.6 0 0 0 .15-.66V3a2 2 0 1 1 4 0v.09a1.6 1.6 0 0 0 1.15 1.52 1.6 1.6 0 0 0 1.76-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.6 1.6 0 0 0 19.4 9c.2.31.31.67.32 1.03V10a1.6 1.6 0 0 0 1.15 1.52c.21.07.43.1.65.11H21a2 2 0 1 1 0 4h-.09A1.6 1.6 0 0 0 19.4 15z" />
    </IconBase>
  );
}

export function ProcessDocsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <polyline points="14 3 14 8 19 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </IconBase>
  );
}

export function InternalToolsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 7h-9" />
      <path d="M14 17H5" />
      <circle cx="17" cy="17" r="3" />
      <circle cx="8" cy="7" r="3" />
    </IconBase>
  );
}
