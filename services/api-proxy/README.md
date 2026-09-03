# H5 KB API Proxy (Vercel)

Edge-cached proxy for the Apps Script catalog JSON endpoint. Replaces the Cloudflare Worker path (Smartly email domains cannot create Cloudflare accounts). Use **API key + rate limiting** instead of Cloudflare Access.

## Endpoints

| Path | Method | Description |
|------|--------|-------------|
| `/api/catalog` | GET | Normalized catalog payload |
| `/api/health` | GET | Liveness check (no API key required) |

## Setup

1. Create a free Vercel account (personal GitHub/Google is fine if company email is blocked).
2. From repo root: `npm install`
3. Install / log in once: `cd services/api-proxy && npx vercel login`
4. Set env vars in the Vercel project (Dashboard → Settings → Environment Variables), or via CLI:

```bash
cd services/api-proxy
npx vercel env add APPS_SCRIPT_URL
npx vercel env add API_KEY                 # required for production
# optional:
# npx vercel env add APPS_SCRIPT_API_KEY   # must match Apps Script Script Property API_KEY
# npx vercel env add CORS_ORIGINS          # comma-separated, e.g. https://romelordinarioGithub.github.io
# npx vercel env add RATE_LIMIT_MAX        # default 60 req/min/IP
# npx vercel env add RATE_LIMIT_WINDOW_MS  # default 60000
```

5. Local: `npm run dev:proxy` (runs `vercel dev` on port 3000; script is named `proxy` to avoid Vercel’s recursive `dev` loop)
6. Production: `npm run deploy:proxy`

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `APPS_SCRIPT_URL` | Yes | Apps Script `/exec` URL (JSON mode) |
| `API_KEY` | **Yes for production** | Clients must send matching `X-API-Key` |
| `APPS_SCRIPT_API_KEY` | Recommended | Forwarded as `?key=` to Apps Script when Script Property `API_KEY` is set |
| `CORS_ORIGINS` | Recommended | Comma-separated browser origins allowed (defaults to `*` if unset) |
| `RATE_LIMIT_MAX` | No | Max requests per IP per window (default `60`) |
| `RATE_LIMIT_WINDOW_MS` | No | Rate-limit window in ms (default `60000`) |

## Caching

- CDN cache via `Cache-Control: s-maxage=300, stale-while-revalidate=600`
- Upstream fetch: 2 retries with exponential backoff, 45s timeout
- Function runtime: Node.js serverless with `maxDuration: 60` (Edge timed out on Apps Script cold starts)

## Security headers

Responses include `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and `Permissions-Policy`. See `docs/SECURITY.md`.

## First-time deploy (detailed)

```bash
cd services/api-proxy
npx vercel login
npx vercel            # link/create project (answer prompts)
npx vercel env add APPS_SCRIPT_URL production
# paste: https://script.google.com/a/macros/smartly.io/s/.../exec
npx vercel env add API_KEY production
npx vercel --prod
```

After deploy, note the URL (e.g. `https://h5-kb-api-proxy.vercel.app`) and set frontend:

```
VITE_CATALOG_API_URL=https://h5-kb-api-proxy.vercel.app/api/catalog
VITE_API_KEY=<same as Vercel API_KEY>
```
