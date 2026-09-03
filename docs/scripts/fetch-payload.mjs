#!/usr/bin/env node
/**
 * Audit helper — fetch catalog via Apps Script JSON or API proxy and classify URLs.
 *
 * Usage:
 *   node docs/scripts/fetch-payload.mjs
 *   node docs/scripts/fetch-payload.mjs --json > /tmp/kb-payload.json
 *   CATALOG_URL=https://worker.example/api/catalog node docs/scripts/fetch-payload.mjs
 */

import { classifyUrl } from '../../packages/shared/src/classifyUrl.js';

const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/a/macros/smartly.io/s/AKfycbxTZ-z2N_lCuzSTsL9gGr2VnZWJ4AJf3PC9lzKQn0OQrYjbEf3UN5HzUWRYhevUZDhl/exec';

async function fetchPayload() {
  const catalogUrl = process.env.CATALOG_URL || DEFAULT_APPS_SCRIPT_URL;
  const headers = { Accept: 'application/json' };
  if (process.env.API_KEY) {
    headers['X-API-Key'] = process.env.API_KEY;
  }

  const res = await fetch(`${catalogUrl}?ts=${Date.now()}`, {
    redirect: 'follow',
    headers,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  if (text.trim().startsWith('<!DOCTYPE') || text.includes('Sign in')) {
    throw new Error(
      'Received Google sign-in page — run while authenticated to smartly.io workspace'
    );
  }

  return JSON.parse(text);
}

async function main() {
  const jsonOnly = process.argv.includes('--json');
  const start = performance.now();
  const payload = await fetchPayload();
  const elapsedMs = Math.round(performance.now() - start);

  if (jsonOnly) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const rows = payload.rows || [];
  const urls = rows
    .filter((r) => r.url)
    .map((r) => ({
      title: r.title,
      sourceSheet: r.sourceSheet,
      url: r.url,
      linkType: r.linkType || classifyUrl(r.url).linkType,
      canPreview: r.canPreview ?? classifyUrl(r.url).canPreview,
    }));

  const byProvider = {};
  for (const item of urls) {
    byProvider[item.linkType] = (byProvider[item.linkType] || 0) + 1;
  }

  console.log('=== H5 KB Payload Summary ===');
  console.log(`apiVersion: ${payload.apiVersion}`);
  console.log(`updatedAt:  ${payload.updatedAt}`);
  console.log(`row count:  ${payload.count ?? rows.length}`);
  console.log(`fetch ms:   ${elapsedMs}`);
  console.log(`urls:       ${urls.length} / ${rows.length}`);
  console.log('\n=== Link type breakdown ===');
  console.table(byProvider);
  console.log('\n=== Sample URLs (first 30) ===');
  console.table(urls.slice(0, 30));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
