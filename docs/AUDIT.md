# H5 Team Knowledge Base — Phase 0 Audit

**Date:** 2026-09-02  
**Repo:** `/Users/romelordinario/Documents/2026/h5-knowledgebase`  
**Origin:** Migrated from `/Users/romelordinario/Documents/2026/internal site/` (GitHub: `romelordinarioGithub/h5-knowledgebase-site`)  
**Git history:** Preserved (3 commits on `main`)

---

## Executive Summary

The H5 Team Knowledge Base is a single-page React app backed by a Google Sheet and a Google Apps Script Web App. The frontend uses JSONP to fetch normalized rows because GitHub Pages is static and cannot proxy cross-origin requests. Local development works; live data loading requires Smartly Google Workspace authentication for the Apps Script endpoint.

**Phase 0 status:** Repo migrated, local dev verified, audit documented. No architecture changes or deployments were made.

---

## 1. Current Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Google Sheet: "H5 Team - Knowledge Base"                                │
│ ID: 1yfK2W_6Te_tDCl8pxFo1FGTOIsqzp-nvw-fk0foW8zA                       │
│ Tabs: Build Guides | Master Templates | Studio Setup |                   │
│       Process Docs | Internal Tools | FAQ                               │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ SpreadsheetApp.openById + Sheets API v4
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Google Apps Script Web App (doGet)                                      │
│ URL: script.google.com/a/macros/smartly.io/s/AKfycbxTZ-.../exec         │
│ • Normalizes 5 content tabs into unified row schema                     │
│ • Reads FAQ tab with rich-text link extraction                          │
│ • CacheService: 120s TTL, max ~95KB payload                             │
│ • Returns JSON (?callback absent) or JSONP (?callback=fn)               │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ JSONP <script> injection (CORS bypass)
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ React Frontend (mantine-app/src/App.jsx)                                │
│ • fetchNormalizedRowsJSONP() — 30s client timeout                       │
│ • rows[] → client-side search, filter, sort                             │
│ • Auto-refresh every 60s when tab visible                               │
│ • Featured articles: random 5 on first load, preserved on quiet refresh │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ UI: Hero search → Topic cards → Featured → Filters → Cards → Modals   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Deployment topology

| Layer | Host | URL |
|-------|------|-----|
| Frontend (production) | GitHub Pages | `https://romelordinarioGithub.github.io/h5-knowledgebase-site/` |
| Frontend (local dev) | Vite | `http://localhost:5173/h5-knowledgebase-site/` |
| Backend API | Google Apps Script (Smartly domain) | `https://script.google.com/a/macros/smartly.io/s/AKfycbxTZ-z2N_lCuzSTsL9gGr2VnZWJ4AJf3PC9lzKQn0OQrYjbEf3UN5HzUWRYhevUZDhl/exec` |
| Source of truth | Google Sheets | Spreadsheet ID above |
| Portal link | Google Sites | `https://sites.google.com/smartly.io/h5knowledgebase/main` |

### Key files

| File | Role |
|------|------|
| `mantine-app/src/App.jsx` | Entire UI, JSONP fetch, search/filter, modals (~523 lines) |
| `mantine-app/src/main.jsx` | MantineProvider, grape theme, font imports |
| `mantine-app/src/index.css` | All custom styling (~800 lines) |
| `mantine-app/vite.config.js` | Vite config, GitHub Pages base path |
| `mantine-app/package.json` | Dependencies, build/deploy scripts |
| `apps-script-backup/Code.gs` | Backend: sheet read, normalization, cache, JSONP (~611 lines) |

---

## 2. Spreadsheet Schema

### Content tabs (matched by GID, not tab name)

| Tab Name | GID | Title Column Header |
|----------|-----|---------------------|
| Build Guides | `1198250871` | `Delivery Type` |
| Master Templates | `560139915` | `Template Name` |
| Studio Setup | `667355349` | `Studio Setup Type` |
| Process Docs | `174313596` | `Process Doc` |
| Internal Tools | `1350118893` | `Tool Name` |

Row 1 = headers. Row 2+ = data entries.

### Flexible column mapping (`pickFirst()` in Code.gs)

| Normalized field | Accepted header names |
|------------------|----------------------|
| `title` | Tab-specific title column (see above) |
| `url` | `Url Links`, `Links`, `Doc Guide`, `Link` |
| `lastUpdate` | `Last Update` |
| `authors` | `Authors`, `Author` |
| `tags` | `tags` (comma-separated; lowercased on server) |

### Normalized row shape (API output)

```javascript
{
  id: "<gid>-entry-<index>",       // e.g. "667355349-entry-3"
  sourceSheet: "Studio Setup",     // display name from SOURCE_SHEETS
  title: "Dynamic Product Ads Setup",
  url: "https://docs.google.com/document/d/...",
  lastUpdate: "Feb 2025",          // display string from sheet
  lastUpdateStamp: 1738368000000,  // Date.parse(lastUpdate) or -Infinity
  authors: "Junior Ebreo",
  tags: ["studiosetup", "studio", "setup"]
}
```

Rows are included only if at least one of `title`, `url`, `authors`, or `tags` is non-empty.

### FAQ tab (matched by name `"FAQ"`)

| Field | Accepted header names |
|-------|----------------------|
| Question | `question`, `faq question`, `faq`, `questions`, `q` |
| Answer | `answer`, `faq answer`, `response`, `details`, `a` |

Output: `{ question, answer, answerHtml }` — capped at 20 items. Rich-text answers are converted to HTML with hyperlinks preserved via Sheets API v4 link span extraction.

### API payload envelope

```javascript
{
  apiVersion: "2026-03-26-faq-link-fix-1",
  updatedAt: "2026-03-31T...",
  count: 42,
  rows: [ /* normalized rows */ ],
  faqs: [ /* FAQ items */ ]
}
```

### Config duplication risk

`SOURCE_SHEETS` (tab names + GIDs) is hardcoded in **both** `App.jsx` and `Code.gs`. Adding or renaming a tab requires updating both files and redeploying Apps Script.

---

## 3. JSONP Fetch Implementation (App.jsx)

```javascript
// mantine-app/src/App.jsx:40-76
function fetchNormalizedRowsJSONP() {
  return new Promise((resolve, reject) => {
    const callbackName = `kbJsonp_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement('script');
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Apps Script JSONP request timed out'));
    }, 30000);

    window[callbackName] = (payload) => {
      cleanup();
      if (!payload || !Array.isArray(payload.rows)) {
        reject(new Error('Invalid payload from Apps Script endpoint'));
        return;
      }
      resolve(payload);
    };

    script.onerror = () => { cleanup(); reject(new Error('Failed to load Apps Script endpoint')); };
    script.src = `${APPS_SCRIPT_WEBAPP_URL}?callback=${callbackName}&ts=${Date.now()}`;
    document.head.appendChild(script);
  });
}
```

**Why JSONP:** GitHub Pages is static. A normal `fetch()` to Apps Script would hit CORS. JSONP injects a `<script>` tag; the server responds with `callbackName({...});` as JavaScript.

**Load triggers:**
- Initial mount (`loadData()`)
- Manual Refresh button
- Auto-sync every 60s (`AUTO_SYNC_MS`), skipped when `document.hidden`

**Quiet refresh:** Auto-sync uses `{ quiet: true, preserveFeatured: true }` — failures are silently swallowed (no notification, stale data persists).

---

## 4. Code.gs Normalization (Backend)

Entry point `doGet(e)` routes JSON vs JSONP based on `?callback=` parameter. Callback names are validated with `/^[A-Za-z_$][0-9A-Za-z_$\.]*$/`.

Caching (`getCachedPayloadJson`):
- Key: `kb_payload:2026-03-26-faq-link-fix-1:1yfK2W_6Te_...`
- TTL: 120 seconds
- Max cached size: 95,000 bytes (larger payloads skip cache)
- Cache failures are non-blocking

FAQ link extraction adds latency on cache miss via an extra `UrlFetchApp.fetch()` to Sheets API v4 for hyperlink spans.

---

## 5. Vite & Package Configuration

### vite.config.js

```javascript
export default defineConfig({
  plugins: [react()],
  base: '/h5-knowledgebase-site/',  // GitHub Pages subdirectory
});
```

### package.json scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite` | Local dev server |
| `build` | `vite build` | Production bundle → `dist/` |
| `preview` | `vite preview` | Serve built assets locally |
| `predeploy` | `npm run build` | Build before deploy |
| `deploy` | `gh-pages -d dist` | Push `dist/` to `gh-pages` branch |

### Dependencies (runtime)

| Package | Version | Purpose |
|---------|---------|---------|
| react / react-dom | ^19.2.4 | UI framework |
| @mantine/core | ^8.3.18 | Form controls, modals |
| @mantine/notifications | ^8.3.18 | Error toasts |
| @mantine/hooks | ^8.3.18 | Mantine utilities |
| @emotion/react | ^11.14.0 | Mantine CSS-in-JS dependency |
| @fontsource/montserrat | ^5.2.8 | Typography |

### Deployment setup

1. `npm run build` produces `mantine-app/dist/`
2. `npm run deploy` uses `gh-pages` to push `dist/` contents to the `gh-pages` branch
3. GitHub Pages serves from `gh-pages` at `/h5-knowledgebase-site/`
4. **No CI/CD** — deploy is manual via local `npm run deploy`
5. Apps Script backend is deployed separately via Google Apps Script UI (see `apps-script-backup/README.md`)

---

## 6. Known Issues

| Issue | Severity | Details |
|-------|----------|---------|
| **JSONP timeout** | High | Client hard-rejects after 30s. Cold Apps Script start + 5-tab read + FAQ Sheets API call can exceed this. Error: `"Apps Script JSONP request timed out"`. No retry logic. |
| **New-tab links only** | Medium | All document URLs use `target="_blank"`. Card click opens detail modal; "Read More" / "Open Document" leave the app. No in-app preview. |
| **Monolithic App.jsx** | Medium | ~523 lines: data fetch, state, search, filters, featured logic, hero, cards, two modals, FAQ — all in one file. No component extraction. |
| **No CI** | Medium | No GitHub Actions, no automated lint/build/deploy, no preview environments. |
| **Config duplication** | Medium | `SOURCE_SHEETS`, Apps Script URL hardcoded in frontend; spreadsheet ID in backend. No `.env` or shared config. |
| **Silent auto-refresh failures** | Medium | 60s quiet refresh swallows errors; UI shows stale data without indication. |
| **Misleading "Doc Type" filter** | Low | Filter matches `row.title` (document name), not a separate type field. |
| **Random featured articles** | Low | Not driven by spreadsheet; random shuffle on load. |
| **No client-side cache** | Low | Every page load = full JSONP round-trip. No localStorage / SWR / stale-while-revalidate. |
| **Auth-gated API** | Info | Apps Script requires Smartly workspace Google login. Unauthenticated requests receive Google sign-in HTML. |
| **Large CSS bundle** | Low | Mantine core styles + custom CSS = 220 KB CSS (33 KB gzip). Font files add ~700 KB uncompressed. |

---

## 7. URL / Link Type Inventory

### Classification logic

URLs are stored as plain strings in spreadsheet link columns. The backend passes them through unchanged. The frontend renders them as `<a href="..." target="_blank" rel="noopener noreferrer">`.

Provider classification (for Phase 2+ preview routing):

| Provider | URL pattern | Preview feasibility |
|----------|-------------|---------------------|
| `google-docs` | `docs.google.com/document/d/{id}` | iframe embed (auth required) |
| `google-sheets` | `docs.google.com/spreadsheets/d/{id}` | iframe embed (auth required) |
| `google-slides` | `docs.google.com/presentation/d/{id}` | iframe embed (auth required) |
| `google-drive` | `drive.google.com/file/d/{id}` or `/drive/folders/{id}` | Limited embed |
| `google-sites` | `sites.google.com/{domain}/{site}/{page}` | iframe possible |
| `google-forms` | `docs.google.com/forms/d/{id}` | iframe possible |
| `figma` | `figma.com/file/{id}` or `/design/{id}` | Figma embed API |
| `notion` | `notion.so/` or `*.notion.site/` | Public pages only |
| `miro` | `miro.com/app/board/` | Embed with board access |
| `confluence` | `*.atlassian.net/wiki/` | Embed varies |
| `github` | `github.com/` or `*.github.io/` | Public repos only |
| `loom` | `loom.com/share/{id}` | oEmbed |
| `youtube` | `youtube.com/` or `youtu.be/` | iframe embed |
| `smartly-internal` | `*.smartly.io` | Internal tooling |
| `other` | Any other host | Open in new tab only |

### Sample URLs (pattern-based inventory)

> **Note:** Live payload fetch requires Smartly Google Workspace authentication. The samples below are representative URL patterns expected in the sheet based on tab structure and H5 team tooling. To generate a live inventory, run `node docs/scripts/fetch-payload.mjs` while authenticated.

| # | Provider | Example URL pattern | Typical tab |
|---|----------|---------------------|-------------|
| 1 | google-docs | `https://docs.google.com/document/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/edit` | Process Docs |
| 2 | google-docs | `https://docs.google.com/document/d/2bCdEfGhIjKlMnOpQrStUvWxYzA/view` | Build Guides |
| 3 | google-docs | `https://docs.google.com/document/d/3cDeFgHiJkLmNoPqRsTuVwXyZaB/edit?usp=sharing` | Studio Setup |
| 4 | google-sheets | `https://docs.google.com/spreadsheets/d/1dEfGhIjKlMnOpQrStUvWxYzAbC/edit` | Master Templates |
| 5 | google-sheets | `https://docs.google.com/spreadsheets/d/2eFgHiJkLmNoPqRsTuVwXyZaBcD/view` | Internal Tools |
| 6 | google-slides | `https://docs.google.com/presentation/d/1fGhIjKlMnOpQrStUvWxYzAbCdE/edit` | Build Guides |
| 7 | google-slides | `https://docs.google.com/presentation/d/2gHiJkLmNoPqRsTuVwXyZaBcDeF/present` | Process Docs |
| 8 | google-drive | `https://drive.google.com/file/d/1hIjKlMnOpQrStUvWxYzAbCdEfGh/view` | Master Templates |
| 9 | google-drive | `https://drive.google.com/drive/folders/1iJkLmNoPqRsTuVwXyZaBcDeFgHi` | Studio Setup |
| 10 | google-drive | `https://drive.google.com/open?id=1jKlMnOpQrStUvWxYzAbCdEfGhIjK` | Build Guides |
| 11 | google-sites | `https://sites.google.com/smartly.io/h5knowledgebase/main` | Internal Tools |
| 12 | google-sites | `https://sites.google.com/smartly.io/h5-team-wiki/home` | Process Docs |
| 13 | google-forms | `https://docs.google.com/forms/d/1kLmNoPqRsTuVwXyZaBcDeFgHiJkL/viewform` | Internal Tools |
| 14 | figma | `https://www.figma.com/file/AbCdEfGh1234/Template-Name` | Master Templates |
| 15 | figma | `https://www.figma.com/design/XyZ123AbCdEf/Studio-Setup-Guide` | Studio Setup |
| 16 | notion | `https://www.notion.so/smartly/Process-Doc-abc123def456` | Process Docs |
| 17 | miro | `https://miro.com/app/board/uXjVabc123DEF=` | Build Guides |
| 18 | confluence | `https://smartly.atlassian.net/wiki/spaces/H5/pages/123456789` | Process Docs |
| 19 | github | `https://github.com/smartlyio/template-repo` | Internal Tools |
| 20 | github | `https://romelordinarioGithub.github.io/h5-knowledgebase-site/` | Internal Tools |
| 21 | loom | `https://www.loom.com/share/abc123def456789` | Build Guides |
| 22 | youtube | `https://www.youtube.com/watch?v=dQw4w9WgXcQ` | Build Guides |
| 23 | smartly-internal | `https://app.smartly.io/` | Internal Tools |
| 24 | smartly-internal | `https://script.google.com/a/macros/smartly.io/s/AKfycbxTZ-.../exec` | (API endpoint) |
| 25 | other | `https://example.com/internal-tool-docs` | Internal Tools |

**Link rendering behavior:**

| Interaction | Behavior |
|-------------|----------|
| Click card body | Opens detail modal (in-app) |
| Click featured row | Opens detail modal (in-app) |
| Click "Read More" on card | Opens URL in **new tab** (`target="_blank"`) |
| Click "Open Document" in modal | Opens URL in **new tab** |
| FAQ answer links | Rendered as HTML `<a target="_blank">` from server |

---

## 8. Baseline Performance Metrics

Measured on 2026-09-02 (local machine, Phase 0 audit).

### Build output (Vite 8.0.3)

| Asset | Size (raw) | Size (gzip) |
|-------|------------|-------------|
| `index-DdTeXBtf.js` | 381.57 KB | 117.89 KB |
| `index-BzQd_Z8_.css` | 220.45 KB | 33.63 KB |
| Montserrat font files (all subsets) | ~700 KB total | — |
| `index.html` | 0.52 KB | 0.31 KB |
| **Build time** | 340 ms | — |

### Local dev server

| Metric | Value |
|--------|-------|
| Vite cold start | 417 ms |
| Dev server URL | `http://localhost:5173/h5-knowledgebase-site/` |
| First HTML response | ~15 ms (HTTP 200) |
| Preview server (production build) | ~9 ms (HTTP 200) |

### API endpoint (unauthenticated curl)

| Metric | Value | Notes |
|--------|-------|-------|
| HTTP status | 302 → 200 | Redirects to Google sign-in |
| Response body | Google Accounts HTML | Expected without workspace auth |
| Time to first byte | ~1.0–1.3 s | Includes redirect chain |

### Runtime behavior (from code analysis)

| Metric | Value |
|--------|-------|
| Client JSONP timeout | 30,000 ms |
| Auto-sync interval | 60,000 ms |
| Server cache TTL | 120 s |
| FAQ max items | 20 |
| Featured articles | 5 (random) |
| Modules transformed (build) | 771 |

### Bundle composition notes

- Mantine core + notifications dominate JS bundle (~380 KB)
- Mantine CSS reset + component styles dominate CSS (~220 KB)
- Custom `index.css` is layered on top but Mantine base styles are the bulk
- Phase 2 Tailwind migration should significantly reduce CSS payload

---

## 9. Design Reference — Purple Hero UI

### CSS custom properties (`index.css`)

```css
--bg: #efeff3;
--surface: #ffffff;
--ink: #181327;
--muted: #6e6782;
--primary: #7a30d8;
--primary-dark: #432184;
--primary-soft: #e9e2fb;
--line: #dfd9ec;
--radius: 16px;
--shadow: 0 10px 28px rgba(42, 30, 82, 0.12);
```

### Mantine theme (`main.jsx`)

- Font: Montserrat (400, 500, 600, 700)
- Primary color: `grape` — custom 10-shade scale anchored at `#7a30d8` (index 7) and `#432184` (index 9)
- Color scheme: light only

### Hero section

- Min-height: 420px (360px on mobile ≤820px)
- Background: linear gradient `#2327aa → #4f2a9f → #7433a9` at 115deg
- Overlays: circuit-board SVG pattern, radial highlights, vertical stripe grid, blur glow
- Content: eyebrow ("H5 Team Knowledge Base"), h1 ("How Can We Help?"), subtitle, pill search input
- FAQ trigger: top-right text button, white, underline on hover

### Component visual patterns

| Element | Style |
|---------|-------|
| Search input | Pill (`border-radius: 999px`), white, drop shadow |
| Topic cards | White, 6px radius, 5-column grid (horizontal scroll mobile), hover lift |
| Featured panel | `#f7f6fa` background, `#e7e1f3` border, list with arrow (→) |
| Result cards | 16px radius, folder icon (CSS mask), purple date pill, blue source badge |
| Modals | 18–22px radius, custom gray circle close button, purple-tinted overlay |
| FAQ accordion | `<details>` with purple +/− toggle |
| Loader | Custom "rolling rock" CSS animation on white fullscreen overlay |

### Responsive breakpoint

Single breakpoint at **820px**: hero shrinks, topic cards scroll horizontally, filters stack to 1 column.

---

## 10. Mantine Component Inventory → Tailwind Mapping (Phase 2)

| Mantine component | Usage in App.jsx | Tailwind replacement plan |
|-------------------|------------------|---------------------------|
| **TextInput** | Hero search bar (`search-input` class, radius xl, size lg) | Native `<input>` or Headless UI Combobox; Tailwind: `rounded-full px-6 py-4 shadow-lg` |
| **Select** (×3) | Source Sheet, Doc Type, Sort By filters | Headless UI Listbox or Radix Select; Tailwind: `rounded-xl border border-[--line] min-h-[44px]` |
| **Button** | Refresh button (`#refreshBtn`, pill shape) | `<button>` with Tailwind: `rounded-full bg-[--primary] text-white px-5 py-2.5` |
| **Modal** (×2) | Detail modal, FAQ modal | Headless UI Dialog or Radix Dialog; replicate `.detail-modal` / `.faq-modal` styles |
| **Notifications** | Error toast on load failure (`notifications.show`) | Sonner, react-hot-toast, or custom toast; top-right position |
| **MantineProvider** | Theme wrapper in `main.jsx` | Remove; apply CSS variables directly |
| **@mantine/core/styles.css** | Base Mantine styles (~200KB CSS) | Remove entirely; replace with Tailwind utilities |

### Mantine-specific CSS overrides to preserve

These custom classes in `index.css` target Mantine internals and will become direct Tailwind classes:

- `.search-input .mantine-Input-input` → search pill styles
- `.control .mantine-Select-input` → filter dropdown styles
- `#refreshBtn.mantine-Button-root` → refresh button styles
- `.mantine-Modal-overlay` → modal backdrop `rgba(23, 18, 44, 0.56)`

---

## 11. Local Dev Verification (Phase 0)

### Steps performed

```bash
cd mantine-app
npm install          # 260 packages installed
npm run dev          # Vite ready at http://localhost:5173/h5-knowledgebase-site/
npm run build        # Production build succeeded (340ms)
npm run preview      # Preview at http://localhost:4173/h5-knowledgebase-site/
```

### Results

| Check | Status |
|-------|--------|
| Repo cloned with git history | ✅ 3 commits preserved |
| Remote set to GitHub origin | ✅ `romelordinarioGithub/h5-knowledgebase-site` |
| `npm install` | ✅ |
| Dev server starts | ✅ HTTP 200 |
| Production build | ✅ |
| Apps Script data load (unauthenticated) | ⚠️ Requires Smartly Google login |
| Apps Script data load (authenticated) | 🔲 Verify in browser while logged in to smartly.io |

### Authenticated verification (manual)

1. Open `http://localhost:5173/h5-knowledgebase-site/` in a browser logged into Smartly Google Workspace
2. Confirm startup loader dismisses and topic cards populate with counts
3. Confirm status text shows `"Showing N of M entries"`
4. Optional: run `node docs/scripts/fetch-payload.mjs` to dump live payload and URL classification

---

## 12. Phase 1 Readiness Checklist

- [x] Repo migrated to `h5-knowledgebase` with git history
- [x] GitHub remote configured
- [x] Local dev server runs
- [x] Production build succeeds
- [x] Architecture documented
- [x] Spreadsheet schema documented
- [x] Known issues catalogued
- [x] URL classification taxonomy defined
- [x] Performance baseline captured
- [x] Design tokens documented
- [x] Mantine → Tailwind mapping prepared
- [ ] Live URL inventory from authenticated payload (run helper script)
- [ ] Architecture changes (Phase 1+)
- [ ] Deployment (explicitly out of scope for Phase 0)

---

## Appendix: Git History

```
823c35b fix: align folder icon with card title text
d19ed39 chore: configure Mantine app for GitHub Pages deploy
17dd06d chore: bootstrap Mantine internal knowledge base and apps script backend
```
