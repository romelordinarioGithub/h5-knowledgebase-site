import { lazy, Suspense } from 'react';
import { useCatalogView } from '../hooks/useCatalogView';
import { AppShell } from './AppShell';
import { ArticlesTable } from './ArticlesTable';
import { ErrorBanner } from './ErrorBanner';
import { FeaturedArticles } from './FeaturedArticles';
import { HeroSearch } from './HeroSearch';
import { LoadingShell } from './LoadingShell';
import { TopicCards } from './TopicCards';

const FaqModal = lazy(() =>
  import('./FaqModal').then((module) => ({ default: module.FaqModal }))
);

export function CatalogPage() {
  const view = useCatalogView();

  return (
    <AppShell
      onOpenFaq={() => view.setFaqOpen(true)}
      selectedSheet={view.selectedSheet}
      onRefresh={() => {
        void view.refresh();
      }}
      refreshing={view.isFetching}
      syncStale={view.isShowingStaleData}
      onSelectTopic={(sheetName) => {
        if (!sheetName) {
          view.handleSheetChange('');
          return;
        }
        view.handleTopicClick(sheetName);
      }}
    >
      {view.isShowingStaleData ? (
        <ErrorBanner
          message={`Showing cached data — last updated ${view.staleLabel}. Live refresh failed; try again with Refresh.`}
        />
      ) : null}

      <div className="kb-top-row">
        <HeroSearch
          value={view.searchDraft}
          onChange={view.setSearchDraft}
          onOpenFaq={() => view.setFaqOpen(true)}
          inputRef={view.searchInputRef}
        />
        <FeaturedArticles rows={view.featuredRows} onSelect={view.openDoc} />
      </div>

      {view.initialLoading ? (
        <LoadingShell />
      ) : (
        <>
          <TopicCards
            counts={view.topicCounts}
            selectedSheet={view.selectedSheet}
            onSelect={view.handleTopicClick}
          />

          <ArticlesTable
            key={`${view.search}|${view.selectedSheet}|${view.selectedSort}`}
            rows={view.filteredSortedRows}
            onSelect={view.openDoc}
            tableRef={view.cardsRef}
            selectedSort={view.selectedSort}
            onSortChange={(value) => view.updateParam('sort', value)}
          />
        </>
      )}

      {view.faqOpen ? (
        <Suspense fallback={null}>
          <FaqModal open={view.faqOpen} onClose={() => view.setFaqOpen(false)} faqs={view.faqs} />
        </Suspense>
      ) : null}
    </AppShell>
  );
}
