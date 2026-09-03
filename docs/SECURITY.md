# Security Checklist — H5 Knowledge Base

**Phase:** 5 (Security, Accessibility, and Hardening)  
**Audience:** Internal Smartly H5 team  
**Last updated:** 2026-09-03

---

## Access control

| Control | Status | Notes |
|---------|--------|-------|
| Proxy `API_KEY` (`X-API-Key`) | **Required for production** | Set in Vercel env; mirror as `VITE_API_KEY` for the static frontend |
| Apps Script Script Property `API_KEY` | Recommended | Proxy sends matching `?key=` via `APPS_SCRIPT_API_KEY` |
| Cloudflare Access | N/A | `@smartly.io` accounts cannot create Cloudflare; API key + rate limit substitute |
| Rate limiting | Enabled | Default 60 req/min/IP on `/api/catalog` (`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`) |
| CORS allowlist | Recommended | Set `CORS_ORIGINS` to the GitHub Pages origin(s) |
| JSONP | **Removed** | Apps Script rejects `?callback=` with JSON error |

> **Note on `VITE_API_KEY`:** Any key shipped in the static frontend is extractable from the JS bundle. Treat it as a soft gate against casual abuse, not a secret. Prefer combining it with `CORS_ORIGINS`, Apps Script `API_KEY` (server-side only via the proxy), and rate limiting. For stronger SSO-style access, host the SPA behind an internal IdP / reverse proxy later.

### Production env checklist

```bash
# Vercel (services/api-proxy)
APPS_SCRIPT_URL=https://script.google.com/.../exec
API_KEY=<long random secret>
APPS_SCRIPT_API_KEY=<same as Apps Script Script Property API_KEY>
CORS_ORIGINS=https://romelordinarioGithub.github.io

# Frontend (apps/web build / GH Pages)
VITE_CATALOG_API_URL=https://h5-kb-api-proxy.vercel.app/api/catalog
VITE_API_KEY=<same as Vercel API_KEY>
```

---

## Content security

| Control | Status | Notes |
|---------|--------|-------|
| FAQ HTML sanitization | Done | `DOMPurify` in `sanitizeFaqHtml()` before `dangerouslySetInnerHTML` |
| Document URL sanitization | Done | `sanitizeDocumentUrl()` blocks `javascript:`, `data:`, `vbscript:`, `blob:`, credentials |
| Embed URL allowlist | Done | `sanitizeEmbedUrl()` — HTTPS + `docs.google.com` / `drive.google.com` path patterns only |
| iframe sandbox | Done | `allow-scripts allow-same-origin allow-popups allow-forms` |
| CSP (`frame-src`) | Done | Meta tag in `apps/web/index.html` allows only Google Docs/Drive |
| Proxy security headers | Done | `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` |

### CSP policy (frontend meta tag)

GitHub Pages cannot set HTTP response headers, so CSP is delivered via `<meta http-equiv="Content-Security-Policy">`.

- **frame-src:** `https://docs.google.com https://drive.google.com` only — SharePoint/OneDrive never framed
- **object-src:** `none`
- **connect-src:** `'self'` + HTTPS API + local Vite/proxy ports for development
- **Note:** `frame-ancestors` is ignored in meta CSP (per spec); proxy sets `X-Frame-Options: DENY`

Does **not** break preview: Google embeds remain allowed. Fallback “Open Original” is a top-level navigation (`target=_blank`), not an iframe, so CSP `frame-src` does not block it.

---

## Accessibility (WCAG 2.1 AA targets)

| Item | Status |
|------|--------|
| Skip-to-content link | Done (`SkipLink` → `#main-content`) |
| Modal focus trap + Esc + restore | Done (Headless UI `Dialog`) |
| `aria-live` result counts | Done (`MetaRow` polite live region) |
| Preview `aria-label` / `role="document"` | Done (`DocumentViewer`) |
| Contrast (muted text, badges, FAQ accents, modal close) | Adjusted |
| Keyboard: cards (Enter/Space), FAQ summary, filters, FAQ button | Audited |

**Manual acceptance:** run axe DevTools on `/` and `/doc/:id` — 0 critical/serious violations.

---

## Error handling

| Item | Status |
|------|--------|
| App-level React error boundary | Done (`App.tsx`) |
| DocumentViewer error boundary | Done (`DocPage.tsx`) |

---

## Dependency audit

| Workspace | Status |
|-----------|--------|
| `@h5-kb/web` | `npm audit` → **0 vulnerabilities** |
| `@h5-kb/api-proxy` | Remaining advisories are inside the **Vercel CLI** (`vercel` devDependency only). Safe `npm audit fix` applied; CLI bumped to latest. Not shipped to browsers or the serverless runtime. |

Re-check after dependency updates:

```bash
npm audit -w @h5-kb/web
npm audit -w @h5-kb/api-proxy
```

---

## Pre-release verification

- [ ] `API_KEY` set on Vercel; unauthenticated `GET /api/catalog` returns `401`
- [ ] Apps Script redeployed without JSONP; `?callback=test` returns error JSON
- [ ] FAQ answers with `<script>` / `onclick` are stripped in the UI
- [ ] `javascript:alert(1)` catalog URL never becomes an `href` or iframe `src`
- [ ] Google Doc preview still attempts iframe; SharePoint shows fallback CTA
- [ ] axe scan: home + doc page clean
- [ ] Keyboard: Tab to skip link → main; open FAQ → trap focus; Esc closes
