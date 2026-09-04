import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { SOURCE_SHEETS } from '@h5-kb/shared';
import { getPayloadTimestamp, resolveCatalogPayload, useCatalog, useRefreshCatalog } from './useCatalog.js';
import { formatRelativeTime, loadCachedCatalog } from '../lib/catalogCache.js';
import { DEFAULT_FAQS } from '../lib/constants';
import { initializeFeaturedRanking, preserveFeaturedRows } from '../lib/featured';
import { normalizeFaqs } from '../lib/faq';
import { linkTypeLabel } from '../lib/linkTypes';
import {
  SEARCH_DEBOUNCE_MS,
  filterAndSearch,
  resolveLinkType,
  sortRows,
  type SortKey,
} from '../lib/search';
import type { CatalogRow, FaqItem } from '../types/catalog';

function isSortKey(value: string | null): value is SortKey {
  return value === 'newest' || value === 'oldest' || value === 'az' || value === 'za';
}

export function useCatalogView() {
  const navigate = useNavigate();
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const cardsRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [cachedFallback] = useState(() => loadCachedCatalog());
  const errorNotifiedRef = useRef(false);
  const refreshCatalog = useRefreshCatalog();
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const refreshInFlightRef = useRef(false);

  const catalogQuery = useCatalog();
  const activePayload = resolveCatalogPayload(catalogQuery.data, cachedFallback);
  const rows = useMemo(
    () => (activePayload?.rows || []) as CatalogRow[],
    [activePayload]
  );
  const faqs: FaqItem[] = useMemo(() => {
    const raw =
      Array.isArray(activePayload?.faqs) && activePayload.faqs.length
        ? activePayload.faqs
        : DEFAULT_FAQS;
    return normalizeFaqs(raw);
  }, [activePayload]);

  const searchFromUrl = searchParams.get('q') || '';
  const selectedSheet = category ? decodeURIComponent(category) : searchParams.get('sheet') || '';
  const selectedType = searchParams.get('type') || '';
  const selectedLinkType = searchParams.get('linkType') || '';
  const selectedSort: SortKey = isSortKey(searchParams.get('sort'))
    ? (searchParams.get('sort') as SortKey)
    : 'newest';

  const [searchDraft, setSearchDraft] = useState(searchFromUrl);
  const [syncedUrlQ, setSyncedUrlQ] = useState(searchFromUrl);
  const [faqOpen, setFaqOpen] = useState(false);
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);

  // Adjust draft when URL `q` changes (back/forward / shared links).
  if (searchFromUrl !== syncedUrlQ) {
    setSyncedUrlQ(searchFromUrl);
    setSearchDraft(searchFromUrl);
  }

  const initialLoading = catalogQuery.isPending && !rows.length;
  const isShowingStaleData = Boolean(catalogQuery.isError && rows.length);
  const payloadTimestamp = getPayloadTimestamp(activePayload);
  const staleLabel = payloadTimestamp ? formatRelativeTime(payloadTimestamp) : 'unknown time';

  const typeOptions = useMemo(() => {
    const source = selectedSheet ? rows.filter((item) => item.sourceSheet === selectedSheet) : rows;
    return [...new Set(source.map((item) => item.title).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [rows, selectedSheet]);

  const sheetOptions = useMemo(() => {
    return [...new Set(rows.map((item) => item.sourceSheet).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [rows]);

  const linkTypeOptions = useMemo(() => {
    const values = [
      ...new Set(rows.map((item) => resolveLinkType(item)).filter(Boolean)),
    ] as string[];
    return values
      .sort((a, b) => linkTypeLabel(a).localeCompare(linkTypeLabel(b)))
      .map((value) => ({ value, label: linkTypeLabel(value) }));
  }, [rows]);

  const filteredSortedRows = useMemo(() => {
    const matched = filterAndSearch(
      rows,
      searchFromUrl,
      selectedSheet,
      selectedType,
      selectedLinkType
    );
    return sortRows(matched, selectedSort);
  }, [rows, searchFromUrl, selectedSheet, selectedType, selectedLinkType, selectedSort]);

  const featuredRows = useMemo(() => {
    if (!featuredIds.length) return [] as CatalogRow[];
    const seeded = featuredIds
      .map((id) => rows.find((row) => row.id === id))
      .filter(Boolean) as CatalogRow[];
    return preserveFeaturedRows(seeded, rows);
  }, [rows, featuredIds]);

  const statusText = useMemo(() => {
    if (initialLoading) return 'Loading data...';
    if (catalogQuery.isFetching && !rows.length) return 'Loading data...';
    if (!rows.length && catalogQuery.isError) {
      return `Error: ${catalogQuery.error?.message || 'Failed to load catalog'}`;
    }
    if (!rows.length) return 'No entries available';
    return `Showing ${filteredSortedRows.length} of ${rows.length} entries`;
  }, [
    initialLoading,
    catalogQuery.isFetching,
    catalogQuery.isError,
    catalogQuery.error,
    rows.length,
    filteredSortedRows.length,
  ]);

  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sheet of SOURCE_SHEETS) {
      counts[sheet.name] = rows.filter((row) => row.sourceSheet === sheet.name).length;
    }
    return counts;
  }, [rows]);

  // Debounce draft → URL `q` param.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchParams(
        (prev) => {
          const current = prev.get('q') || '';
          if (searchDraft === current) return prev;
          const next = new URLSearchParams(prev);
          if (!searchDraft) next.delete('q');
          else next.set('q', searchDraft);
          return next;
        },
        { replace: true }
      );
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [searchDraft, setSearchParams]);

  // Shareable `?sheet=` links → canonical `/browse/:category` path.
  useEffect(() => {
    const sheetParam = searchParams.get('sheet');
    if (!sheetParam || category) return;
    const next = new URLSearchParams(searchParams);
    next.delete('sheet');
    const query = next.toString();
    navigate(`/browse/${encodeURIComponent(sheetParam)}${query ? `?${query}` : ''}`, {
      replace: true,
    });
  }, [searchParams, category, navigate]);

  useEffect(() => {
    if (!rows.length) return;
    if (selectedType && !typeOptions.includes(selectedType)) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('type');
          return next;
        },
        { replace: true }
      );
    }
  }, [rows.length, selectedType, typeOptions, setSearchParams]);

  useEffect(() => {
    if (!rows.length) return;
    const valid = linkTypeOptions.some((option) => option.value === selectedLinkType);
    if (selectedLinkType && !valid) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('linkType');
          return next;
        },
        { replace: true }
      );
    }
  }, [rows.length, selectedLinkType, linkTypeOptions, setSearchParams]);

  useEffect(() => {
    if (!rows.length) return;
    // Seed once, then keep featured stable across catalog refreshes.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional featured ranking sync
    setFeaturedIds((current) => {
      if (current.length) {
        const seeded = current
          .map((id) => rows.find((row) => row.id === id))
          .filter(Boolean) as CatalogRow[];
        return preserveFeaturedRows(seeded, rows).map((row) => row.id);
      }
      return initializeFeaturedRanking(rows).map((row) => row.id);
    });
  }, [rows]);

  useEffect(() => {
    if (!catalogQuery.isError) {
      errorNotifiedRef.current = false;
      return;
    }
    if (errorNotifiedRef.current) return;
    errorNotifiedRef.current = true;
    toast.error(catalogQuery.error?.message || 'Failed to refresh catalog', {
      description: 'Load Error',
    });
  }, [catalogQuery.isError, catalogQuery.error]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isModK =
        (event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey) && !event.altKey;
      const isSlash =
        event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey;

      if (!isModK && !isSlash) return;

      if (isSlash) {
        const target = event.target as HTMLElement | null;
        const tag = target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) {
          return;
        }
      }

      event.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function updateParam(key: string, value: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (!value || (key === 'sort' && value === 'newest')) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true }
    );
  }

  function handleSheetChange(value: string) {
    const next = new URLSearchParams(searchParams);
    next.delete('sheet');
    const query = next.toString();
    if (!value) {
      navigate(query ? `/?${query}` : '/');
      return;
    }
    navigate(`/browse/${encodeURIComponent(value)}${query ? `?${query}` : ''}`);
  }

  function handleTopicClick(topicName: string) {
    handleSheetChange(selectedSheet === topicName ? '' : topicName);

    window.requestAnimationFrame(() => {
      const el = cardsRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const shouldScroll = rect.top < 80 || rect.top > viewportHeight - 120;
      if (!shouldScroll) return;
      window.scrollTo({
        top: Math.max(0, rect.top + window.pageYOffset - 16),
        behavior: 'smooth',
      });
    });
  }

  function openDoc(row: CatalogRow) {
    navigate(`/doc/${encodeURIComponent(row.id)}`);
  }

  async function refresh() {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    setManualRefreshing(true);
    try {
      await refreshCatalog();
      toast.success('Catalog refreshed from spreadsheet');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to refresh catalog', {
        description: 'Load Error',
      });
    } finally {
      refreshInFlightRef.current = false;
      setManualRefreshing(false);
    }
  }

  return {
    cardsRef,
    searchInputRef,
    faqs,
    featuredRows,
    filteredSortedRows,
    faqOpen,
    setFaqOpen,
    initialLoading,
    isShowingStaleData,
    staleLabel,
    searchDraft,
    setSearchDraft,
    search: searchFromUrl,
    selectedSheet,
    selectedType,
    selectedLinkType,
    selectedSort,
    sheetOptions,
    typeOptions,
    linkTypeOptions,
    statusText,
    topicCounts,
    isFetching: catalogQuery.isFetching || manualRefreshing,
    updateParam,
    handleSheetChange,
    handleTopicClick,
    openDoc,
    refresh,
  };
}
