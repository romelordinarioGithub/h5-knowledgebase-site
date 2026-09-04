import { useMemo, type Ref, type RefObject } from 'react';

const QUICK_SEARCHES = ['Studio Feed Specs', 'VPAID 2.0 Checklist', 'CM Placements'] as const;

type HeroSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onOpenFaq: () => void;
  inputRef?: Ref<HTMLInputElement>;
};

function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  const platform = navigator.platform || '';
  const ua = navigator.userAgent || '';
  return /Mac|iPhone|iPad|iPod/i.test(platform) || /Mac OS|iPhone|iPad|iPod/i.test(ua);
}

function focusSearchInput(inputRef?: Ref<HTMLInputElement>) {
  if (!inputRef || typeof inputRef === 'function') return;
  (inputRef as RefObject<HTMLInputElement | null>).current?.focus();
}

export function HeroSearch({ value, onChange, onOpenFaq: _onOpenFaq, inputRef }: HeroSearchProps) {
  const hasValue = value.length > 0;
  const shortcutLabel = useMemo(() => (isMacPlatform() ? '⌘ K' : 'Ctrl K'), []);

  function clearSearch() {
    onChange('');
    focusSearchInput(inputRef);
  }

  return (
    <section className="kb-hero-card" aria-label="Knowledge Base search">
      {/* Ambient blobs */}
      <div className="kb-hero-blob-1" aria-hidden="true" />
      <div className="kb-hero-blob-2" aria-hidden="true" />

      <div className="kb-hero-inner">
        <div>
          {/* Label chip */}
          <div className="kb-hero-badge">
            <svg
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
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            H5 TEAM KNOWLEDGE BASE
          </div>

          <h1 className="kb-hero-title">How Can We Help?</h1>

          <p className="kb-hero-desc">
            Find answers quickly across internal documentation, studio specifications, and launch
            workflows.
          </p>

          {/* Search bar */}
          <div className="kb-hero-search-wrap">
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
              className="kb-hero-search-icon"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.currentTarget.value)}
              placeholder="Search for answers... (press / to focus)"
              aria-label="Search knowledge base"
              className={`kb-hero-search-input${hasValue ? ' has-clear' : ''}`}
            />

            <div className="kb-hero-search-actions">
              {hasValue ? (
                <button
                  type="button"
                  className="kb-hero-clear"
                  aria-label="Clear search"
                  onClick={clearSearch}
                >
                  <svg
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
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              ) : null}

              <div className="kb-hero-kbd" title="Focus search" aria-label="Focus search">
                {shortcutLabel === '⌘ K' ? (
                  <>
                    <span>⌘</span>
                    <span>K</span>
                  </>
                ) : (
                  <>
                    <span>Ctrl</span>
                    <span>K</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="kb-hero-quick">
          <span className="kb-hero-quick-label">Quick searches:</span>
          {QUICK_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              className="kb-hero-quick-chip"
              onClick={() => onChange(term)}
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
