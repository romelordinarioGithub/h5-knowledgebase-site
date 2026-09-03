/**
 * Local LCP probe against vite preview (catalog mocked).
 * Usage (from apps/web after build): node scripts/measure-lcp.mjs
 */
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = 'http://127.0.0.1:4173/h5-knowledgebase-site/';
const catalog = {
  apiVersion: 'perf-1',
  updatedAt: new Date().toISOString(),
  count: 1,
  rows: [
    {
      id: 'doc-1',
      sourceSheet: 'Build Guides',
      title: 'Perf Doc',
      url: 'https://docs.google.com/document/d/abc123XYZ/edit',
      lastUpdate: 'Sep 2026',
      lastUpdateStamp: Date.now(),
      authors: 'QA',
      tags: ['perf'],
      linkType: 'google_doc',
      provider: 'google_doc',
      embedUrl: 'https://docs.google.com/document/d/abc123XYZ/preview',
      canPreview: true,
    },
  ],
  faqs: [],
};

const preview = spawn(
  'npx',
  ['vite', 'preview', '--host', '127.0.0.1', '--port', '4173'],
  { cwd: new URL('..', import.meta.url).pathname, stdio: 'pipe', env: process.env }
);

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return;
    } catch {
      // retry
    }
    await sleep(250);
  }
  throw new Error('preview server did not start');
}

async function readLcp(page) {
  await page.waitForSelector('text=How Can We Help?');
  await page.waitForSelector('text=Perf Doc');
  // LCP may only appear via PerformanceObserver with buffered:true after nav.
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        let last = null;
        const po = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length) last = entries[entries.length - 1].startTime;
        });
        po.observe({ type: 'largest-contentful-paint', buffered: true });
        // Settle after fonts / hero paint.
        setTimeout(() => {
          po.disconnect();
          if (last != null) {
            resolve(last);
            return;
          }
          const fallback = performance.getEntriesByType('largest-contentful-paint');
          resolve(fallback.length ? fallback[fallback.length - 1].startTime : null);
        }, 1500);
      })
  );
}

try {
  await waitForServer();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.route('**/api/catalog**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(catalog),
    })
  );

  await page.goto(BASE, { waitUntil: 'networkidle' });
  const coldLcpMs = await readLcp(page);

  await page.goto(BASE, { waitUntil: 'networkidle' });
  const warmLcpMs = await readLcp(page);

  console.log(JSON.stringify({ coldLcpMs, warmLcpMs }, null, 2));
  await browser.close();
} finally {
  preview.kill('SIGTERM');
}
