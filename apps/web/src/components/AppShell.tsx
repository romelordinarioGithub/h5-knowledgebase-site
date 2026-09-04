/**
 * AppShell – the three-pane workspace layout.
 *
 * Structure (exact values from DESIGN.md / code.html):
 *   ┌─ Left Sidebar (16rem) ─┬─ Center Canvas (flex-1) ─┬─ Right Agent Panel (380/410px) ─┐
 *   │  Logo, navigation      │  Top bar + scroll area   │  Knowledge Agent (Gemini chat)  │
 *   └────────────────────────┴──────────────────────────┴─────────────────────────────────┘
 *
 * Responsive (DESIGN.md):
 *   ≤1279px: agent panel hidden
 *   ≤767px: sidebar hidden
 */

import type { ReactNode } from 'react';
import { KnowledgeAgentPanel } from './KnowledgeAgentPanel';
import { SystemStatusChip } from './SystemStatusChip';

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    home: (
      <path
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    build: (
      <>
        <line x1="5" y1="6" x2="19" y2="6" />
        <circle cx="9" cy="6" r="2" />
        <line x1="5" y1="12" x2="19" y2="12" />
        <circle cx="15" cy="12" r="2" />
        <line x1="5" y1="18" x2="19" y2="18" />
        <circle cx="11" cy="18" r="2" />
      </>
    ),
    templates: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <line x1="4" y1="10" x2="20" y2="10" />
      </>
    ),
    studio: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
    process: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <polyline points="14 3 14 8 19 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="15" y2="17" />
      </>
    ),
    tools: (
      <>
        <path d="M20 7h-9" />
        <path d="M14 17H5" />
        <circle cx="17" cy="17" r="3" />
        <circle cx="8" cy="7" r="3" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
  };

  return (
    <svg
      className="kb-nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

/** Sidebar topics mirror Browse All Topics sheet names (SOURCE_SHEETS). */
const NAV_ITEMS = [
  { icon: 'home', label: 'All Documentation', sheet: '' },
  { icon: 'build', label: 'Build Guides', sheet: 'Build Guides' },
  { icon: 'templates', label: 'Master Templates', sheet: 'Master Templates' },
  { icon: 'studio', label: 'Studio Setup', sheet: 'Studio Setup' },
  { icon: 'process', label: 'Process Docs', sheet: 'Process Docs' },
  { icon: 'tools', label: 'Internal Tools', sheet: 'Internal Tools' },
] as const;

type AppShellProps = {
  children: ReactNode;
  onOpenFaq?: () => void;
  /** Currently selected source sheet (empty = All Documentation). */
  selectedSheet?: string;
  /**
   * Topic navigation — same underlying behavior as Browse All Topics.
   * Pass empty string for All Documentation.
   */
  onSelectTopic?: (sheetName: string) => void;
  /** Replace the default home topbar (article detail header). */
  topbar?: ReactNode;
  /** Hide the Knowledge Agent rail (article detail layout). */
  hideAgent?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  /** When true, status chip must not claim a successful sync. */
  syncStale?: boolean;
};

export function AppShell({
  children,
  onOpenFaq,
  selectedSheet = '',
  onSelectTopic,
  topbar,
  hideAgent = false,
  onRefresh,
  refreshing = false,
  syncStale = false,
}: AppShellProps) {
  return (
    <div className={`kb-shell${hideAgent ? ' kb-shell--no-agent' : ''}`}>
      <aside className="kb-sidebar" aria-label="Main navigation">
        <div className="kb-sidebar-logo">
          <div className="kb-sidebar-logo-mark">H5</div>
          <div className="kb-sidebar-brand">
            <div className="kb-sidebar-brand-row">
              <span className="kb-sidebar-brand-name">H5 Team</span>
              <span className="kb-sidebar-brand-tag">Team</span>
            </div>
            <span className="kb-sidebar-brand-sub">Knowledge Base</span>
          </div>
        </div>

        <nav className="kb-sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const active = item.sheet === '' ? !selectedSheet : selectedSheet === item.sheet;
            return (
              <button
                key={item.label}
                type="button"
                className={`kb-nav-link${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => onSelectTopic?.(item.sheet)}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </button>
            );
          })}

          <div className="kb-sidebar-divider" />

          <button type="button" className="kb-nav-link" onClick={onOpenFaq}>
            <NavIcon name="help" />
            FAQ
          </button>
        </nav>

        <div className="kb-sidebar-footer">
          <div className="kb-sidebar-workspace">
            <div className="kb-sidebar-workspace-left">
              <div className="kb-sidebar-workspace-icon">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="kb-sidebar-workspace-name">H5 Workspace</div>
                <div className="kb-sidebar-workspace-ver">v2.6 Enterprise</div>
              </div>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--kb-outline)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </div>
        </div>
      </aside>

      <div className="kb-canvas">
        {topbar ?? (
          <header className="kb-topbar">
            <nav className="kb-breadcrumb" aria-label="Breadcrumb">
              <span className="kb-breadcrumb-parent">H5 Team</span>
              <span className="kb-breadcrumb-sep">/</span>
              <span className="kb-breadcrumb-current">Knowledge Base</span>
            </nav>

            <SystemStatusChip
              onRefresh={onRefresh}
              refreshing={refreshing}
              stale={syncStale}
            />
          </header>
        )}

        <div id="main-content" className="kb-scroll-area" tabIndex={-1}>
          {children}
        </div>
      </div>

      {hideAgent ? null : <KnowledgeAgentPanel />}
    </div>
  );
}
