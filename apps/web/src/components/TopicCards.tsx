import { SOURCE_SHEETS } from '@h5-kb/shared';
import { cn } from '../lib/cn';
import { getTopicIcon, getTopicSubtitle } from '../lib/topics';

type TopicCardsProps = {
  counts: Record<string, number>;
  selectedSheet: string;
  onSelect: (sheetName: string) => void;
  loading?: boolean;
};

export function TopicCards({ counts, selectedSheet, onSelect, loading }: TopicCardsProps) {
  return (
    <section className="mt-1.5">
      <h2 className="m-0 text-center text-[2rem] text-primary">Browse All Topics</h2>
      <div className="mt-[26px] grid grid-cols-5 gap-[18px] py-1 pb-2 max-[820px]:flex max-[820px]:flex-nowrap max-[820px]:gap-3.5 max-[820px]:overflow-x-auto max-[820px]:pb-2 max-[820px]:[scrollbar-width:thin]">
        {loading
          ? Array.from({ length: 5 }, (_, index) => (
              <div
                key={`topic-skel-${index}`}
                className="skeleton min-h-[210px] min-w-[250px] rounded-md max-[820px]:shrink-0"
              />
            ))
          : SOURCE_SHEETS.map((topic) => {
              const count = counts[topic.name] || 0;
              const Icon = getTopicIcon(topic.name);
              const active = selectedSheet === topic.name;

              return (
                <article
                  key={topic.gid}
                  className={cn('topic-card max-[820px]:min-w-[250px] max-[820px]:shrink-0', active && 'is-active')}
                  role="button"
                  tabIndex={0}
                  aria-pressed={active}
                  onClick={() => onSelect(topic.name)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelect(topic.name);
                    }
                  }}
                >
                  <div className="mx-auto mb-3.5 grid size-[34px] place-items-center text-[#111]">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="topic-title m-0 text-[0.92rem] leading-[1.25] font-bold text-[#111]">
                    {topic.name}
                  </h3>
                  <p className="mt-2.5 mb-0 text-[0.74rem] leading-[1.35] text-[#5c5c66]">
                    {getTopicSubtitle(topic.name, count)}
                  </p>
                </article>
              );
            })}
      </div>
    </section>
  );
}
