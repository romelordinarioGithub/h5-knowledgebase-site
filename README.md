# H5 Team Knowledge Base

Internal documentation portal for the Smartly H5 team.

**Stack:** React + Vite + Tailwind (`apps/web`) · Google Sheet + Apps Script · Vercel API proxy · GitHub Pages
**Production:** https://romelordinarioGithub.github.io/h5-knowledgebase-site/
**Team entry (Google Sites):** https://sites.google.com/smartly.io/h5knowledgebase

Editors: start with **[Sheet maintenance](docs/SHEET_MAINTENANCE.md)**. Operators: **[Runbook](docs/RUNBOOK.md)**.

## Docs

| Doc | Purpose |
| --- | --- |
| [docs/SHEET_MAINTENANCE.md](docs/SHEET_MAINTENANCE.md) | Add/edit rows, tags, Featured — no engineer required |
| [docs/RUNBOOK.md](docs/RUNBOOK.md) | Deploy, rollback, timeouts, cutover, uptime |
| [docs/DATA_LAYER.md](docs/DATA_LAYER.md) | Proxy, cache, API contract |
| [docs/SECURITY.md](docs/SECURITY.md) | Auth, CSP, a11y |
| [docs/PERFORMANCE.md](docs/PERFORMANCE.md) | Bundle / LCP |
| [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md) | Preview matrix + sign-off |
| [docs/PREVIEW_LIMITATIONS.md](docs/PREVIEW_LIMITATIONS.md) | Embed capability matrix |
| [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) | Phased redesign plan |
| [docs/AUDIT.md](docs/AUDIT.md) | Phase 0 audit |

## Project structure

```
apps/web/              React + Vite + Tailwind frontend
packages/shared/       SOURCE_SHEETS, URL classifier, shared types
services/apps-script/  Google Apps Script backend (JSON only — no JSONP)
services/api-proxy/    Vercel serverless API (GET /api/catalog, /api/health)
docs/                  Documentation
.github/workflows/     CI, deploy, PR preview, uptime
```

## Quick start

```bash
npm install
cp .env.example apps/web/.env.local   # optional; edit values

# Terminal 1 — API proxy (needs APPS_SCRIPT_URL; see .env.example)
npm run dev:proxy

# Terminal 2 — frontend
npm run dev
```

Open `http://localhost:5173/h5-knowledgebase-site/`.

| Variable | Where | Notes |
| --- | --- | --- |
| `VITE_CATALOG_API_URL` | frontend | Prod: full Vercel `/api/catalog` URL; local can use Vite `/api` proxy |
| `VITE_API_KEY` | frontend | Must match Vercel `API_KEY` |
| `APPS_SCRIPT_URL` | Vercel | Apps Script `/exec` URL |
| `API_KEY` | Vercel | Required in production |
| `APPS_SCRIPT_API_KEY` | Vercel | Forwarded as `?key=` to Apps Script |

## Tests

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
npm run ci          # lint + test + build + e2e
```

## CI/CD

| Trigger | Workflow | Actions |
| --- | --- | --- |
| PR / push | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | Lint, Vitest, build (+ gzip budget), Playwright |
| Push to `main` | [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) | Deploy Pages + Vercel production |
| PR (proxy paths) | [`.github/workflows/preview.yml`](.github/workflows/preview.yml) | Optional Vercel preview URL comment |
| Every 15 min | [`.github/workflows/uptime.yml`](.github/workflows/uptime.yml) | Probe `/api/health` + `/api/catalog` |

**One-time GitHub setup** (see [RUNBOOK.md](docs/RUNBOOK.md)):

1. Pages → Source: **GitHub Actions**
2. Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `VITE_API_KEY`
3. Variable: `VITE_CATALOG_API_URL=https://h5-kb-api-proxy.vercel.app/api/catalog`

Apps Script remains a **manual** deploy; bump `API_VERSION` in `services/apps-script/Code.gs` and publish a new Web App version (documented in the runbook).

### Why Vercel (not Cloudflare Wrangler)?

Smartly `@smartly.io` emails cannot create Cloudflare accounts. The proxy is Vercel; Actions deploy with the Vercel CLI instead of Wrangler.

## Deploy (manual break-glass)

1. Redeploy Apps Script from `services/apps-script/Code.gs` (new version).
2. `npm run deploy:proxy`
3. Build with production `VITE_*` env, or rely on the Deploy workflow after push to `main`.

## Cutover

Update the Google Sites link at https://sites.google.com/smartly.io/h5knowledgebase to the GitHub Pages URL. Checklist: [docs/RUNBOOK.md](docs/RUNBOOK.md#cutover-checklist-google-sites).
