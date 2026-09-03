import { useNavigate, useParams } from 'react-router-dom';
import { resolveCatalogPayload, useCatalog } from '../hooks/useCatalog.js';
import { loadCachedCatalog } from '../lib/catalogCache.js';
import { resolveEmbedPlan } from '../lib/embed';
import { linkTypeLabel } from '../lib/linkTypes';
import type { CatalogRow } from '../types/catalog';
import { DocumentDetail } from '../components/DocumentDetail';
import { DocumentViewer } from '../components/DocumentViewer';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Button } from '../components/ui';

/** Full document page: metadata sidebar + capability-aware preview panel. */
export function DocPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const catalogQuery = useCatalog();
  const cached = loadCachedCatalog();
  const payload = resolveCatalogPayload(catalogQuery.data, cached);
  const rows = (payload?.rows || []) as CatalogRow[];
  const row = rows.find((item) => item.id === decodeURIComponent(id || '')) || null;
  const loading = catalogQuery.isPending && !rows.length;

  function handleClose() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg px-4 py-8">
        <div className="mx-auto grid w-[min(1180px,94vw)] gap-6 lg:grid-cols-[minmax(240px,320px)_1fr]">
          <div className="skeleton h-72 rounded-[18px]" />
          <div className="skeleton min-h-[420px] rounded-[18px]" />
        </div>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg px-4">
        <div className="w-[min(480px,92vw)] rounded-card border border-dashed border-line bg-surface p-8 text-center shadow-card">
          <p className="m-0 mb-4 text-muted">Document not found.</p>
          <Button onClick={() => navigate('/')}>Return home</Button>
        </div>
      </div>
    );
  }

  const plan = resolveEmbedPlan(row);

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-[min(1180px,94vw)] flex-wrap items-center justify-between gap-3 px-1 py-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            ← Back
          </Button>
          <p className="m-0 text-[0.84rem] text-muted">
            {linkTypeLabel(plan.linkType)}
            {plan.canPreview ? ' · preview attempt' : ' · open original'}
          </p>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto grid w-[min(1180px,94vw)] gap-6 px-1 py-6 outline-none max-lg:grid-cols-1 lg:grid-cols-[minmax(240px,320px)_1fr] lg:items-start"
      >
        <aside className="rounded-[18px] border border-line bg-surface p-5 shadow-card">
          <div className="flex flex-col gap-2.5">
            <DocumentDetail row={row} />
          </div>
        </aside>

        <section aria-label="Document preview" className="min-w-0">
          <ErrorBoundary label="Document preview">
            <DocumentViewer key={row.id} row={row} />
          </ErrorBoundary>
        </section>
      </main>
    </div>
  );
}
