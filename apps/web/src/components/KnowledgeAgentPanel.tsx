/**
 * KnowledgeAgentPanel – KB retrieval + optional Gemini synthesis.
 *
 * Flow: search catalog → cards from app data → Gemini only when needed.
 */

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../hooks/useCatalog.js';
import { FOCUS_AGENT_EVENT } from '../lib/constants';
import {
  planAgentAnswer,
  toGeminiArticleContext,
  type AgentArticle,
} from '../lib/agentSearch';
import { sendChat } from '../lib/chatApi';
import { getFeaturedArticleIcon } from '../lib/getFeaturedArticleIcon';
import type { CatalogRow } from '../types/catalog';

type UiMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  at: Date;
  articles?: AgentArticle[];
};

function BotAvatar() {
  return (
    <div className="kb-agent-bot-avatar" aria-hidden="true">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4" />
        <line x1="8" y1="16" x2="8.01" y2="16" />
        <line x1="16" y1="16" x2="16.01" y2="16" />
      </svg>
    </div>
  );
}

function formatTimestamp(date = new Date()) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ArticleResultCards({ articles }: { articles: AgentArticle[] }) {
  if (!articles.length) return null;

  return (
    <div className="kb-agent-results">
      {articles.map((article) => {
        const row = {
          id: article.id,
          title: article.title,
          sourceSheet: article.category,
          tags: article.tags,
          url: '',
          lastUpdate: '',
          lastUpdateStamp: 0,
          authors: '',
        } satisfies CatalogRow;
        const Icon = getFeaturedArticleIcon(row);

        return (
          <Link
            key={article.id}
            to={`/doc/${encodeURIComponent(article.id)}`}
            className="kb-agent-result-card"
            aria-label={`Open article: ${article.title}`}
          >
            <div className="kb-agent-result-icon" aria-hidden="true">
              <Icon width={15} height={15} />
            </div>
            <div className="min-w-0">
              <div className="kb-agent-result-title">{article.title}</div>
              <div className="kb-agent-result-sub">
                {article.category}
                {article.subtitle && article.subtitle !== article.category
                  ? ` • ${article.subtitle}`
                  : ''}
              </div>
            </div>
            <svg
              className="kb-agent-result-arrow"
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
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        );
      })}
    </div>
  );
}

export function KnowledgeAgentPanel() {
  const catalogQuery = useCatalog();
  const rows = catalogQuery.data?.rows ?? [];
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, pending, error]);

  useEffect(() => {
    function focusAgentInput() {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    window.addEventListener(FOCUS_AGENT_EVENT, focusAgentInput);
    return () => window.removeEventListener(FOCUS_AGENT_EVENT, focusAgentInput);
  }, []);

  function resetConversation() {
    setMessages([]);
    setError(null);
    setDraft('');
    setPending(false);
    inputRef.current?.focus();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || pending) return;

    const userMessage: UiMessage = {
      id: newId(),
      role: 'user',
      content,
      at: new Date(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft('');
    setError(null);
    setPending(true);

    try {
      const plan = planAgentAnswer(rows, content);

      if (plan.mode === 'retrieval') {
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: 'assistant',
            content: plan.message || '',
            at: new Date(),
            articles: plan.articles,
          },
        ]);
        return;
      }

      const { reply } = await sendChat(
        nextMessages.map((m) => ({ role: m.role, content: m.content })),
        { articles: toGeminiArticleContext(plan.articles) }
      );

      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: 'assistant',
          content: reply,
          at: new Date(),
          articles: plan.articles,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get a reply');
    } finally {
      setPending(false);
    }
  }

  return (
    <aside className="kb-agent-panel" aria-label="Knowledge Agent">
      <div className="kb-agent-header">
        <div className="kb-agent-header-left">
          <div className="kb-agent-avatar" aria-hidden="true">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" y1="16" x2="8.01" y2="16" />
              <line x1="16" y1="16" x2="16.01" y2="16" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="kb-agent-title-row">
              <h2 className="kb-agent-title">Knowledge Agent</h2>
              <span className="kb-agent-ai-badge">AI</span>
            </div>
            <div className="kb-agent-subtitle">Ask anything across team docs</div>
          </div>
        </div>

        <div className="kb-agent-header-actions">
          <button
            type="button"
            className="kb-agent-icon-btn"
            aria-label="Reset conversation"
            onClick={resetConversation}
            disabled={pending}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
          <button type="button" className="kb-agent-icon-btn" aria-label="Collapse panel">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </button>
        </div>
      </div>

      <div className="kb-agent-body" ref={bodyRef} aria-live="polite">
        {messages.length === 0 && !pending && !error ? (
          <div className="kb-agent-assistant-wrap">
            <BotAvatar />
            <div className="kb-agent-bubble">
              <p>
                Hi — ask for an article link or workflow question. I search the H5 Knowledge Base
                first, then answer with real docs when they exist.
              </p>
            </div>
          </div>
        ) : null}

        {messages.map((message) =>
          message.role === 'user' ? (
            <div key={message.id} className="kb-agent-user-wrap">
              <div className="kb-agent-question">{message.content}</div>
              <span className="kb-agent-timestamp">{formatTimestamp(message.at)}</span>
            </div>
          ) : (
            <div key={message.id} className="kb-agent-assistant-wrap">
              <BotAvatar />
              <div className="kb-agent-bubble">
                <p className="kb-agent-reply">{message.content}</p>
                {message.articles?.length ? (
                  <ArticleResultCards articles={message.articles} />
                ) : null}
              </div>
            </div>
          )
        )}

        {pending ? (
          <div className="kb-agent-assistant-wrap">
            <BotAvatar />
            <div className="kb-agent-bubble">
              <p className="kb-agent-thinking" role="status">
                Searching docs…
              </p>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="kb-agent-assistant-wrap">
            <BotAvatar />
            <div className="kb-agent-bubble kb-agent-bubble-error" role="alert">
              <p>{error}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="kb-agent-footer">
        <form className="kb-agent-composer" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="kb-agent-input"
            type="text"
            placeholder="Ask a question or search docs..."
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            aria-label="Ask the knowledge agent"
            disabled={pending}
            autoComplete="off"
          />
          <div className="kb-agent-composer-bar">
            <div className="kb-agent-composer-left">
              <span className="kb-agent-sync">
                <span className="kb-agent-sync-dot" aria-hidden="true" />
                KB + Gemini Free
              </span>
            </div>
            <button
              type="submit"
              className="kb-agent-send"
              aria-label="Send message"
              disabled={pending || !draft.trim()}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          </div>
        </form>
        <div className="kb-agent-hint">Press Enter to send</div>
      </div>
    </aside>
  );
}
