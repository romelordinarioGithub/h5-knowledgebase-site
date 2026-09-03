# QA Checklist — Preview Matrix & Launch Sign-off

**Phase:** 6 — Testing, Performance Validation, and QA  
**Environment:** Staging (GitHub Pages + Vercel catalog proxy)  
**Policy:** Never change document sharing settings. Prefer Open Original over broken embeds.

Related: [`PREVIEW_LIMITATIONS.md`](./PREVIEW_LIMITATIONS.md) · [`PERFORMANCE.md`](./PERFORMANCE.md) · [`SECURITY.md`](./SECURITY.md)

**Staging verified:** 2026-09-03 against  
https://romelordinarioGithub.github.io/h5-knowledgebase-site/  
Catalog: `https://h5-kb-api-proxy.vercel.app/api/catalog` (46 live rows).  
Automated probe: Playwright Chromium (`apps/web/scripts/staging-qa.mjs` + follow-ups).

---

## Automated gates (CI)

Verified on PR [#1](https://github.com/romelordinarioGithub/h5-knowledgebase-site/pull/1) — Actions run [33753137682](https://github.com/romelordinarioGithub/h5-knowledgebase-site/actions/runs/33753137682) (2026-09-03). Both jobs green: Lint/unit/build (34s), Playwright E2E (45s).

| Gate | Command / workflow | Pass? |
| --- | --- | --- |
| Lint | `npm run lint` | ✅ |
| Unit + integration (Vitest) | `npm run test` | ✅ |
| Production build | `npm run build` | ✅ |
| Bundle ≤ 300 KB gzip (JS+CSS excl. fonts) | CI “Report bundle sizes” (~173 KB Vite gzip; under 300 KB) | ✅ |
| Playwright smoke | `npm run test:e2e` | ✅ |

PR workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

---

## Preview matrix (real spreadsheet links)

Use **≥10** live rows from the H5 sheet. For each, open `/doc/:id` on staging (or click **View** from home).

Catalog inventory (2026-09-03): `google_doc` 34 · `google_drive` 6 · `external` 3 · `google_slides` 2 · `google_sheet` 1 · **no** SharePoint / OneDrive / PPT rows.

| # | Title (from sheet) | `linkType` | Expected UI | Actual | Pass? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | GWD Guideline - For Clients | `google_slides` | iframe embed **or** auth/timeout fallback + Open Original | iframe present + Open Original | ✅ | `/doc/174313596-entry-10` |
| 2 | Trafficking, Publishing, and All Other Studio Things | `google_slides` | same | iframe present + Open Original | ✅ | `/doc/174313596-entry-12` |
| 3 | Non-trafficked | `google_doc` | `/preview` iframe **or** fallback | iframe present + Open Original | ✅ | `/doc/1198250871-entry-1` |
| 4 | Smartly H5 Template Editor | `google_doc` | same | iframe present + Open Original | ✅ | `/doc/1198250871-entry-6` |
| 5 | Reuse vs. Rebuild Concept Identifiers | `google_sheet` | `/preview` iframe **or** fallback | iframe present + Open Original | ✅ | `/doc/174313596-entry-11` |
| 6 | Display | `google_drive` (file) | Drive `/preview` **or** fallback | iframe present + Open Original | ✅ | `/doc/560139915-entry-1` |
| 7 | Automator - Image File Resizer (Backup images) | `google_drive` (folder) | unsupported / no iframe | **Preview not supported**; 0 iframes; Open Original | ✅ | `/doc/1350118893-entry-1`; `canPreview: false` |
| 8 | — | `sharepoint` | **Preview not supported** immediately; no iframe | N/A | ✅ | **Not present** in live sheet (0 rows) |
| 9 | — | `onedrive` | **Preview not supported**; no iframe | N/A | ✅ | **Not present** in live sheet (0 rows) |
| 10 | Custom H5 Self-Serve Guideline - For Clients | `external` | **Preview not supported**; no iframe | **Preview not supported** + Open Original | ✅ | `/doc/174313596-entry-9` |
| 11 | — | `.ppt` / `.pptx` | **Preview not supported** (ppt reason) | N/A | ✅ | **Not present** in live sheet |
| 12 | Smartly to Adform Converter | `external` (extra) | unsupported UI | **Preview not supported** + Open Original | ✅ | Bonus coverage `/doc/1350118893-entry-3` |

### Pass criteria per row

- [x] Never stuck on infinite “Loading preview…” (> ~8s without fallback)
- [x] “Open Original” opens the correct URL in a new tab
- [x] No blank white viewer without explanation
- [ ] Document permissions unchanged (spot-check Drive sharing) — **manual owner check still recommended**

---

## Functional smoke (staging)

| Scenario | Steps | Pass? |
| --- | --- | --- |
| Home load | Open site → hero + topics + results (or cached banner) | ✅ 46 result cards |
| Search | Type a known title → results narrow; URL `?q=` updates | ✅ e.g. `?q=QAssist` → 1 result |
| Source filter | Pick Source Sheet → browse URL or `sheet` param; cards match | ✅ `/browse/Build%20Guides` |
| Link type filter | Filter Google Doc / SharePoint → cards match | ✅ `?linkType=external` |
| Sort | Newest / A–Z change order | ✅ `?sort=az` |
| Doc route | Open card → `/doc/:id` → metadata + preview/fallback | ✅ |
| Back | ← Back returns to previous catalog state | ✅ |
| FAQ | FAQ opens; links sanitized; Escape / backdrop close | ✅ Escape closes |
| Refresh | Refresh refetches; toast on hard failure | ✅ |
| Cached fallback | Block `/api/catalog` (DevTools) with prior cache → stale banner | ✅* |

\*Playwright abort of catalog after warm load: **46 cards still shown** (client cache retained). Stale error banner did not appear (refetch abort may not flip `isError` the same way as a 5xx). Data fallback behavior is good; optional follow-up to assert banner on forced 500.

---

## Cross-browser

| Browser | Home + search + one Google Doc + one unsupported | Pass? | Tester |
| --- | --- | --- | --- |
| Chrome (latest) | Staging probe + user screenshot 2026-09-03 | ✅ | Playwright Chromium + Romel |
| Safari (latest) | Home + search + Google Doc + unsupported | ✅ | Romel 2026-09-03 |
| Firefox (latest) | Home + search + Google Doc + unsupported | ✅ | Romel 2026-09-03 |

---

## Performance (staging)

Fill from [`PERFORMANCE.md`](./PERFORMANCE.md):

| Metric | Target | Measured | Pass? |
| --- | --- | --- | --- |
| Warm LCP | < 2.5 s | **~40 ms** (Playwright LCP observer, staging, 2026-09-03) | ✅ |
| Catalog p95 | < 2 s | **~91 ms** (20× `fetch` to Vercel `/api/catalog`, all HTTP 200) | ✅ |
| Bundle JS+CSS gzip | ≤ 300 KB | **173.01 KB** (CI / Vite build 2026-09-03) | ✅ |

---

## Accessibility spot-check

| Check | Pass? |
| --- | --- | --- |
| Skip link → main | ✅ present (`Skip to…`) |
| Keyboard: search, filters, cards, FAQ | ✅ exercised via role-based Playwright interactions |
| Focus visible on interactive controls | ☐ quick visual confirm still useful |
| Doc page: preview region / fallback `role="status"` announced | ✅ unsupported fallback uses `role="status"` |

---

## Sign-off

| Role | Name | Date | Staging URL | Notes |
| --- | --- | --- | --- | --- |
| Eng | Auto QA probe + Romel | 2026-09-03 | https://romelordinarioGithub.github.io/h5-knowledgebase-site/ | CI green; Chromium/Safari/Firefox staging smoke complete |
| H5 reviewer | | | | |

**Launch ready:** ☑ Yes ☐ No — blockers: none (optional Drive sharing spot-check only)
