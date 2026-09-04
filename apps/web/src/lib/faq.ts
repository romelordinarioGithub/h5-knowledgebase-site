import type { FaqBlock, FaqBlockType, FaqItem } from '../types/catalog';

const BLOCK_TYPES = new Set<FaqBlockType>([
  'heading',
  'paragraph',
  'key_value',
  'callout',
  'list',
  'link',
]);

function normalizeBlockType(raw: string): FaqBlockType | null {
  const value = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  return BLOCK_TYPES.has(value as FaqBlockType) ? (value as FaqBlockType) : null;
}

function normalizeVariant(raw: string | undefined): string {
  return String(raw || '')
    .trim()
    .toLowerCase();
}

function toPlainAnswer(blocks: FaqBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'key_value') {
        return [block.title, block.content].filter(Boolean).join(': ');
      }
      if (block.type === 'callout' || block.type === 'heading' || block.type === 'link') {
        return [block.title, block.content].filter(Boolean).join(' — ');
      }
      if (block.type === 'list') {
        return splitListItems(block.content)
          .map((item, index) =>
            block.variant === 'ordered' ? `${index + 1}. ${item}` : `• ${item}`
          )
          .join('\n');
      }
      return block.content || block.title || '';
    })
    .filter(Boolean)
    .join('\n\n');
}

/** Split list cell content on newlines into individual items. */
export function splitListItems(content: string | undefined): string[] {
  return String(content || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);
}

/**
 * Normalize a single FAQ from the catalog payload.
 * Supports structured `blocks` and legacy `{ question, answer, answerHtml }`.
 */
export function normalizeFaqItem(raw: FaqItem | null | undefined, index = 0): FaqItem | null {
  if (!raw || typeof raw !== 'object') return null;

  const question = String(raw.question || '').trim();
  if (!question) return null;

  const id = String(raw.id || `faq-${index + 1}`).trim() || `faq-${index + 1}`;
  const blocks = Array.isArray(raw.blocks)
    ? raw.blocks
        .map((block, blockIndex) => normalizeFaqBlock(block, blockIndex))
        .filter((block): block is FaqBlock => Boolean(block))
        .sort((a, b) => a.order - b.order)
    : [];

  if (blocks.length) {
    return {
      id,
      question,
      blocks,
      answer: String(raw.answer || '').trim() || toPlainAnswer(blocks),
      answerHtml: raw.answerHtml,
    };
  }

  const answer = String(raw.answer || '').trim();
  const answerHtml = raw.answerHtml ? String(raw.answerHtml) : undefined;
  if (!answer && !answerHtml) return null;

  // Prefer sanitized answerHtml when present (legacy rich-text links).
  if (answerHtml && answerHtml.trim()) {
    return {
      id,
      question,
      answer: answer || stripTags(answerHtml),
      answerHtml,
      blocks: [],
    };
  }

  const legacyBlocks: FaqBlock[] = [
    {
      order: 1,
      type: 'paragraph',
      title: '',
      content: answer,
      variant: '',
    },
  ];

  return {
    id,
    question,
    blocks: legacyBlocks,
    answer,
  };
}

function normalizeFaqBlock(raw: unknown, index: number): FaqBlock | null {
  if (!raw || typeof raw !== 'object') return null;
  const block = raw as Partial<FaqBlock> & { blockType?: string; blockOrder?: number };
  const type = normalizeBlockType(String(block.type || block.blockType || ''));
  if (!type) return null;

  const orderRaw = block.order ?? block.blockOrder ?? index + 1;
  const order = Number(orderRaw);
  return {
    order: Number.isFinite(order) ? order : index + 1,
    type,
    title: String(block.title || '').trim(),
    content: String(block.content || '').trim(),
    variant: normalizeVariant(block.variant),
  };
}

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/** Normalize FAQ list from catalog payload (structured or legacy). */
export function normalizeFaqs(faqs: FaqItem[] | null | undefined): FaqItem[] {
  if (!Array.isArray(faqs)) return [];
  return faqs
    .map((item, index) => normalizeFaqItem(item, index))
    .filter((item): item is FaqItem => Boolean(item));
}

/**
 * Group consecutive key_value / list blocks for presentation.
 * Spreadsheet may store one key/value or list item per row; UI merges them.
 */
export type FaqRenderSegment =
  | { kind: 'block'; block: FaqBlock }
  | { kind: 'key_value_group'; blocks: FaqBlock[] }
  | { kind: 'list_group'; blocks: FaqBlock[] };

function listStyle(block: FaqBlock): 'ordered' | 'bullet' {
  return block.variant === 'ordered' ? 'ordered' : 'bullet';
}

export function segmentFaqBlocks(blocks: FaqBlock[]): FaqRenderSegment[] {
  const body = blocks.filter((block) => block.type !== 'heading');
  const segments: FaqRenderSegment[] = [];
  let index = 0;

  while (index < body.length) {
    const current = body[index];
    if (current.type === 'key_value') {
      const group: FaqBlock[] = [];
      while (index < body.length && body[index].type === 'key_value') {
        group.push(body[index]);
        index += 1;
      }
      segments.push({ kind: 'key_value_group', blocks: group });
      continue;
    }
    if (current.type === 'list') {
      const style = listStyle(current);
      const group: FaqBlock[] = [];
      while (
        index < body.length &&
        body[index].type === 'list' &&
        listStyle(body[index]) === style
      ) {
        group.push(body[index]);
        index += 1;
      }
      segments.push({ kind: 'list_group', blocks: group });
      continue;
    }
    segments.push({ kind: 'block', block: current });
    index += 1;
  }

  return segments;
}

/**
 * Client-side grouping for flat structured FAQ rows (tests / alternate feeds).
 * Sort by FAQ ID then Block Order.
 */
export type FaqSheetRow = {
  faqId?: string;
  question?: string;
  blockOrder?: number | string;
  blockType?: string;
  title?: string;
  content?: string;
  variant?: string;
};

export function groupFaqSheetRows(rows: FaqSheetRow[]): FaqItem[] {
  const byId = new Map<string, { question: string; blocks: FaqBlock[] }>();

  for (const row of rows) {
    const faqId = String(row.faqId || '').trim();
    const question = String(row.question || '').trim();
    const type = normalizeBlockType(String(row.blockType || ''));
    if (!faqId || !question || !type) continue;

    const order = Number(row.blockOrder);
    const block: FaqBlock = {
      order: Number.isFinite(order) ? order : byId.get(faqId)?.blocks.length || 1,
      type,
      title: String(row.title || '').trim(),
      content: String(row.content || '').trim(),
      variant: normalizeVariant(row.variant),
    };

    const existing = byId.get(faqId);
    if (existing) {
      existing.blocks.push(block);
      if (!existing.question) existing.question = question;
    } else {
      byId.set(faqId, { question, blocks: [block] });
    }
  }

  return [...byId.entries()]
    .map(([id, value], index) =>
      normalizeFaqItem(
        {
          id,
          question: value.question,
          answer: '',
          blocks: value.blocks.sort((a, b) => a.order - b.order),
        },
        index
      )
    )
    .filter((item): item is FaqItem => Boolean(item));
}
