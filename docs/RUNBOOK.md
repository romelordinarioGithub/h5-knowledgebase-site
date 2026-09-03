# Operations Runbook

Incidents, deploys, rollback, and cutover for the H5 Knowledge Base.

**Production frontend:** https://romelordinarioGithub.github.io/h5-knowledgebase-site/  
**Catalog API:** https://h5-kb-api-proxy.vercel.app/api/catalog  
**Health:** https://h5-kb-api-proxy.vercel.app/api/health  
**Google Sites entry:** https://sites.google.com/smartly.io/h5knowledgebase  
**Spreadsheet:** `1yfK2W_6Te_tDCl8pxFo1FGTOIsqzp-nvw-fk0foW8zA`

---

## Architecture (quick)

```
Sheet → Apps Script (JSON only) → Vercel /api/catalog → GitHub Pages SPA
```

JSONP is **removed**. Clients use `fetch()` + `X-API-Key` via the proxy only.

> **Note:** Phase 7 originally mentioned Cloudflare Workers. `@smartly.io` accounts cannot create Cloudflare projects, so the proxy stays on **Vercel**. Deploy uses the Vercel CLI in GitHub Actions (not Wrangler).

---

## Uptime monitoring

Workflow: [`.github/workflows/uptime.yml`](../.github/workflows/uptime.yml)

- Runs every **15 minutes** (+ manual `workflow_dispatch`)
- Checks `/api/health` (200) and `/api/catalog` (200 + non-empty `rows`)
- Uses secret `VITE_API_KEY` (same key the frontend ships) and optional var `UPTIME_CATALOG_URL`

**Alerting:** enable GitHub Actions failure notifications / Slack-GitHub integration on workflow `Uptime`. Optional: point an external monitor (Better Stack, UptimeRobot) at `/api/health` (no key) and a secured catalog check with the API key header.

---

## Common failures

### Site shows stale / cached data banner

1. Confirm sheet changes are saved.
2. Wait for proxy CDN TTL (~5 min) + Apps Script cache (120s). Cache key includes `API_VERSION`.
3. Click **Refresh** on the site, or hard-reload.
4. If still wrong, bump Apps Script `API_VERSION`, redeploy Web App as a **new version**, then re-check catalog:

```bash
curl -sS -H "X-API-Key: $API_KEY" \
  "https://h5-kb-api-proxy.vercel.app/api/catalog" | head -c 500
```

### Catalog timeout / 502 from proxy

1. Hit health: `curl -sS https://h5-kb-api-proxy.vercel.app/api/health`
2. Check Vercel function logs for `APPS_SCRIPT_URL` / upstream errors.
3. Cold Apps Script starts can be slow; proxy allows up to ~45s with retries. Retry once.
4. Verify Apps Script deployment is **Execute as: Me**, **Anyone**, with Script Property `API_KEY` matching Vercel `APPS_SCRIPT_API_KEY`.
5. Confirm JSONP is not being used: `?callback=test` must return JSON error, not executable JS.

### 401 Unauthorized

- Frontend `VITE_API_KEY` must match Vercel `API_KEY`.
- Redeploy frontend after rotating keys (Pages build embeds the key).

### 429 Too many requests

- Default 60 req/min/IP. Wait for `Retry-After`, or raise `RATE_LIMIT_MAX` in Vercel env and redeploy proxy.

### Deep links 404 on GitHub Pages

- Production build copies `index.html` → `404.html` for SPA routes.
- Ensure Pages is served from **GitHub Actions** (not an old orphan `gh-pages` branch without `404.html`).

### Preview blank / login inside iframe

- Expected for many domain-restricted Google docs. Use **Open Original**. Do not loosen sharing. See [PREVIEW_LIMITATIONS.md](./PREVIEW_LIMITATIONS.md).

---

## Deploy procedures

### Automated (preferred)

On every push to `main`:

| Workflow | What |
| --- | --- |
| [CI](../.github/workflows/ci.yml) | Lint, Vitest, build, Playwright |
| [Deploy](../.github/workflows/deploy.yml) | GitHub Pages (`apps/web`) + Vercel production (`services/api-proxy`) |

**Required GitHub configuration**

| Name | Type | Purpose |
| --- | --- | --- |
| `VERCEL_TOKEN` | secret | Vercel deploy token |
| `VERCEL_ORG_ID` | secret | From `services/api-proxy/.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | secret | From project.json → `projectId` |
| `VITE_API_KEY` | secret | Embedded in SPA; must match Vercel `API_KEY` |
| `VITE_CATALOG_API_URL` | variable | e.g. `https://h5-kb-api-proxy.vercel.app/api/catalog` |

Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Manual re-run: Actions → **Deploy** → **Run workflow**.

### Apps Script (manual)

`API_VERSION` in repo: see `services/apps-script/Code.gs` (currently `2026-09-03-phase7-1`).

1. Open the existing Apps Script project linked to the sheet.
2. Paste / sync `services/apps-script/Code.gs`.
3. Save.
4. **Deploy → Manage deployments → Edit** → **New version** → Deploy.
5. Confirm `apiVersion` in catalog JSON matches the constant in `Code.gs`.
6. Version tag / deployment description should mention the same `API_VERSION` string for auditability.

Details: [services/apps-script/README.md](../services/apps-script/README.md).

### Manual frontend / proxy (break-glass)

```bash
# Proxy
npm run deploy:proxy

# Frontend (legacy gh-pages CLI — prefer Actions)
VITE_CATALOG_API_URL=https://h5-kb-api-proxy.vercel.app/api/catalog \
VITE_API_KEY=... \
  npm run deploy -w @h5-kb/web
```

---

## Rollback

### Frontend

1. GitHub → Actions → **Deploy** → find last known-good run → **Re-run jobs**, **or**
2. `git revert` the bad commit on `main` and push (triggers Deploy), **or**
3. Settings → Pages → look at deployment history if available and restore prior artifact.

### API proxy

```bash
cd services/api-proxy
npx vercel ls
npx vercel rollback <deployment-url-or-id> --token "$VERCEL_TOKEN"
```

Or redeploy a previous git SHA:

```bash
git checkout <good-sha>
npm run deploy:proxy
git checkout main
```

### Apps Script

Manage deployments → point the Web App to a **previous version** (do not delete the `/exec` URL). Then verify catalog `apiVersion`.

---

## Cache clear

| Layer | How |
| --- | --- |
| Apps Script `CacheService` | Wait 120s, or bump `API_VERSION` and redeploy (new cache key) |
| Vercel CDN | Wait `s-maxage` (~300s) or redeploy proxy / purge if using Vercel cache purge |
| Browser / localStorage | Site Refresh control, or DevTools → Application → Local Storage → clear `h5-kb-catalog-v1` |

---

## Cutover checklist (Google Sites)

Update the team entry point so people land on the new SPA (not the old embed/JSONP experience).

1. [ ] Production Deploy workflow green on `main`
2. [ ] `curl` catalog returns `apiVersion` matching Apps Script + non-empty rows
3. [ ] Uptime workflow succeeds at least once
4. [ ] Open https://romelordinarioGithub.github.io/h5-knowledgebase-site/ — search, browse, `/doc/:id`, FAQ
5. [ ] Open https://sites.google.com/smartly.io/h5knowledgebase as an editor
6. [ ] Replace embed / button / link target with the GitHub Pages URL above (keep Smartly branding on the Sites shell if desired)
7. [ ] Announce to H5 team; keep old URL bookmarked for 1 week parallel observation
8. [ ] Confirm no clients call Apps Script with `?callback=` (should only be proxy → JSON)

**This step is manual** (Google Sites UI). Engineering cannot change the Sites page from this repo.

---

## Staging / PR previews

| Surface | Mechanism |
| --- | --- |
| PR quality gates | [CI](../.github/workflows/ci.yml) |
| Proxy preview | [Preview](../.github/workflows/preview.yml) comments a Vercel preview URL when `services/api-proxy` changes |
| Frontend | Use CI `web-dist` artifact or local `npm run build && npm run preview` |

---

## Security reminders

- Rotate `API_KEY` / `VITE_API_KEY` together; redeploy proxy **and** frontend.
- Keep `CORS_ORIGINS` scoped to `https://romelordinarioGithub.github.io`.
- Never commit `.env` or Vercel tokens.
- See [SECURITY.md](./SECURITY.md).
