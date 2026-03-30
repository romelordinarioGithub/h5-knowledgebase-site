import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal, Select, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';

const APPS_SCRIPT_WEBAPP_URL =
  'https://script.google.com/a/macros/smartly.io/s/AKfycbxTZ-z2N_lCuzSTsL9gGr2VnZWJ4AJf3PC9lzKQn0OQrYjbEf3UN5HzUWRYhevUZDhl/exec';
const AUTO_SYNC_MS = 60000;

const SOURCE_SHEETS = [
  { name: 'Build Guides', gid: '1198250871' },
  { name: 'Master Templates', gid: '560139915' },
  { name: 'Studio Setup', gid: '667355349' },
  { name: 'Process Docs', gid: '174313596' },
  { name: 'Internal Tools', gid: '1350118893' },
];

const DEFAULT_FAQS = [
  {
    question: 'How do I search effectively?',
    answer: 'Use keywords from titles, author names, update dates, or terms inside tags.',
  },
  {
    question: 'How do filters work?',
    answer: 'Use Source Sheet and Doc Type filters together to narrow down results fast.',
  },
  {
    question: 'Where do featured articles come from?',
    answer: 'Featured cards are selected from available entries and refreshed when data reloads.',
  },
  {
    question: 'How do I open full document details?',
    answer: 'Click any card to open its detail modal, then choose the document link.',
  },
  {
    question: 'Why can’t I see data sometimes?',
    answer: 'If data fails to load, verify sharing/access settings and refresh once.',
  },
];

function fetchNormalizedRowsJSONP() {
  if (!APPS_SCRIPT_WEBAPP_URL) {
    return Promise.reject(new Error('Apps Script URL is not configured'));
  }

  return new Promise((resolve, reject) => {
    const callbackName = `kbJsonp_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement('script');
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Apps Script JSONP request timed out'));
    }, 30000);

    function cleanup() {
      clearTimeout(timeoutId);
      if (script.parentNode) script.parentNode.removeChild(script);
      delete window[callbackName];
    }

    window[callbackName] = (payload) => {
      cleanup();
      if (!payload || !Array.isArray(payload.rows)) {
        reject(new Error('Invalid payload from Apps Script endpoint'));
        return;
      }
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Failed to load Apps Script endpoint'));
    };

    const joiner = APPS_SCRIPT_WEBAPP_URL.includes('?') ? '&' : '?';
    script.src = `${APPS_SCRIPT_WEBAPP_URL}${joiner}callback=${callbackName}&ts=${Date.now()}`;
    document.head.appendChild(script);
  });
}

function initializeFeaturedRanking(data) {
  const randomized = [...data];
  for (let i = randomized.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [randomized[i], randomized[j]] = [randomized[j], randomized[i]];
  }
  return randomized.slice(0, 5);
}

function preserveFeaturedRows(currentFeaturedRows, nextRows) {
  const rowById = new Map(nextRows.map((row) => [row.id, row]));
  const kept = currentFeaturedRows.map((row) => rowById.get(row.id)).filter(Boolean);
  const used = new Set(kept.map((row) => row.id));

  for (const row of nextRows) {
    if (!used.has(row.id)) {
      kept.push(row);
      used.add(row.id);
    }
    if (kept.length >= 5) break;
  }

  return kept.slice(0, 5);
}

function getTopicIconSvg(sheetName) {
  const icons = {
    'Build Guides': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="5" y1="6" x2="19" y2="6"/><circle cx="9" cy="6" r="2"/><line x1="5" y1="12" x2="19" y2="12"/><circle cx="15" cy="12" r="2"/><line x1="5" y1="18" x2="19" y2="18"/><circle cx="11" cy="18" r="2"/></svg>`,
    'Master Templates': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2"/><line x1="4" y1="10" x2="20" y2="10"/></svg>`,
    'Studio Setup': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .32 1.76l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.6 1.6 0 0 0 15 19.4a1.6 1.6 0 0 0-1 .86 1.6 1.6 0 0 0-.15.66V21a2 2 0 1 1-4 0v-.09a1.6 1.6 0 0 0-1.15-1.52 1.6 1.6 0 0 0-1.76.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.6 1.6 0 0 0 4.6 15a1.6 1.6 0 0 0-.86-1 1.6 1.6 0 0 0-.66-.15H3a2 2 0 1 1 0-4h.09a1.6 1.6 0 0 0 1.52-1.15 1.6 1.6 0 0 0-.32-1.76l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.6 1.6 0 0 0 9 4.6a1.6 1.6 0 0 0 1-.86 1.6 1.6 0 0 0 .15-.66V3a2 2 0 1 1 4 0v.09a1.6 1.6 0 0 0 1.15 1.52 1.6 1.6 0 0 0 1.76-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.6 1.6 0 0 0 19.4 9c.2.31.31.67.32 1.03V10a1.6 1.6 0 0 0 1.15 1.52c.21.07.43.1.65.11H21a2 2 0 1 1 0 4h-.09A1.6 1.6 0 0 0 19.4 15z"/></svg>`,
    'Process Docs': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><polyline points="14 3 14 8 19 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>`,
    'Internal Tools': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="8" cy="7" r="3"/></svg>`,
  };

  return icons[sheetName] || icons['Build Guides'];
}

function getTopicSubtitle(sheetName, count) {
  const copy = {
    'Build Guides': 'Follow easy steps to build and launch with confidence',
    'Master Templates': 'Pre-built templates to help you create with ease',
    'Studio Setup': 'Setup references for launching studio workflows',
    'Process Docs': 'Process documentation for repeatable execution',
    'Internal Tools': 'Access essential tools to streamline your workflow',
  };

  return copy[sheetName] || `${count} articles available`;
}

function rowMatches(row, search, selectedSheet, type) {
  if (selectedSheet && row.sourceSheet !== selectedSheet) return false;
  if (type && row.title !== type) return false;
  if (!search) return true;

  const haystack = [row.title, row.authors, row.lastUpdate, (row.tags || []).join(' ')]
    .join(' ')
    .toLowerCase();

  return haystack.includes(search);
}

function sortRows(data, sortKey) {
  const sorted = [...data];

  if (sortKey === 'oldest') {
    sorted.sort((a, b) => a.lastUpdateStamp - b.lastUpdateStamp);
    return sorted;
  }

  if (sortKey === 'az') {
    sorted.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
    return sorted;
  }

  if (sortKey === 'za') {
    sorted.sort((a, b) => String(b.title || '').localeCompare(String(a.title || '')));
    return sorted;
  }

  sorted.sort((a, b) => b.lastUpdateStamp - a.lastUpdateStamp);
  return sorted;
}

function App() {
  const cardsRef = useRef(null);

  const [rows, setRows] = useState([]);
  const [featuredRows, setFeaturedRows] = useState([]);
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);

  const [search, setSearch] = useState('');
  const [selectedSheet, setSelectedSheet] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [statusText, setStatusText] = useState('Loading data...');

  const [detailRow, setDetailRow] = useState(null);
  const [faqOpen, setFaqOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

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

  const filteredSortedRows = useMemo(() => {
    const filtered = rows.filter((row) =>
      rowMatches(row, search.trim().toLowerCase(), selectedSheet, selectedType)
    );
    return sortRows(filtered, selectedSort);
  }, [rows, search, selectedSheet, selectedType, selectedSort]);

  useEffect(() => {
    if (selectedType && !typeOptions.includes(selectedType)) {
      setSelectedType('');
    }
  }, [selectedType, typeOptions]);

  useEffect(() => {
    if (!rows.length) return;
    setStatusText(`Showing ${filteredSortedRows.length} of ${rows.length} entries`);
  }, [filteredSortedRows.length, rows.length]);

  async function loadData(options = {}) {
    const { quiet = false, preserveFeatured = false } = options;

    if (!quiet) {
      setStatusText('Loading data...');
    }

    try {
      const payload = await fetchNormalizedRowsJSONP();
      const nextRows = payload.rows || [];
      const nextFaqs = Array.isArray(payload.faqs) && payload.faqs.length ? payload.faqs : DEFAULT_FAQS;

      if (!nextRows.length) {
        throw new Error('No rows detected from sheet CSV');
      }

      setRows(nextRows);
      setFaqs(nextFaqs);
      setFeaturedRows((current) => {
        if (preserveFeatured && current.length) {
          return preserveFeaturedRows(current, nextRows);
        }
        return initializeFeaturedRanking(nextRows);
      });
    } catch (error) {
      if (!quiet) {
        setStatusText(`Error: ${error.message}`);
        notifications.show({
          color: 'red',
          title: 'Load Error',
          message: error.message,
        });
      }
    } finally {
      if (initialLoading) {
        setInitialLoading(false);
      }
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.hidden) return;
      loadData({ quiet: true, preserveFeatured: true });
    }, AUTO_SYNC_MS);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoading]);

  function handleTopicClick(topicName) {
    setSelectedSheet(topicName);

    window.requestAnimationFrame(() => {
      const el = cardsRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const topThreshold = 80;
      const bottomThreshold = viewportHeight - 120;
      const shouldScroll = rect.top < topThreshold || rect.top > bottomThreshold;

      if (!shouldScroll) return;

      const targetTop = Math.max(0, rect.top + window.pageYOffset - 16);
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  }

  const bySheet = SOURCE_SHEETS.map((sheet) => {
    const count = rows.filter((row) => row.sourceSheet === sheet.name).length;
    return { ...sheet, count };
  });

  return (
    <>
      <div className={`startup-loader ${initialLoading ? '' : 'is-hidden'}`} aria-hidden={!initialLoading}>
        <div className="startup-loader__panel">
          <div className="loader" />
        </div>
      </div>

      <header className="hero">
        <div className="hero-overlay" />
        <button className="faq-trigger" type="button" onClick={() => setFaqOpen(true)}>
          FAQ
        </button>
        <div className="hero-content">
          <p className="eyebrow">H5 Team Knowledge Base</p>
          <h1>How Can We Help?</h1>
          <p className="subtitle">Find answers quickly across all internal documentation</p>
          <TextInput
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Search for answers..."
            className="search-input"
            radius="xl"
            size="lg"
          />
        </div>
      </header>

      <main className="layout">
        <section className="topics">
          <h2>Browse All Topics</h2>
          <div className="topic-cards">
            {bySheet.map((topic) => (
              <article
                key={topic.gid}
                className="topic-card"
                role="button"
                tabIndex={0}
                onClick={() => handleTopicClick(topic.name)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleTopicClick(topic.name);
                  }
                }}
              >
                <div
                  className="topic-icon"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: getTopicIconSvg(topic.name) }}
                />
                <h3 className="topic-title">{topic.name}</h3>
                <p className="topic-subtitle">{getTopicSubtitle(topic.name, topic.count)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="featured">
          <h2>Featured Articles</h2>
          <div className="featured-list">
            {featuredRows.length ? (
              featuredRows.map((row) => (
                <article key={`featured-${row.id}`} className="featured-item" onClick={() => setDetailRow(row)}>
                  <span>{row.title || 'Untitled'}</span>
                  <i>&rarr;</i>
                </article>
              ))
            ) : (
              <p className="featured-empty">No featured articles for the current filters.</p>
            )}
          </div>
        </section>

        <section className="controls" aria-label="Search and filters">
          <label className="control">
            <span>Source Sheet</span>
            <Select
              value={selectedSheet || null}
              onChange={(value) => setSelectedSheet(value || '')}
              data={sheetOptions}
              placeholder="All"
              clearable
              comboboxProps={{ withinPortal: false }}
            />
          </label>

          <label className="control">
            <span>Doc Type</span>
            <Select
              value={selectedType || null}
              onChange={(value) => setSelectedType(value || '')}
              data={typeOptions}
              placeholder="All"
              clearable
              comboboxProps={{ withinPortal: false }}
            />
          </label>

          <label className="control">
            <span>Sort By</span>
            <Select
              value={selectedSort}
              onChange={(value) => setSelectedSort(value || 'newest')}
              data={[
                { value: 'newest', label: 'Newest update' },
                { value: 'oldest', label: 'Oldest update' },
                { value: 'az', label: 'Title A-Z' },
                { value: 'za', label: 'Title Z-A' },
              ]}
              comboboxProps={{ withinPortal: false }}
            />
          </label>
        </section>

        <section className="meta-row">
          <p id="statusText">{statusText}</p>
          <Button id="refreshBtn" type="button" onClick={() => loadData()}>
            Refresh
          </Button>
        </section>

        <section id="cards" ref={cardsRef} className="cards" aria-live="polite">
          {!filteredSortedRows.length ? (
            <div className="empty">No matching results. Try adjusting your search or filters.</div>
          ) : (
            filteredSortedRows.map((row) => (
              <article
                key={row.id}
                className="card"
                role="button"
                tabIndex={0}
                onClick={() => setDetailRow(row)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setDetailRow(row);
                  }
                }}
              >
                <div className="card-header">
                  <h2 className="card-title">{row.title || 'Untitled'}</h2>
                  <span className="date-pill">{row.lastUpdate || 'No date'}</span>
                </div>

                <p className="source-badge">{row.sourceSheet || 'Unknown source'}</p>

                <a
                  className={`doc-link ${row.url ? '' : 'is-disabled'}`}
                  href={row.url || '#'}
                  target={row.url ? '_blank' : undefined}
                  rel={row.url ? 'noopener noreferrer' : undefined}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!row.url) event.preventDefault();
                  }}
                >
                  {row.url ? 'Read More' : 'No URL'}
                </a>

                <p className="authors">{row.authors || 'Unknown author'}</p>
              </article>
            ))
          )}
        </section>
      </main>

      <Modal
        opened={!!detailRow}
        onClose={() => setDetailRow(null)}
        centered
        withCloseButton={false}
        classNames={{ content: 'detail-modal', body: 'modal-body' }}
      >
        <button
          className="modal-close"
          type="button"
          aria-label="Close details"
          onClick={() => setDetailRow(null)}
        />
        <p className="modal-type">Source: {detailRow?.sourceSheet || 'Unknown'}</p>
        <h2 className="modal-title">{detailRow?.title || 'Untitled'}</h2>
        <p className="modal-authors">Authors: {detailRow?.authors || 'Unknown'}</p>
        <p className="modal-date">Last Update: {detailRow?.lastUpdate || 'Not set'}</p>
        <div className="tag-list">
          {(detailRow?.tags || []).map((tag, index) => (
            <span key={`modal-tag-${tag}-${index}`} className="tag">{tag}</span>
          ))}
        </div>
        <a
          className={`doc-link ${detailRow?.url ? '' : 'is-disabled'}`}
          href={detailRow?.url || '#'}
          target={detailRow?.url ? '_blank' : undefined}
          rel={detailRow?.url ? 'noopener noreferrer' : undefined}
          onClick={(event) => {
            if (!detailRow?.url) event.preventDefault();
          }}
        >
          {detailRow?.url ? 'Open Document' : 'No document URL'}
        </a>
      </Modal>

      <Modal
        opened={faqOpen}
        onClose={() => setFaqOpen(false)}
        centered
        size="min(1100px, 94vw)"
        withCloseButton={false}
        classNames={{ content: 'faq-modal', body: 'faq-modal-body' }}
      >
        <button className="modal-close" type="button" aria-label="Close FAQ" onClick={() => setFaqOpen(false)} />
        <p className="faq-chip">FAQ</p>
        <h2 className="faq-heading">Frequently Asked Questions</h2>
        <p className="faq-subtitle">Everything you need to know to use this internal knowledge base quickly.</p>

        <div className="faq-list">
          {(faqs.length ? faqs : DEFAULT_FAQS).map((item, index) => (
            <details key={`faq-${index}`} className="faq-item">
              <summary>{item.question}</summary>
              {item.answerHtml ? (
                <p dangerouslySetInnerHTML={{ __html: item.answerHtml }} />
              ) : (
                <p>{item.answer}</p>
              )}
            </details>
          ))}
        </div>
      </Modal>
    </>
  );
}

export default App;
