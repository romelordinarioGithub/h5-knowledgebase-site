import type { ReactNode } from 'react';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Split text into nodes with &lt;mark&gt; around query token matches. */
export function highlightText(text: string, query: string): ReactNode {
  const value = String(text || '');
  const tokens = [
    ...new Set(
      query
        .trim()
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean)
    ),
  ];

  if (!value || !tokens.length) return value;

  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'ig');
  const parts = value.split(pattern);

  return parts.map((part, index) => {
    const matched = tokens.some((token) => token.toLowerCase() === part.toLowerCase());
    if (!matched) return part;
    return (
      <mark key={`hit-${index}`} className="search-hit">
        {part}
      </mark>
    );
  });
}
