import { DialogTitle } from '@headlessui/react';
import { useId, useState, type ReactNode } from 'react';
import { DEFAULT_FAQS, FOCUS_AGENT_EVENT } from '../lib/constants';
import {
  normalizeFaqs,
  segmentFaqBlocks,
  splitListItems,
  type FaqRenderSegment,
} from '../lib/faq';
import { sanitizeFaqHtml } from '../lib/sanitizeHtml';
import type { FaqBlock, FaqItem } from '../types/catalog';
import { Modal } from './ui';

type FaqModalProps = {
  open: boolean;
  onClose: () => void;
  faqs: FaqItem[];
  /** Optional: called when Ask Agent is clicked (defaults to focus agent event). */
  onAskAgent?: () => void;
};

function FaqIcon({ name, className }: { name: string; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  switch (name) {
    case 'help':
      return (
        <svg {...common} width="13" height="13">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'close':
      return (
        <svg {...common} width="18" height="18">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...common} width="18" height="18">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    case 'minus':
      return (
        <svg {...common} width="18" height="18">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    case 'campaign':
      return (
        <svg {...common} width="18" height="18">
          <path d="M3 11v2a1 1 0 0 0 1 1h1l4 3V7L5 10H4a1 1 0 0 0-1 1z" />
          <path d="M14 9.5a4 4 0 0 1 0 5" />
          <path d="M16.5 7a7 7 0 0 1 0 10" />
        </svg>
      );
    case 'warning':
      return (
        <svg {...common} width="18" height="18">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'info':
      return (
        <svg {...common} width="20" height="20">
          <path d="M21 8v13H7a2 2 0 0 1-2-2V3h10l6 5z" />
          <path d="M15 3v5h5" />
          <line x1="10" y1="13" x2="16" y2="13" />
          <line x1="10" y1="17" x2="14" y2="17" />
        </svg>
      );
    case 'support':
      return (
        <svg {...common} width="17" height="17">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'arrow':
      return (
        <svg {...common} width="14" height="14">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      );
    case 'link':
      return (
        <svg {...common} width="16" height="16">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
    default:
      return null;
  }
}

function renderTextLines(text: string): ReactNode {
  const lines = String(text || '').split(/\r?\n/);
  return lines.map((line, index) => (
    <span key={`line-${index}`}>
      {index > 0 ? <br /> : null}
      {line}
    </span>
  ));
}

function renderParagraph(block: FaqBlock, key: string) {
  if (!block.content) return null;
  return (
    <p key={key} className="faq-block-paragraph">
      {renderTextLines(block.content)}
    </p>
  );
}

function renderKeyValueGroup(blocks: FaqBlock[], key: string) {
  return (
    <div key={key} className="faq-kv-panel">
      {blocks.map((block, index) => (
        <div key={`${key}-${index}`} className="faq-kv-row">
          <span className="faq-kv-label">{block.title}</span>
          <span
            className={
              block.variant === 'highlight' ? 'faq-kv-value faq-kv-value--highlight' : 'faq-kv-value'
            }
          >
            {renderTextLines(block.content)}
          </span>
        </div>
      ))}
    </div>
  );
}

function renderCallout(block: FaqBlock, key: string) {
  const variant =
    block.variant === 'warning' || block.variant === 'info' || block.variant === 'neutral'
      ? block.variant
      : 'neutral';
  const icon = variant === 'warning' ? 'warning' : 'info';
  const titleText = block.title
    ? block.title.endsWith(':')
      ? block.title
      : `${block.title}:`
    : '';

  return (
    <div key={key} className={`faq-callout faq-callout--${variant}`} role="note">
      <FaqIcon name={icon} className="faq-callout-icon" />
      <div className="faq-callout-body">
        {variant === 'warning' ? (
          <p className="faq-callout-text">
            {titleText ? <strong className="faq-callout-title">{titleText} </strong> : null}
            {block.content ? renderTextLines(block.content) : null}
          </p>
        ) : (
          <>
            {block.title ? <div className="faq-callout-title">{block.title}</div> : null}
            {block.content ? (
              <p className="faq-callout-text">{renderTextLines(block.content)}</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function renderList(blocks: FaqBlock[], key: string) {
  const items = blocks.flatMap((block) => splitListItems(block.content));
  if (!items.length) return null;
  const ordered = blocks[0]?.variant === 'ordered';
  const ListTag = ordered ? 'ol' : 'ul';

  return (
    <ListTag key={key} className={`faq-list${ordered ? ' faq-list--ordered' : ''}`}>
      {items.map((item, index) => (
        <li key={`${key}-${index}`}>{item}</li>
      ))}
    </ListTag>
  );
}

function renderLink(block: FaqBlock, key: string) {
  const href = String(block.content || '').trim();
  if (!href || !/^https?:\/\//i.test(href)) {
    return (
      <div key={key} className="faq-link-row">
        <FaqIcon name="link" className="faq-link-icon" />
        <span>{block.title || href}</span>
      </div>
    );
  }

  return (
    <a
      key={key}
      className="faq-link-row"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <FaqIcon name="link" className="faq-link-icon" />
      <span>{block.title || href}</span>
    </a>
  );
}

function renderSegment(segment: FaqRenderSegment, key: string): ReactNode {
  if (segment.kind === 'key_value_group') {
    return renderKeyValueGroup(segment.blocks, key);
  }
  if (segment.kind === 'list_group') {
    return renderList(segment.blocks, key);
  }

  const { block } = segment;
  switch (block.type) {
    case 'paragraph':
      return renderParagraph(block, key);
    case 'callout':
      return renderCallout(block, key);
    case 'list':
      return renderList([block], key);
    case 'link':
      return renderLink(block, key);
    case 'key_value':
      return renderKeyValueGroup([block], key);
    default:
      return null;
  }
}

function FaqAccordionItem({
  item,
  index,
  open,
  onToggle,
}: {
  item: FaqItem;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  const buttonId = useId();
  const blocks = item.blocks || [];
  const segments = segmentFaqBlocks(blocks);
  const hasStructuredBody = segments.length > 0;
  const legacyHtml =
    !hasStructuredBody && item.answerHtml ? sanitizeFaqHtml(item.answerHtml) : '';

  return (
    <div className={`faq-accordion-item${open ? ' is-open' : ''}`}>
      <h3 className="faq-accordion-heading">
        <button
          type="button"
          id={buttonId}
          className="faq-accordion-trigger"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className="faq-accordion-trigger-label">
            {open ? <FaqIcon name="campaign" className="faq-accordion-lead-icon" /> : null}
            <span>{item.question}</span>
          </span>
          <span className="faq-accordion-toggle" aria-hidden="true">
            <FaqIcon name={open ? 'minus' : 'plus'} />
          </span>
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className="faq-accordion-panel"
        hidden={!open}
      >
        {open ? (
          <div className="faq-accordion-panel-inner">
            {hasStructuredBody
              ? segments.map((segment, segmentIndex) =>
                  renderSegment(segment, `${item.id || index}-seg-${segmentIndex}`)
                )
              : null}
            {!hasStructuredBody && legacyHtml ? (
              <div
                className="faq-block-paragraph faq-legacy-html"
                dangerouslySetInnerHTML={{ __html: legacyHtml }}
              />
            ) : null}
            {!hasStructuredBody && !legacyHtml && item.answer ? (
              <p className="faq-block-paragraph">{renderTextLines(item.answer)}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function FaqModal({ open, onClose, faqs, onAskAgent }: FaqModalProps) {
  const normalized = normalizeFaqs(faqs.length ? faqs : DEFAULT_FAQS);
  // Accordion reset: parent unmounts this modal when closed, so openId starts fresh.
  const [openId, setOpenId] = useState<string | null>(null);

  function handleAskAgent() {
    onClose();
    if (onAskAgent) {
      onAskAgent();
      return;
    }
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(FOCUS_AGENT_EVENT));
    }, 50);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      panelClassName="faq-modal-panel"
      className="faq-modal-root"
    >
      <div className="faq-modal">
        <header className="faq-modal-header">
          <div className="faq-modal-header-copy">
            <div className="faq-modal-badge">
              <FaqIcon name="help" />
              <span>FAQ</span>
            </div>
            <DialogTitle className="faq-modal-title">Frequently Asked Questions</DialogTitle>
            <p className="faq-modal-desc">
              Everything you need to know to use this internal knowledge base and navigate team
              workflows quickly.
            </p>
          </div>
          <button
            type="button"
            className="faq-modal-close"
            aria-label="Close FAQ"
            onClick={onClose}
          >
            <FaqIcon name="close" />
          </button>
        </header>

        <div className="faq-modal-body">
          {normalized.map((item, index) => {
            const id = item.id || `faq-${index}`;
            const isOpen = openId === id;
            return (
              <FaqAccordionItem
                key={id}
                item={item}
                index={index}
                open={isOpen}
                onToggle={() => setOpenId(isOpen ? null : id)}
              />
            );
          })}
        </div>

        <footer className="faq-modal-footer">
          <div className="faq-modal-footer-help">
            <FaqIcon name="support" className="faq-modal-footer-icon" />
            <span>
              Still have questions? Ask the Knowledge Agent or reach out in{' '}
              <span className="faq-channel-tag">#h5-help</span>
            </span>
          </div>
          <div className="faq-modal-footer-actions">
            <button type="button" className="faq-btn faq-btn--primary" onClick={handleAskAgent}>
              Ask Agent
              <FaqIcon name="arrow" />
            </button>
          </div>
        </footer>
      </div>
    </Modal>
  );
}

