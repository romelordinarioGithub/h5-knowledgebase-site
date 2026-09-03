# Apps Script Backend

Google Apps Script Web App that reads the H5 Knowledge Base spreadsheet and returns **JSON only** (JSONP removed).

## File

- `Code.gs` — sheet read, row normalization, URL classification, FAQ link extraction, cache, optional API key

## Setup

1. Open [script.new](https://script.new) while logged in to your workspace account.
2. Replace the default code with `services/apps-script/Code.gs`.
3. Save the project.
4. **(Recommended)** Project Settings → Script properties → add `API_KEY` with a long random secret. The Vercel proxy must send the same value as `?key=` (set `APPS_SCRIPT_API_KEY` in Vercel).
5. Deploy as Web App (required for the Vercel proxy):
   - **Execute as:** `Me`
   - **Who has access:** `Anyone` (access is gated by Script Property `API_KEY` + proxy `API_KEY`)
6. Copy the `/exec` Web App URL and set it as `APPS_SCRIPT_URL` in the Vercel API proxy (see `services/api-proxy/`).

## Update existing deployment

1. Open the existing Apps Script project (not a new blank project).
2. Replace all of `Code.gs` with the contents of `services/apps-script/Code.gs` from this repo.
3. Save (Ctrl/Cmd+S).
4. Optionally set Script Property `API_KEY` (and matching Vercel `APPS_SCRIPT_API_KEY`).
5. **Deploy → Manage deployments → Edit (pencil)** on the Web app.
6. Set **Version** to **New version**.
7. Keep **Execute as: Me** and **Who has access: Anyone**.
8. Click **Deploy**.
9. Verify through the proxy (not by opening `/exec` in a browser if `API_KEY` is set):

```bash
curl -s -H "X-API-Key: $API_KEY" "https://h5-kb-api-proxy.vercel.app/api/catalog" | head -c 400
```

You should see `"apiVersion":"2026-09-03-phase7-1"` and rows with `linkType`, `provider`, `embedUrl`, `canPreview`, and optional `featured`.

### Optional Featured column

Add a `Featured` header on any content tab. Mark rows with `Y`, `yes`, `1`, or `true`. Those rows are preferred for the Featured Articles panel; if none are marked, the frontend falls back to a random selection.

If the `/exec` URL changed, update Vercel `APPS_SCRIPT_URL` and run `npx vercel --prod` again.

## Security notes

- **No JSONP:** `?callback=` returns an error JSON body.
- **API key:** When Script Property `API_KEY` is set, requests without a matching `?key=` receive `{ "error": "Unauthorized" }`.
- Callers should go through the Vercel proxy, which attaches the key server-side so it is not exposed in the browser.
