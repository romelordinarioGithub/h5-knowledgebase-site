# Data Layer — Phase 1

**Date:** 2026-09-02  
**Status:** Implemented  
**Goal:** Eliminate JSONP timeouts with a cached API proxy while keeping Google Sheets as source of truth.

**Proxy host:** Vercel Edge Functions (Cloudflare Workers are unavailable for `@smartly.io` accounts).

---

## Architecture

```
Google Sheet (source of truth)
        │
        ▼
Apps Script Web App (services/apps-script/Code.gs)
  • Normalizes rows + FAQ
  • Adds linkType, provider, embedUrl, canPreview per row
  • CacheService 120s TTL
  • Returns JSON only (JSONP removed; optional ?key= API gate)
        │
        ▼
Vercel Node Function (services/api-proxy)
  GET /api/catalog
  • Fetches Apps Script JSON (server-side, no CORS)
  • Retry ×2 with exponential backoff
  • 45s upstream timeout
  • CDN cache: s-maxage 5 min, stale-while-revalidate 10 min
  • X-API-Key gate + per-IP rate limit + security headers
        │
        ▼
React Frontend (apps/web)
  • fetch() via catalogApi → TanStack Query
  • localStorage fallback (h5-kb-catalog-v1)
  • Stale banner + toast on refresh failure
  • Auto-sync: 5 min + tab visibility refocus
  • DOMPurify FAQ HTML; sanitized document/embed URLs
```

---

## Monorepo Layout

| Path | Role |
|------|------|
| `apps/web/` | React + Vite + Tailwind frontend |
| `packages/shared/` | `SOURCE_SHEETS`, URL classifier, JSDoc types |
| `services/apps-script/` | Google Apps Script backend |
| `services/api-proxy/` | Vercel API proxy |

---

## Catalog API

### Endpoint

```
GET /api/catalog
```

Header (production): `X-API-Key: <secret>` (Vercel env `API_KEY`).

See also `docs/SECURITY.md`.

### Response envelope

Same as Apps Script payload:

```json
{
  "apiVersion": "2026-09-02-link-classify-1",
  "updatedAt": "2026-09-02T...",
  "count": 42,
  "rows": [ /* CatalogRow[] */ ],
  "faqs": [ /* FaqItem[] */ ]
}
```

### Row shape (extended)

```javascript
{
  id: "667355349-entry-3",
  sourceSheet: "Studio Setup",
  title: "...",
  url: "https://docs.google.com/document/d/...",
  lastUpdate: "Feb 2025",
  lastUpdateStamp: 1738368000000,
  authors: "...",
  tags: ["studiosetup"],
  linkType: "google_doc",
  provider: "google_doc",
  embedUrl: "https://.../preview",
  canPreview: true
}
```

### Link classification

| linkType / provider | Pattern | embedUrl | canPreview |
|---------------------|---------|----------|------------|
| `google_doc` | `docs.google.com/document/d/{id}` | `/preview` | true |
| `google_sheet` | `docs.google.com/spreadsheets/d/{id}` | `/preview` | true |
| `google_slides` | `docs.google.com/presentation/d/{id}` | `/embed?...` | true |
| `google_drive` | `drive.google.com/file/d/{id}` | `/preview` | true |
| `google_drive` | folders / open?id | null | false |
| `sharepoint` | `*.sharepoint.com` | null | false |
| `onedrive` | onedrive.live.com, 1drv.ms | null | false |
| `external` | everything else | null | false |

Classifier source of truth: `packages/shared/src/classifyUrl.js` (mirrored in `Code.gs`).

---

## Frontend data fetching

| Concern | Implementation |
|---------|----------------|
| HTTP client | `apps/web/src/lib/catalogApi.js` |
| Query cache | TanStack Query (`useCatalog` hook) |
| Offline fallback | `localStorage` via `catalogCache.js` |
| Stale UI | `.stale-banner` when error + cached rows |
| Sync interval | 5 minutes (`AUTO_SYNC_MS`), pauses in background |
| Visibility | `refetchOnWindowFocus: true` |
| Manual refresh | Refresh button → `invalidateQueries` |

**JSONP removed.** The frontend never injects `<script>` tags for catalog data.

---

## Local development

```bash
# Install all workspaces
npm install

# Terminal 1 — API proxy (set APPS_SCRIPT_URL in Vercel env or local .env)
npm run dev:proxy

# Terminal 2 — frontend (proxies /api → localhost:3000)
npm run dev
```

Open `http://localhost:5173/h5-knowledgebase-site/`.

For production-like testing, set:

```
VITE_CATALOG_API_URL=https://your-project.vercel.app/api/catalog
```

---

## Deployment checklist

1. **Apps Script:** Deploy `services/apps-script/Code.gs` as Web App (domain access).
2. **Vercel proxy:** `npm run deploy:proxy` with `APPS_SCRIPT_URL` set (see `services/api-proxy/README.md`).
3. **Frontend:** Set `VITE_CATALOG_API_URL` to Vercel `/api/catalog` URL, then `npm run deploy -w @h5-kb/web`.
4. **CORS:** Proxy sends `Access-Control-Allow-Origin: *` for browser access from GitHub Pages.

---

## Config single source of truth

| Config | Location |
|--------|----------|
| Tab names + GIDs | `packages/shared/src/sourceSheets.js` (+ mirror in `Code.gs`) |
| URL classifier | `packages/shared/src/classifyUrl.js` (+ mirror in `Code.gs`) |
| Apps Script URL | Vercel env only (not in frontend bundle) |
| Catalog API URL | `VITE_CATALOG_API_URL` or default `/api/catalog` |

---

## Phase 2+ (out of scope)

- Document preview UI using `embedUrl` / `canPreview`
- Mantine → Tailwind migration
- CI/CD for proxy + frontend deploys
