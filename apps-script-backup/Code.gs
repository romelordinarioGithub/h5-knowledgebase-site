const SPREADSHEET_ID = "1yfK2W_6Te_tDCl8pxFo1FGTOIsqzp-nvw-fk0foW8zA";
const API_VERSION = "2026-03-26-faq-link-fix-1";
const CACHE_TTL_SECONDS = 120;
const CACHE_KEY = `kb_payload:${API_VERSION}:${SPREADSHEET_ID}`;
const SOURCE_SHEETS = [
  { name: "Build Guides", gid: "1198250871" },
  { name: "Master Templates", gid: "560139915" },
  { name: "Studio Setup", gid: "667355349" },
  { name: "Process Docs", gid: "174313596" },
  { name: "Internal Tools", gid: "1350118893" },
];

function doGet(e) {
  const safeJson = getCachedPayloadJson();
  const callback = e && e.parameter ? String(e.parameter.callback || "").trim() : "";

  if (callback && /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(callback)) {
    const body = `${callback}(${safeJson});`;
    return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(safeJson).setMimeType(ContentService.MimeType.JSON);
}

function getCachedPayloadJson() {
  const cache = CacheService.getScriptCache();

  try {
    const cached = cache.get(CACHE_KEY);
    if (cached) return cached;
  } catch (error) {
    // Continue without cache.
  }

  const safeJson = buildPayloadJson();

  try {
    if (safeJson && safeJson.length <= 95000) {
      cache.put(CACHE_KEY, safeJson, CACHE_TTL_SECONDS);
    }
  } catch (error) {
    // Cache failures should not block response.
  }

  return safeJson;
}

function buildPayloadJson() {
  const output = buildPayloadObject();
  return JSON.stringify(output)
    .replace(/\u2028/g, "\u2028")
    .replace(/\u2029/g, "\u2029");
}

function buildPayloadObject() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const rows = [];
  const faqs = readFaqItems(spreadsheet);

  SOURCE_SHEETS.forEach((source) => {
    const sheet = spreadsheet.getSheets().find((s) => String(s.getSheetId()) === source.gid);
    if (!sheet) return;

    const values = sheet.getDataRange().getDisplayValues();
    if (values.length < 2) return;

    const headers = values[0] || [];
    if (!headers.length) return;

    values.slice(1).forEach((entry, index) => {
      const row = {};
      headers.forEach((header, i) => {
        row[header] = entry[i] || "";
      });

      const tags = String(row.tags || "")
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);

      const title = pickFirst(row, [
        "Delivery Type",
        "Template Name",
        "Studio Setup Type",
        "Process Doc",
        "Tool Name",
      ]);
      const lastUpdate = pickFirst(row, ["Last Update"]);
      const url = pickFirst(row, ["Url Links", "Links", "Doc Guide", "Link"]);
      const authors = pickFirst(row, ["Authors", "Author"]);
      const timestamp = Date.parse(lastUpdate);

      const normalized = {
        id: `${source.gid}-entry-${index + 1}`,
        sourceSheet: source.name,
        title: title,
        url: url,
        lastUpdate: lastUpdate,
        lastUpdateStamp: isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp,
        authors: authors,
        tags: tags,
      };

      if (normalized.title || normalized.url || normalized.authors || normalized.tags.length) {
        rows.push(normalized);
      }
    });
  });

  return {
    apiVersion: API_VERSION,
    updatedAt: new Date().toISOString(),
    count: rows.length,
    rows: rows,
    faqs: faqs,
  };
}


function pickFirst(row, candidates) {
  if (!row || typeof row !== "object") return "";
  if (!Array.isArray(candidates) || !candidates.length) return "";

  for (let i = 0; i < candidates.length; i += 1) {
    const key = candidates[i];
    const value = String(row[key] || "").trim();
    if (value) return value;
  }
  return "";
}

function readFaqItems(spreadsheet) {
  const sheet = spreadsheet.getSheetByName("FAQ");
  if (!sheet) return [];

  const values = sheet.getDataRange().getDisplayValues();
  const richValues = sheet.getDataRange().getRichTextValues();
  const formulas = sheet.getDataRange().getFormulas();
  if (!values || values.length < 2) return [];

  const headers = (values[0] || []).map((header) => String(header || "").trim());
  const headerIndexByLower = new Map();
  headers.forEach((header, index) => {
    if (header) headerIndexByLower.set(header.toLowerCase(), index);
  });

  const questionKeys = [
    "question",
    "faq question",
    "faq",
    "questions",
    "q",
  ];
  const answerKeys = [
    "answer",
    "faq answer",
    "response",
    "details",
    "a",
  ];
  const questionIndex = findHeaderIndex(headerIndexByLower, questionKeys);
  const answerIndex = findHeaderIndex(headerIndexByLower, answerKeys);
  const apiLinkSpansByRow = answerIndex > -1
    ? readFaqLinkSpansFromSheetsApi(spreadsheet.getId(), sheet.getName(), answerIndex)
    : [];

  const out = [];

  values.slice(1).forEach((entry, rowOffset) => {
    const richEntry = richValues[rowOffset + 1] || [];
    const question = questionIndex > -1
      ? String(entry[questionIndex] || "").trim()
      : readCell(entry, headerIndexByLower, questionKeys) || String(entry[0] || "").trim();
    const answer = answerIndex > -1
      ? String(entry[answerIndex] || "").trim()
      : readCell(entry, headerIndexByLower, answerKeys) || String(entry[1] || "").trim();
    const richAnswer = answerIndex > -1 ? richEntry[answerIndex] : null;
    const formulaEntry = formulas[rowOffset + 1] || [];
    const answerFormula = answerIndex > -1 ? String(formulaEntry[answerIndex] || "") : "";
    const answerLinkSpans = apiLinkSpansByRow[rowOffset] || [];
    const answerHtml = richTextToHtml(richAnswer, answer, answerFormula, answerLinkSpans);

    if (question && answer) {
      out.push({
        question: question,
        answer: answer,
        answerHtml: answerHtml,
      });
    }
  });

  return out.slice(0, 20);
}

function readFaqLinkSpansFromSheetsApi(spreadsheetId, sheetName, answerIndex) {
  const id = String(spreadsheetId || "").trim();
  const name = String(sheetName || "").trim();
  if (!id || !name || answerIndex < 0) return [];

  try {
    const answerColumn = columnLetterFromIndex(answerIndex);
    const range = `${name}!${answerColumn}:${answerColumn}`;
    const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}?includeGridData=true&ranges=${encodeURIComponent(range)}`;
    const response = UrlFetchApp.fetch(endpoint, {
      method: "get",
      muteHttpExceptions: true,
      headers: {
        Authorization: `Bearer ${ScriptApp.getOAuthToken()}`,
      },
    });

    const status = response.getResponseCode();
    if (status < 200 || status >= 300) return [];

    const payload = JSON.parse(response.getContentText() || "{}");
    const rowData = (((payload.sheets || [])[0] || {}).data || [])[0];
    const rows = (rowData && rowData.rowData) || [];
    if (!rows.length) return [];

    const spansByRow = [];
    for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
      const values = (rows[rowIndex] && rows[rowIndex].values) || [];
      const cell = values[0] || {};
      spansByRow.push(extractCellLinkSpans(cell));
    }
    return spansByRow;
  } catch (error) {
    return [];
  }
}


function columnLetterFromIndex(index) {
  let n = Number(index) + 1;
  let out = "";

  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }

  return out || "A";
}


function extractCellLinkSpans(cell) {
  const out = [];
  if (!cell) return out;

  const text = String(cell.formattedValue || "");
  if (!text) return out;

  const runs = Array.isArray(cell.textFormatRuns) ? cell.textFormatRuns : [];
  if (runs.length) {
    for (let i = 0; i < runs.length; i += 1) {
      const run = runs[i] || {};
      const nextRun = runs[i + 1] || null;
      const start = Number(run.startIndex || 0);
      const end = nextRun ? Number(nextRun.startIndex || text.length) : text.length;
      const uri = String((((run.format || {}).link || {}).uri) || "").trim();
      if (!uri || end <= start) continue;
      out.push({ start: start, end: end, url: uri });
    }
  }

  if (!out.length) {
    const wholeCellUri = String(cell.hyperlink || "").trim();
    if (wholeCellUri) {
      out.push({ start: 0, end: text.length, url: wholeCellUri });
    }
  }

  return out;
}

function findHeaderIndex(headerIndexByLower, candidateKeys) {
  for (let i = 0; i < candidateKeys.length; i += 1) {
    const index = headerIndexByLower.get(String(candidateKeys[i] || "").toLowerCase());
    if (index !== undefined) return index;
  }
  return -1;
}

function readCell(entry, headerIndexByLower, candidateKeys) {
  for (let i = 0; i < candidateKeys.length; i += 1) {
    const key = candidateKeys[i].toLowerCase();
    const index = headerIndexByLower.get(key);
    if (index === undefined) continue;
    const value = String(entry[index] || "").trim();
    if (value) return value;
  }
  return "";
}

function richTextToHtml(richValue, fallbackText, formulaText, linkSpans) {
  if (!richValue) {
    const baseHtml = plainTextToHtml(fallbackText);
    return applyHyperlinkFormulaFallback(baseHtml, formulaText);
  }

  const text = String(richValue.getText ? richValue.getText() : fallbackText || "");
  if (!text.trim()) return "";

  // More reliable path: build styled/link segments from per-offset metadata.
  const offsetHtml = richTextToHtmlByOffsets(richValue, text, linkSpans);
  if (offsetHtml) {
    return applyHyperlinkFormulaFallback(offsetHtml, formulaText);
  }

  const runs = richValue.getRuns ? richValue.getRuns() : [];
  if (!runs || !runs.length) {
    return plainTextToHtml(text);
  }

  let cursor = 0;
  let carryLink = "";
  const html = runs.map((run) => {
    const runText = String(run.getText ? run.getText() : "");
    let runLink = resolveRunLinkUrl(richValue, run, cursor, runText.length, linkSpans);

    if (!runText) {
      if (runLink) carryLink = runLink;
      return "";
    }

    if (!runLink && carryLink) {
      runLink = carryLink;
      carryLink = "";
    }

    let output = plainTextToHtml(runText);
    const style = run.getTextStyle ? run.getTextStyle() : null;

    if (runLink) {
      const safeHref = normalizeUrl(runLink);
      if (safeHref) {
        output = `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer">${output}</a>`;
      }
    }

    if (style) {
      if (style.isBold && style.isBold()) {
        output = `<strong>${output}</strong>`;
      }
      if (style.isItalic && style.isItalic()) {
        output = `<em>${output}</em>`;
      }
      if (style.isUnderline && style.isUnderline()) {
        output = `<u>${output}</u>`;
      }
    }
    cursor += runText.length;
    return output;
  }).join("");

  const baseHtml = html || plainTextToHtml(text);
  return applyHyperlinkFormulaFallback(baseHtml, formulaText);
}

function richTextToHtmlByOffsets(richValue, text, linkSpans) {
  const source = String(text || "");
  if (!source) return "";

  const segments = [];
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const link = resolveLinkAtOffset(richValue, i, linkSpans);
    const style = resolveStyleAtOffset(richValue, i);
    const key = `${style.bold ? 1 : 0}|${style.italic ? 1 : 0}|${style.underline ? 1 : 0}|${link}`;
    const last = segments[segments.length - 1];

    if (last && last.key === key) {
      last.text += ch;
    } else {
      segments.push({
        key: key,
        text: ch,
        link: link,
        bold: style.bold,
        italic: style.italic,
        underline: style.underline,
      });
    }
  }

  const html = segments.map((segment) => {
    let out = escapeHtml(segment.text).replace(/\r\n?/g, "\n").replace(/\n/g, "<br>");

    if (segment.link) {
      const safeHref = normalizeUrl(segment.link);
      if (safeHref) {
        out = `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer">${out}</a>`;
      }
    }
    if (segment.bold) out = `<strong>${out}</strong>`;
    if (segment.italic) out = `<em>${out}</em>`;
    if (segment.underline) out = `<u>${out}</u>`;
    return out;
  }).join("");

  return html || "";
}

function resolveLinkAtOffset(richValue, offset, linkSpans) {
  if (!richValue) return "";

  const probes = [
    () => richValue.getLinkUrl(offset, offset + 1),
    () => richValue.getLinkUrl(offset, offset),
    () => richValue.getLinkUrl(offset),
  ];

  for (let i = 0; i < probes.length; i += 1) {
    try {
      const candidate = String(probes[i]() || "").trim();
      if (candidate) return candidate;
    } catch (error) {
      // Continue probing.
    }
  }

  const style = resolveStyleAtOffset(richValue, offset);
  if (style && style.link) return style.link;

  const spans = Array.isArray(linkSpans) ? linkSpans : [];
  for (let i = 0; i < spans.length; i += 1) {
    const span = spans[i] || {};
    const start = Number(span.start);
    const end = Number(span.end);
    const url = String(span.url || "").trim();
    if (!url) continue;
    if (offset >= start && offset < end) return url;
  }

  return "";
}

function resolveStyleAtOffset(richValue, offset) {
  let textStyle = null;
  const styleProbes = [
    () => richValue.getTextStyle(offset, offset + 1),
    () => richValue.getTextStyle(offset, offset),
    () => richValue.getTextStyle(offset),
  ];

  for (let i = 0; i < styleProbes.length; i += 1) {
    try {
      const candidate = styleProbes[i]();
      if (candidate) {
        textStyle = candidate;
        break;
      }
    } catch (error) {
      // Continue probing.
    }
  }

  if (!textStyle) {
    return { bold: false, italic: false, underline: false, link: "" };
  }

  const bold = !!(textStyle.isBold && textStyle.isBold());
  const italic = !!(textStyle.isItalic && textStyle.isItalic());
  const underline = !!(textStyle.isUnderline && textStyle.isUnderline());
  const link = textStyle.getLinkUrl ? String(textStyle.getLinkUrl() || "").trim() : "";
  return { bold: bold, italic: italic, underline: underline, link: link };
}

function resolveRunLinkUrl(richValue, run, startOffset, runLength, linkSpans) {
  let link = "";

  if (run && run.getLinkUrl) {
    try {
      link = String(run.getLinkUrl() || "").trim();
    } catch (error) {
      link = "";
    }
  }
  if (link) return link;

  if (run && run.getTextStyle) {
    try {
      const runStyle = run.getTextStyle();
      if (runStyle && runStyle.getLinkUrl) {
        link = String(runStyle.getLinkUrl() || "").trim();
      }
    } catch (error) {
      link = "";
    }
  }
  if (link) return link;

  if (richValue && richValue.getLinkUrl) {
    const endExclusive = startOffset + runLength;
    const endInclusive = Math.max(startOffset, endExclusive - 1);
    const probes = [
      () => richValue.getLinkUrl(startOffset, endExclusive),
      () => richValue.getLinkUrl(startOffset, endInclusive),
      () => richValue.getLinkUrl(startOffset),
      () => richValue.getLinkUrl(),
    ];

    for (let i = 0; i < probes.length; i += 1) {
      try {
        const candidate = String(probes[i]() || "").trim();
        if (candidate) return candidate;
      } catch (error) {
        // Ignore unsupported signatures and continue probing.
      }
    }
  }

  if (richValue && richValue.getTextStyle) {
    const endExclusive = startOffset + runLength;
    const endInclusive = Math.max(startOffset, endExclusive - 1);
    const styleProbes = [
      () => richValue.getTextStyle(startOffset, endExclusive),
      () => richValue.getTextStyle(startOffset, endInclusive),
      () => richValue.getTextStyle(startOffset),
      () => richValue.getTextStyle(),
    ];

    for (let i = 0; i < styleProbes.length; i += 1) {
      try {
        const textStyle = styleProbes[i]();
        if (!textStyle || !textStyle.getLinkUrl) continue;
        const candidate = String(textStyle.getLinkUrl() || "").trim();
        if (candidate) return candidate;
      } catch (error) {
        // Ignore unsupported signatures and continue probing.
      }
    }
  }

  if (Array.isArray(linkSpans) && runLength > 0) {
    const runEnd = startOffset + runLength;
    for (let i = 0; i < linkSpans.length; i += 1) {
      const span = linkSpans[i] || {};
      const start = Number(span.start);
      const end = Number(span.end);
      const url = String(span.url || "").trim();
      if (!url) continue;
      if (start < runEnd && end > startOffset) return url;
    }
  }

  return "";
}

function plainTextToHtml(text) {
  return autoLinkPlainText(String(text || ""))
    .replace(/\r\n?/g, "\n")
    .replace(/\n/g, "<br>");
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function autoLinkPlainText(text) {
  const source = String(text || "");
  const pattern = /((?:https?:\/\/)?(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}(?:\/[^\s<]*)?)/g;
  const parts = source.split(pattern);

  return parts.map((part, index) => {
    if (index % 2 === 0) return escapeHtml(part);

    const safeHref = normalizeUrl(part);
    if (!safeHref) return escapeHtml(part);

    return `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(part)}</a>`;
  }).join("");
}

function normalizeUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+(?:\/[^\s<]*)?$/i.test(raw)) return `https://${raw}`;
  return "";
}

function applyHyperlinkFormulaFallback(html, formulaText) {
  const formula = String(formulaText || "").trim();
  if (!formula || /<a\s/i.test(html)) return html;

  const pattern = /HYPERLINK\(\s*"([^"]+)"\s*[,;]\s*"([^"]+)"\s*\)/gi;
  let result = html;
  let match;

  while ((match = pattern.exec(formula)) !== null) {
    const rawUrl = String(match[1] || "").trim();
    const label = String(match[2] || "").trim();
    const safeHref = normalizeUrl(rawUrl);
    if (!safeHref || !label) continue;

    const escapedLabel = escapeHtml(label);
    const linkHtml = `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer">${escapedLabel}</a>`;
    result = result.replace(escapedLabel, linkHtml);
  }

  return result;
}
