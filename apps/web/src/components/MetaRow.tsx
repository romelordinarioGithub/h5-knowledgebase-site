import { Button } from './ui';

type MetaRowProps = {
  statusText: string;
  resultCount?: number;
  onRefresh: () => void;
  refreshing: boolean;
};

export function MetaRow({ statusText, resultCount, onRefresh, refreshing }: MetaRowProps) {
  return (
    <section className="mt-4 flex items-center justify-between gap-3">
      <p className="m-0 text-[0.9rem] text-muted" aria-live="polite" aria-atomic="true">
        {statusText}
        {typeof resultCount === 'number' ? (
          <span className="sr-only">
            {resultCount === 1 ? '1 result' : `${resultCount} results`}
          </span>
        ) : null}
      </p>
      <Button type="button" onClick={onRefresh} loading={refreshing}>
        Refresh
      </Button>
    </section>
  );
}
