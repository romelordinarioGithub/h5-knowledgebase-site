import { lazy, Suspense, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { DocumentDetail } from '../components/DocumentDetail';
import { DocumentViewer } from '../components/DocumentViewer';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { RelatedArticles } from '../components/RelatedArticles';
import { SystemStatusChip } from '../components/SystemStatusChip';
import { Button } from '../components/ui';
import { resolveCatalogPayload, useCatalog } from '../hooks/useCatalog.js';
import { loadCachedCatalog } from '../lib/catalogCache.js';
import { DEFAULT_FAQS } from '../lib/constants';
import { normalizeFaqs } from '../lib/faq';
import type { CatalogRow, FaqItem } from '../types/catalog';

function useCachedCatalogOnce() {
  const [cached] = useState(() => loadCachedCatalog());
  return cached;
}

const FaqModal = lazy(() =>
  import('../components/FaqModal').then((module) => ({ default: module.FaqModal }))
);

function ArticleTopbar({
  row,
  onBack,
  onSearchSubmit,
  stale = false,
}: {
  row: CatalogRow;
  onBack: () => void;
  onSearchSubmit: (query: string) => void;
  stale?: boolean;
}) {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState('');

  function submitSearch(event?: FormEvent) {
    event?.preventDefault();
    const q = draft.trim();
    if (!q) return;
    onSearchSubmit(q);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      submitSearch();
    }
  }

  return (
    <header className="kb-article-topbar">
      <div className="kb-article-topbar-left">
        <button type="button" className="kb-article-back" onClick={onBack}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span className="kb-article-back-label">Back to Knowledge Base</span>
        </button>

        <div className="kb-article-topbar-divider" aria-hidden="true" />

        <nav className="kb-article-breadcrumb" aria-label="Breadcrumb">
          <Link to="/" className="kb-article-crumb">
            H5 Team
          </Link>
          <span className="kb-article-crumb-sep" aria-hidden="true">
            /
          </span>
          <Link to="/" className="kb-article-crumb">
            Knowledge Base
          </Link>
          {row.sourceSheet ? (
            <>
              <span className="kb-article-crumb-sep" aria-hidden="true">
                /
              </span>
              <Link
                to={`/browse/${encodeURIComponent(row.sourceSheet)}`}
                className="kb-article-crumb"
              >
                {row.sourceSheet}
              </Link>
            </>
          ) : null}
          <span className="kb-article-crumb-sep" aria-hidden="true">
            /
          </span>
          <span className="kb-article-crumb-current" title={row.title || 'Untitled'}>
            {row.title || 'Untitled'}
          </span>
        </nav>
      </div>

      <div className="kb-article-topbar-right">
        <SystemStatusChip stale={stale} />

        <form className="kb-article-search" onSubmit={submitSearch} role="search">
          <svg
            className="kb-article-search-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchRef}
            type="search"
            className="kb-article-search-input"
            placeholder="Search doc..."
            aria-label="Search documentation"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <kbd className="kb-article-search-kbd">⌘K</kbd>
        </form>
      </div>
    </header>
  );
}

/** Full document page: shared shell + metadata panel + capability-aware preview. */
export function DocPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const catalogQuery = useCatalog();
  const cached = useCachedCatalogOnce();
  const payload = resolveCatalogPayload(catalogQuery.data, cached);
  const rows = (payload?.rows || []) as CatalogRow[];
  const row = rows.find((item) => item.id === decodeURIComponent(id || '')) || null;
  const loading = catalogQuery.isPending && !rows.length;
  const isShowingStaleData = Boolean(catalogQuery.isError && rows.length);
  const [faqOpen, setFaqOpen] = useState(false);
  const faqs: FaqItem[] = normalizeFaqs(
    Array.isArray(payload?.faqs) && payload.faqs.length ? payload.faqs : DEFAULT_FAQS
  );

  function handleClose() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  }

  function handleSelectTopic(sheetName: string) {
    if (!sheetName) {
      navigate('/');
      return;
    }
    navigate(`/browse/${encodeURIComponent(sheetName)}`);
  }

  function openDoc(next: CatalogRow) {
    navigate(`/doc/${encodeURIComponent(next.id)}`);
  }

  if (loading) {
    return (
      <AppShell hideAgent selectedSheet="">
        <div className="kb-doc-loading">
          <div className="skeleton h-72 rounded-[12px]" />
          <div className="skeleton min-h-[440px] rounded-[12px]" />
        </div>
      </AppShell>
    );
  }

  if (!row) {
    return (
      <AppShell hideAgent selectedSheet="" onSelectTopic={handleSelectTopic}>
        <div className="kb-doc-not-found">
          <p className="m-0 mb-4 text-muted">Document not found.</p>
          <Button onClick={() => navigate('/')}>Return home</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      hideAgent
      selectedSheet={row.sourceSheet || ''}
      onSelectTopic={handleSelectTopic}
      onOpenFaq={() => setFaqOpen(true)}
      topbar={
        <ArticleTopbar
          row={row}
          onBack={handleClose}
          onSearchSubmit={(q) => navigate(`/?q=${encodeURIComponent(q)}`)}
          stale={isShowingStaleData}
        />
      }
    >
      <div className="kb-doc-layout">
        <div className="kb-doc-grid">
          <aside className="kb-doc-panel" aria-label="Article details">
            <DocumentDetail key={row.id} row={row} showOpenAction={false} />
          </aside>

          <div className="kb-doc-main">
            <section aria-label="Document preview" className="kb-doc-preview">
              <ErrorBoundary label="Document preview">
                <DocumentViewer key={row.id} row={row} />
              </ErrorBoundary>
            </section>

            <RelatedArticles current={row} rows={rows} onSelect={openDoc} />
          </div>
        </div>
      </div>

      {faqOpen ? (
        <Suspense fallback={null}>
          <FaqModal open={faqOpen} onClose={() => setFaqOpen(false)} faqs={faqs} />
        </Suspense>
      ) : null}
    </AppShell>
  );
}
