import { SOURCE_SHEETS } from '@h5-kb/shared';
import { cn } from '../lib/cn';
import { getTopicIcon, getTopicSubtitle } from '../lib/topics';

type TopicCardsProps = {
  counts: Record<string, number>;
  selectedSheet: string;
  onSelect: (sheetName: string) => void;
  loading?: boolean;
};

function getCountLabel(sheetName: string, count: number): string {
  const units: Record<string, string> = {
    'Build Guides': 'Articles',
    'Master Templates': 'Templates',
    'Studio Setup': 'Docs',
    'Process Docs': 'Workflows',
    'Internal Tools': 'Utilities',
  };
  const unit = units[sheetName] || 'Items';
  return count > 0 ? `${count} ${unit}` : unit;
}

export function TopicCards({ counts, selectedSheet, onSelect, loading }: TopicCardsProps) {
  return (
    <section aria-label="Browse all topics">
      <div className="kb-section-header">
        <div>
          <h2 className="kb-section-title">Browse All Topics</h2>
          <p className="kb-section-sub">
            Core knowledge modules structured for swift onboarding and day-to-day execution
          </p>
        </div>
        <span className="kb-section-chip">{SOURCE_SHEETS.length} Primary Topics</span>
      </div>

      <div className="kb-topics-grid">
        {loading
          ? Array.from({ length: 5 }, (_, i) => (
              <div
                key={`topic-skel-${i}`}
                className="skeleton"
                style={{ minHeight: '120px', borderRadius: '12px' }}
              />
            ))
          : SOURCE_SHEETS.map((topic) => {
              const count = counts[topic.name] || 0;
              const Icon = getTopicIcon(topic.name);
              const active = selectedSheet === topic.name;

              return (
                <article
                  key={topic.gid}
                  className={cn('kb-topic-card', active && 'is-active')}
                  role="button"
                  tabIndex={0}
                  aria-pressed={active}
                  onClick={() => onSelect(topic.name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(topic.name);
                    }
                  }}
                >
                  <div>
                    <div className="kb-topic-icon-wrap">
                      <Icon style={{ width: '17px', height: '17px' }} />
                    </div>
                    <h3 className="kb-topic-title">{topic.name}</h3>
                    <p className="kb-topic-desc">{getTopicSubtitle(topic.name, count)}</p>
                  </div>

                  <div className="kb-topic-footer">
                    <span className="kb-topic-count">{getCountLabel(topic.name, count)}</span>
                    <svg
                      className="kb-topic-arrow"
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                </article>
              );
            })}
      </div>
    </section>
  );
}
