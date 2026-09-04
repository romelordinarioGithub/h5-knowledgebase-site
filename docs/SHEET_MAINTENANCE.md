# Sheet Maintenance Guide

How to keep the H5 Knowledge Base catalog up to date **without engineering help**.

**Spreadsheet:** [H5 Knowledge Base Sheet](https://docs.google.com/spreadsheets/d/1yfK2W_6Te_tDCl8pxFo1FGTOIsqzp-nvw-fk0foW8zA)  
**Live site:** https://romelordinarioGithub.github.io/h5-knowledgebase-site/

Changes in the sheet appear on the site after cache refresh (typically within a few minutes; see [RUNBOOK.md](./RUNBOOK.md) if they do not).

---

## Tabs (source sheets)

Do **not** rename these tabs. The backend reads them by name + GID:

| Tab name | What belongs here |
| --- | --- |
| Build Guides | Delivery / build how-tos |
| Master Templates | Template catalogs |
| Studio Setup | Studio setup types |
| Process Docs | Process documentation |
| Internal Tools | Internal tools and converters |

FAQ content lives in a separate FAQ area of the sheet (linked from the site FAQ modal). Prefer editing existing FAQ cells rather than inventing a new layout.

---

## Adding a new document row

1. Open the correct tab for the content type.
2. Add a new row under the header row (row 1).
3. Fill at least:
   - **Title** (column name depends on the tab — see below)
   - **URL** (one of the accepted link column names)
4. Optionally fill **Last Update**, **Author(s)**, **tags**, and **Featured**.
5. Save. Wait 2–5 minutes, then hard-refresh the site (or use the Refresh control).

### Title column (pick the one for your tab)

| Tab | Title header |
| --- | --- |
| Build Guides | `Delivery Type` |
| Master Templates | `Template Name` |
| Studio Setup | `Studio Setup Type` |
| Process Docs | `Process Doc` |
| Internal Tools | `Tool Name` |

### URL column

Use any of these headers (first match wins): `Doc Guide`, `Url Links`, `Links`, or `Link`.

Paste a full `https://` URL (Google Doc, Slides, Sheet, Drive file, or external).

### Metadata

| Header | Format | Notes |
| --- | --- | --- |
| `Last Update` | Date or readable date string | Used for “Newest” sort when parseable |
| `Authors` / `Author` | Free text | Shown on cards and detail |
| `tags` | Comma-separated | e.g. `studio,q4,trafficking` — lowercased automatically |
| `Featured` | `Y`, `yes`, `1`, or `true` | Marks the row for the Featured Articles panel |

Empty title **and** empty URL **and** empty authors **and** no tags → row is skipped.

---

## Featured articles

1. Add a `Featured` column header on the tab if it is missing.
2. Mark preferred rows with `Y` (or `yes` / `1` / `true`).
3. If **no** rows are featured across the catalog, the site shows a random selection instead.

Use Featured sparingly (a handful of high-value docs).

---

## Tags tips

- Keep tags short and consistent (`studiosetup`, not `Studio Setup!!!`).
- Prefer shared vocabulary so search and filters stay useful.
- Tags are not a substitute for putting the row on the correct tab.

---

## Adding a brand-new tab (needs an engineer)

New tabs are **not** auto-discovered. To add one:

1. Create the tab in the spreadsheet with a clear header row.
2. Ask an engineer to register `{ name, gid }` in both:
   - `packages/shared/src/sourceSheets.js`
   - `services/apps-script/Code.gs` (`SOURCE_SHEETS`)
3. Engineer bumps `API_VERSION`, redeploys Apps Script, and verifies `/api/catalog`.

Until that ships, rows on an unregistered tab will not appear on the site.

---

## Preview behavior (what editors should expect)

| Link type | In-app preview |
| --- | --- |
| Google Docs / Sheets / Slides / Drive files | Attempted when allowed; may fall back if auth/CSP blocks |
| Drive folders, SharePoint, OneDrive, PPT, arbitrary external | **Preview not supported** — “Open Original” still works |

**Never** change document sharing to “Anyone with the link” to force preview. Internal permissions stay as they are. See [PREVIEW_LIMITATIONS.md](./PREVIEW_LIMITATIONS.md).

---

## FAQ content

The **FAQ** tab uses a structured block model (preferred):

| Column | Purpose |
| --- | --- |
| FAQ ID | Groups rows into one accordion item (e.g. `FAQ-001`) |
| Question | Accordion title |
| Block Order | Sort order within that FAQ (1, 2, 3…) |
| Block Type | `heading`, `paragraph`, `key_value`, `callout`, `list`, or `link` |
| Title | Label / callout heading / link label |
| Content | Body text, value, list lines (newline-separated), or URL |
| Variant | Optional hint only: `warning`, `info`, `neutral`, `bullet`, `ordered`, `highlight` |

For **list** blocks, either put all items in one Content cell (newline-separated) **or** use one row per item with the same Variant (`bullet` or `ordered`). Consecutive `list` rows are merged into one list in the UI so ordered lists number 1, 2, 3… correctly.

Do **not** put HTML, CSS, SVG, or icon class names in cells. The site picks icons and styling from Block Type + Variant.

Legacy tabs with only **Question** / **Answer** still work (rendered as a single paragraph).

Update FAQ answers so they mention:

- Browse and search on the knowledge base site
- Opening docs in-app when preview works
- Using **Open Original** when preview is blocked

Avoid telling people to use the old JSONP / script-tag load path — it is removed.

---

## Checklist before you leave the sheet

- [ ] Correct tab
- [ ] Title + https URL filled
- [ ] Tags sensible (if any)
- [ ] Featured only if intentional
- [ ] Spot-check the live site after a few minutes
