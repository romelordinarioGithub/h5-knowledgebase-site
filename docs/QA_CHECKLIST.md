# QA Checklist — Preview Matrix & Launch Sign-off

**Phase:** 6 — Testing, Performance Validation, and QA  
**Environment:** Staging (GitHub Pages + Vercel catalog proxy)  
**Policy:** Never change document sharing settings. Prefer Open Original over broken embeds.

Related: [`PREVIEW_LIMITATIONS.md`](./PREVIEW_LIMITATIONS.md) · [`PERFORMANCE.md`](./PERFORMANCE.md) · [`SECURITY.md`](./SECURITY.md)

---

## Automated gates (CI)

| Gate | Command / workflow | Pass? |
| --- | --- | --- |
| Lint | `npm run lint` | ☐ |
| Unit + integration (Vitest) | `npm run test` | ☐ |
| Production build | `npm run build` | ☐ |
| Bundle ≤ 300 KB gzip (JS+CSS excl. fonts) | CI “Report bundle sizes” | ☐ |
| Playwright smoke | `npm run test:e2e` | ☐ |

PR workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

---

## Preview matrix (real spreadsheet links)

Use **≥10** live rows from the H5 sheet. For each, open `/doc/:id` on staging (or click **View** from home).

| # | Title (from sheet) | `linkType` | Expected UI | Actual | Pass? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | | `google_slides` | iframe embed **or** auth/timeout fallback + Open Original | | ☐ | |
| 2 | | `google_slides` | same | | ☐ | |
| 3 | | `google_doc` | `/preview` iframe **or** fallback | | ☐ | |
| 4 | | `google_doc` | same | | ☐ | |
| 5 | | `google_sheet` | `/preview` iframe **or** fallback | | ☐ | |
| 6 | | `google_drive` (file/PDF) | Drive `/preview` **or** fallback | | ☐ | |
| 7 | | `google_drive` (folder) | unsupported / no iframe | | ☐ | |
| 8 | | `sharepoint` | **Preview not supported** immediately; no iframe | | ☐ | |
| 9 | | `onedrive` | **Preview not supported**; no iframe | | ☐ | |
| 10 | | `external` | **Preview not supported**; no iframe | | ☐ | |
| 11 | | `.ppt` / `.pptx` if present | **Preview not supported** (ppt reason) | | ☐ | |
| 12 | | (optional) domain-restricted Google Doc | timeout → auth messaging; Open Original works | | ☐ | |

### Pass criteria per row

- [ ] Never stuck on infinite “Loading preview…” (> ~8s without fallback)
- [ ] “Open Original” opens the correct URL in a new tab
- [ ] No blank white viewer without explanation
- [ ] Document permissions unchanged (spot-check Drive sharing)

---

## Functional smoke (staging)

| Scenario | Steps | Pass? |
| --- | --- | --- |
| Home load | Open site → hero + topics + results (or cached banner) | ☐ |
| Search | Type a known title → results narrow; URL `?q=` updates | ☐ |
| Source filter | Pick Source Sheet → browse URL or `sheet` param; cards match | ☐ |
| Link type filter | Filter Google Doc / SharePoint → cards match | ☐ |
| Sort | Newest / A–Z change order | ☐ |
| Doc route | Open card → `/doc/:id` → metadata + preview/fallback | ☐ |
| Back | ← Back returns to previous catalog state | ☐ |
| FAQ | FAQ opens; links sanitized; Escape / backdrop close | ☐ |
| Refresh | Refresh refetches; toast on hard failure | ☐ |
| Cached fallback | Block `/api/catalog` (DevTools) with prior cache → stale banner | ☐ |

---

## Cross-browser

| Browser | Home + search + one Google Doc + one unsupported | Pass? | Tester |
| --- | --- | --- | --- |
| Chrome (latest) | | ☐ | |
| Safari (latest) | | ☐ | |
| Firefox (latest) | | ☐ | |

---

## Performance (staging)

Fill from [`PERFORMANCE.md`](./PERFORMANCE.md):

| Metric | Target | Measured | Pass? |
| --- | --- | --- | --- |
| Warm LCP | < 2.5 s | | ☐ |
| Catalog p95 | < 2 s | | ☐ |
| Bundle JS+CSS gzip | ≤ 300 KB | | ☐ |

---

## Accessibility spot-check

| Check | Pass? |
| --- | --- | --- |
| Skip link → main | ☐ |
| Keyboard: search, filters, cards, FAQ | ☐ |
| Focus visible on interactive controls | ☐ |
| Doc page: preview region / fallback `role="status"` announced | ☐ |

---

## Sign-off

| Role | Name | Date | Staging URL | Notes |
| --- | --- | --- | --- | --- |
| Eng | | | | |
| H5 reviewer | | | | |

**Launch ready:** ☐ Yes ☐ No — blockers: ________________
