import { lazy, Suspense } from 'react';
import { useCatalogView } from '../hooks/useCatalogView';
import { ErrorBanner } from './ErrorBanner';
import { FeaturedArticles } from './FeaturedArticles';
import { FilterBar } from './FilterBar';
import { HeroSearch } from './HeroSearch';
import { LoadingShell } from './LoadingShell';
import { MetaRow } from './MetaRow';
import { ResultsGrid } from './ResultsGrid';
import { TopicCards } from './TopicCards';

const FaqModal = lazy(() =>
  import('./FaqModal').then((module) => ({ default: module.FaqModal }))
);

export function CatalogPage() {
  const view = useCatalogView();

  return (
    <>
      {view.isShowingStaleData ? (
        <ErrorBanner
          message={`Showing cached data — last updated ${view.staleLabel}. Live refresh failed; try again with Refresh.`}
        />
      ) : null}

      <HeroSearch
        value={view.searchDraft}
        onChange={view.setSearchDraft}
        onOpenFaq={() => view.setFaqOpen(true)}
        inputRef={view.searchInputRef}
      />

      {view.initialLoading ? (
        <LoadingShell />
      ) : (
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto mt-[46px] mb-16 w-[min(1080px,92vw)] max-[820px]:mt-7 outline-none"
        >
          <TopicCards
            counts={view.topicCounts}
            selectedSheet={view.selectedSheet}
            onSelect={view.handleTopicClick}
          />

          <FeaturedArticles rows={view.featuredRows} onSelect={view.openDoc} />

          <FilterBar
            sheetOptions={view.sheetOptions}
            typeOptions={view.typeOptions}
            linkTypeOptions={view.linkTypeOptions}
            selectedSheet={view.selectedSheet}
            selectedType={view.selectedType}
            selectedLinkType={view.selectedLinkType}
            selectedSort={view.selectedSort}
            onSheetChange={view.handleSheetChange}
            onTypeChange={(value) => view.updateParam('type', value)}
            onLinkTypeChange={(value) => view.updateParam('linkType', value)}
            onSortChange={(value) => view.updateParam('sort', value)}
          />

          <MetaRow
            statusText={view.statusText}
            resultCount={view.filteredSortedRows.length}
            onRefresh={view.refresh}
            refreshing={view.isFetching}
          />

          <ResultsGrid
            rows={view.filteredSortedRows}
            searchQuery={view.search}
            onSelect={view.openDoc}
            gridRef={view.cardsRef}
          />
        </main>
      )}

      {view.faqOpen ? (
        <Suspense fallback={null}>
          <FaqModal open={view.faqOpen} onClose={() => view.setFaqOpen(false)} faqs={view.faqs} />
        </Suspense>
      ) : null}
    </>
  );
}
