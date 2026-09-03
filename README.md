# H5 Team Knowledge Base

React + Vite + Tailwind CSS frontend for the H5 Team internal documentation portal. Data is sourced from a Google Sheet via a Google Apps Script Web App, proxied through a Vercel Edge Function for reliable JSON delivery.

**Docs:**
- [`docs/AUDIT.md`](docs/AUDIT.md) — Phase 0 audit (architecture, schema, known issues)
- [`docs/DATA_LAYER.md`](docs/DATA_LAYER.md) — Phase 1 data layer (proxy, cache, API contract)
- [`docs/SECURITY.md`](docs/SECURITY.md) — Phase 5 security + accessibility checklist
- [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) — Phase 6 bundle / LCP vs Phase 0 baseline
- [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md) — preview matrix + staging sign-off
- [`docs/DEVELOPMENT_PLAN.md`](docs/DEVELOPMENT_PLAN.md) — phased redesign plan
- [`docs/PREVIEW_LIMITATIONS.md`](docs/PREVIEW_LIMITATIONS.md) — document preview capability matrix

## Project Structure

```
apps/web/              — React + Vite + Tailwind frontend
packages/shared/       — SOURCE_SHEETS, URL classifier, shared types
services/apps-script/  — Google Apps Script backend
services/api-proxy/    — Vercel Edge API (GET /api/catalog)
docs/                  — documentation and helper scripts
```

## Quick Start

```bash
npm install

# Terminal 1 — API proxy (set APPS_SCRIPT_URL via vercel env or .env)
npm run dev:proxy

# Terminal 2 — frontend
npm run dev
```

Open `http://localhost:5173/h5-knowledgebase-site/`.

Copy [`.env.example`](.env.example) to configure catalog API URL and API key (`API_KEY` is required for production).

## Tests

```bash
npm run lint          # ESLint
npm run test          # Vitest unit + integration
npm run build         # production build (required before E2E locally if dist missing)
npm run test:e2e      # Playwright smoke (builds if needed when CI unset)
npm run ci            # lint + test + build + e2e
```

PR CI runs lint, Vitest, build (with gzip budget check), and Playwright.

## Deploy (manual)

1. Deploy Apps Script from `services/apps-script/Code.gs`
2. Deploy API proxy: `npm run deploy:proxy` (Vercel — see `services/api-proxy/README.md`)
3. Build frontend with `VITE_CATALOG_API_URL` pointing at the Vercel `/api/catalog` URL
4. `npm run deploy -w @h5-kb/web` — pushes to `gh-pages`

Production URL: `https://romelordinarioGithub.github.io/h5-knowledgebase-site/`
