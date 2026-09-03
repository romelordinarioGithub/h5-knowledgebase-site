# Performance — Phase 6 Validation

**Date measured:** 2026-09-03  
**Targets (from DEVELOPMENT_PLAN Phase 6):**
- App JS + CSS ≤ **300 KB gzipped** (excluding fonts)
- Warm-load **LCP < 2.5 s**
- Catalog fetch **p95 < 2 s**

Compare against Phase 0 baseline in [`AUDIT.md`](./AUDIT.md) §8.

---

## Bundle size

### Phase 0 baseline (Mantine)

| Asset | Raw | Gzip |
| --- | --- | --- |
| Main JS | 381.57 KB | 117.89 KB |
| Main CSS | 220.45 KB | 33.63 KB |
| **JS + CSS** | **602 KB** | **151.52 KB** |
| Montserrat fonts | ~700 KB | — |

### Phase 6 (Tailwind + current app)

Measured **2026-09-03** via `npm run build -w @h5-kb/web` (Vite gzip report). CI also fails if JS+CSS gzip (zlib) exceeds **300 KB**.

| Asset | Raw | Gzip (Vite) |
| --- | --- | --- |
| `index-*.js` (main) | 470.18 KB | 150.03 KB |
| `FaqModal-*.js` (lazy) | 28.95 KB | 11.58 KB |
| `DocPage-*.js` (lazy) | 8.30 KB | 2.90 KB |
| `index-*.css` | 37.66 KB | 8.50 KB |
| **JS + CSS total** | **545.09 KB** | **173.01 KB** |
| Montserrat fonts | ~700 KB class | — (excluded from budget) |

| Metric | Phase 0 | Phase 6 | Delta |
| --- | --- | --- | --- |
| JS + CSS gzip (excl. fonts) | 151.52 KB | **173.01 KB** | +21.5 KB (more features: router, Query, preview, Headless UI) |
| CSS gzip alone | 33.63 KB | **8.50 KB** | **−25.1 KB** (Mantine → Tailwind) |
| vs 300 KB target | — | **Pass** (≈58% of budget) | — |

**How to re-measure:**

```bash
npm run build -w @h5-kb/web
# Inspect Vite "dist/assets" lines (kB / gzip)
# Or CI step "Report bundle sizes"
```

---

## Runtime — LCP & catalog

### Method

1. Production build + `vite preview` (or staging Pages URL).
2. Chrome DevTools → Performance / Lighthouse (mobile or desktop, **Fast 3G** or **Slow 4G** optional; record both cold and warm).
3. Warm load: hard-reload once, then soft reload with HTTP cache + `localStorage` catalog cache populated.
4. Catalog timing: Network panel filter `catalog` — note TTFB and total duration over ≥20 requests; compute p95.

### Targets vs results

| Metric | Target | Phase 0 note | Phase 6 result |
| --- | --- | --- | --- |
| Warm LCP | < 2.5 s | Not instrumented (SPA analysis only) | **Local preview:** warm ≈ **52 ms**, cold ≈ **136 ms** (`apps/web/scripts/measure-lcp.mjs`, mocked catalog, 2026-09-03). Re-measure on staging before launch. |
| Catalog fetch p95 | < 2 s | Apps Script TTFB ~1.0–1.3 s (unauth) | Proxy + Apps Script; record on staging |
| Reliability | < 1% failure / 50 sequential fetches | N/A | Optional script against staging `/api/catalog` |
| Bundle JS+CSS gzip | ≤ 300 KB | 151.52 KB | **173.01 KB** — pass |

### Staging checklist (fill before launch)

| Check | Staging URL / value | Pass? | Initials / date |
| --- | --- | --- | --- |
| Warm LCP (Lighthouse) | | ☐ | |
| Catalog p95 (ms) | | ☐ | |
| 50× catalog fetch failures | | ☐ | |
| Bundle JS+CSS gzip (KB) | | ☐ | |

**Staging frontend:** `https://romelordinarioGithub.github.io/h5-knowledgebase-site/` (or PR Pages preview)  
**Staging catalog:** production/staging Vercel `/api/catalog` with valid `API_KEY` if required.

---

## Notes

- LCP is dominated by hero paint + first meaningful catalog content. Cached bootstrap (`h5-kb-catalog-v1`) should keep warm loads under target even when the network is slow.
- Fonts remain large; they are intentionally outside the gzip JS/CSS budget. Prefer subsetting if LCP is font-bound.
- Document preview iframes are **out of scope** for LCP (post-navigation on `/doc/:id`).
