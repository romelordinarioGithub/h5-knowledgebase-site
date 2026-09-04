/** Shared sync status pill used on home and article topbars. */

type SystemStatusChipProps = {
  onRefresh?: () => void;
  refreshing?: boolean;
  /** True when UI is showing last-known-good data after a live fetch failure. */
  stale?: boolean;
};

function statusLabel(refreshing: boolean, stale: boolean) {
  if (refreshing) return 'Refreshing…';
  if (stale) return 'Showing cached data';
  return 'All systems synced';
}

function RefreshIcon({ spinning }: { spinning?: boolean }) {
  return (
    <svg
      className={spinning ? 'kb-status-refresh-icon is-spinning' : 'kb-status-refresh-icon'}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

export function SystemStatusChip({
  onRefresh,
  refreshing = false,
  stale = false,
}: SystemStatusChipProps) {
  const label = statusLabel(refreshing, stale);
  const actionTitle = stale
    ? 'Live sync failed — click to retry refresh from spreadsheet'
    : 'Refresh catalog from spreadsheet';

  if (onRefresh) {
    return (
      <button
        type="button"
        className={`kb-status-chip kb-status-chip--button${stale && !refreshing ? ' is-stale' : ''}`}
        onClick={onRefresh}
        disabled={refreshing}
        aria-busy={refreshing || undefined}
        aria-label={`${label}. ${actionTitle}`}
        title={actionTitle}
      >
        <span className="kb-status-dot" aria-hidden="true" />
        {label}
        <span className="kb-status-refresh-icon-wrap" aria-hidden="true">
          <RefreshIcon spinning={refreshing} />
        </span>
      </button>
    );
  }

  return (
    <div className={`kb-status-chip${stale ? ' is-stale' : ''}`}>
      <span className="kb-status-dot" aria-hidden="true" />
      {label}
    </div>
  );
}
