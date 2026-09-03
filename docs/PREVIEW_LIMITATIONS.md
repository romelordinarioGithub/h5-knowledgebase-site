# Document Preview Limitations

**Phase:** 4 — Document Preview (Capability-Aware)  
**Policy:** Never change document sharing settings. Never require “Anyone with the link.” Internal docs stay internal.

---

## What we attempt

| `linkType` | Embed URL pattern | In-app iframe? |
| --- | --- | --- |
| `google_slides` | `…/presentation/d/{id}/embed?start=false&loop=false…` | Yes, when ID validates |
| `google_doc` | `…/document/d/{id}/preview` | Yes |
| `google_sheet` | `…/spreadsheets/d/{id}/preview` | Yes |
| `google_drive` (file) | `…/file/d/{id}/preview` | Yes when classifier provides embed URL |
| `sharepoint` / `onedrive` | — | **No** — skip iframe |
| PowerPoint (`.ppt` / `.pptx` / Office PPT hosts) | — | **No** — skip iframe |
| `external` / unknown / Drive folders | — | **No** |

Embed URLs are built from the shared URL classifier (`packages/shared` / Apps Script) and re-validated on the client against an allowlist for `docs.google.com` and `drive.google.com` only.

---

## Why previews fail

### Framing headers and CSP

Google and Microsoft often send `X-Frame-Options` and/or CSP `frame-ancestors` that restrict which parents may embed the document. Our static host (e.g. GitHub Pages) is usually **not** on that allowlist for private/domain content.

Cross-origin iframes cannot be inspected for those headers from JavaScript (no reliable CORS HEAD). Failure detection is therefore:

1. **Do not attempt** known-unsupported providers (SharePoint, OneDrive, PPT, external).
2. **8s load timeout** → show fallback (`auth_required` messaging for Google types).
3. **iframe `onError`** → `error` fallback with “Open Original”.
4. **`onLoad`** is optimistic — a login wall or empty shell can still fire `load`. Users always keep an **Open Original** control.

### Authentication

Domain-restricted Google files may render a sign-in prompt inside the iframe when the browser session lacks access. We do **not** make the file public to “fix” preview. After timeout (or when the user prefers), open the original URL in a top-level tab where normal Google auth works.

### Microsoft / SharePoint

SharePoint and OneDrive set `frame-ancestors` that exclude arbitrary third-party origins. Embedding produces a blank or blocked frame. We skip the iframe entirely and show **Preview not supported** + Open Original.

---

## App-side controls

- **iframe `sandbox`:** `allow-scripts allow-same-origin allow-popups allow-forms` (enough for Google embed players; still no top-level navigation privilege beyond sandbox rules).
- **CSP `frame-src`:** only `https://docs.google.com` and `https://drive.google.com`.
- **No permission changes:** catalog and preview code never call Drive/Docs sharing APIs to widen access.

---

## Optional: Apps Script PDF export fallback (not shipped)

If Slides iframes fail consistently for domain users, a future enhancement could:

1. Apps Script (or a proxy) call `Drive.Files.export` / equivalent for a presentation the **service** can already read.
2. Stream PDF bytes to the browser.
3. Render with PDF.js in-app.

### Security tradeoffs

| Approach | Tradeoff |
| --- | --- |
| User-delegated OAuth export | Correct ACL story; heavier client auth UX |
| Domain-wide service account | Must **not** broaden file ACLs; only export files the account already can open; audit logging required |
| Caching exported PDFs | Retention, access revocation lag, and PII/confidentiality risk |

**Recommendation:** Prefer failing closed to Open Original over exporting. If export is added later, document which identity reads the file, forbid ACL mutation, and expire cached PDFs quickly.

---

## Manual test matrix

Use real spreadsheet rows covering:

1. Google Slides — expect embed or auth/timeout fallback  
2. Google Doc — `/preview` or fallback  
3. Google Sheet — `/preview` or fallback  
4. Drive PDF — `/preview` or fallback  
5. SharePoint — immediate unsupported UI (no iframe)  
6. External URL — immediate unsupported UI (no iframe)

Acceptance: working preview when the provider allows it; clean fallback otherwise; no blank stuck viewer; no document made public.
