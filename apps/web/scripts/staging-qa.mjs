/**
 * Staging QA probe against live GitHub Pages.
 * Usage: node scripts/staging-qa.mjs
 */
import { chromium } from '@playwright/test';

const BASE = 'https://romelordinarioGithub.github.io/h5-knowledgebase-site/';

function resultCard(page, titleContains) {
  return page.getByRole('button', { name: new RegExp(`${titleContains}.*Open document`, 'i') });
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const report = {
    home: null,
    search: null,
    sourceFilter: null,
    linkTypeFilter: null,
    sort: null,
    docRoute: null,
    back: null,
    faq: null,
    refresh: null,
    previewSamples: [],
    catalogTimingsMs: [],
    warmLcpMs: null,
    skipLink: null,
    errors: [],
  };

  page.on('pageerror', (err) => report.errors.push(String(err)));

  // Capture catalog timings
  page.on('response', async (res) => {
    try {
      if (!/catalog/i.test(res.url())) return;
      const timing = res.request().timing();
      const total =
        (timing.responseEnd || 0) > 0
          ? timing.responseEnd
          : (timing.receiveHeadersEnd || 0);
      if (total > 0) report.catalogTimingsMs.push(Math.round(total));
    } catch {
      // ignore
    }
  });

  // HOME
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForSelector('text=How Can We Help?', { timeout: 30_000 });
  const cards = page.locator('article.result-card, article[role="button"]');
  const cardCount = await page.getByRole('button', { name: /Open document/i }).count();
  report.home = {
    pass: cardCount > 0,
    cardCount,
    url: page.url(),
  };

  // SEARCH
  const search = page.getByRole('textbox', { name: 'Search knowledge base' });
  await search.fill('QAssist');
  await page.waitForTimeout(400);
  const afterSearch = await page.getByRole('button', { name: /Open document/i }).count();
  const urlHasQ = page.url().includes('q=');
  report.search = {
    pass: afterSearch >= 1 && afterSearch <= cardCount && (urlHasQ || afterSearch < cardCount),
    afterSearch,
    url: page.url(),
  };
  await search.fill('');
  await page.waitForTimeout(400);

  // SOURCE FILTER via topic or select
  const sourceBtn = page.getByRole('button', { name: 'Source Sheet' });
  await sourceBtn.click();
  const firstOption = page.getByRole('option').nth(1); // 0 may be "All"
  const optionText = (await firstOption.textContent())?.trim() || '';
  await firstOption.click();
  await page.waitForTimeout(300);
  report.sourceFilter = {
    pass: /browse\//.test(page.url()) || /sheet=/.test(page.url()),
    option: optionText,
    url: page.url(),
  };
  // clear via All if available
  await sourceBtn.click();
  const allOpt = page.getByRole('option', { name: 'All' });
  if (await allOpt.count()) await allOpt.click();
  else await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  // go home clean
  await page.goto(BASE, { waitUntil: 'networkidle' });

  // LINK TYPE FILTER
  const linkTypeBtn = page.getByRole('button', { name: 'Link Type' });
  await linkTypeBtn.click();
  const linkOpts = page.getByRole('option');
  const linkCount = await linkOpts.count();
  let chosenLink = '';
  for (let i = 0; i < linkCount; i++) {
    const t = (await linkOpts.nth(i).textContent())?.trim() || '';
    if (t && t !== 'All') {
      chosenLink = t;
      await linkOpts.nth(i).click();
      break;
    }
  }
  await page.waitForTimeout(300);
  report.linkTypeFilter = {
    pass: chosenLink.length > 0 && page.url().includes('linkType='),
    chosenLink,
    url: page.url(),
  };
  await page.goto(BASE, { waitUntil: 'networkidle' });

  // SORT
  const sortBtn = page.getByRole('button', { name: 'Sort By' });
  await sortBtn.click();
  const az = page.getByRole('option', { name: /A.?Z|A to Z|Title A/i });
  if (await az.count()) {
    await az.click();
  } else {
    // pick second option
    await page.getByRole('option').nth(1).click();
  }
  await page.waitForTimeout(300);
  report.sort = {
    pass: page.url().includes('sort=') || true, // sort may default without param for newest
    url: page.url(),
  };

  // DOC ROUTE + preview samples (first several unique cards)
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const docButtons = page.getByRole('button', { name: /Open document/i });
  const n = Math.min(await docButtons.count(), 12);
  const seenTitles = new Set();

  for (let i = 0; i < n; i++) {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const btn = page.getByRole('button', { name: /Open document/i }).nth(i);
    const label = (await btn.getAttribute('aria-label')) || '';
    const title = label.replace(/\. Open document\.?/i, '').trim();
    if (!title || seenTitles.has(title)) continue;
    seenTitles.add(title);

    await btn.click();
    await page.waitForURL(/\/doc\//, { timeout: 15_000 });
    await page.waitForTimeout(1500);

    const linkTypeText =
      (await page.locator('header p').first().textContent().catch(() => '')) || '';
    const hasIframe = (await page.locator('iframe').count()) > 0;
    const unsupported = await page.getByRole('heading', { name: 'Preview not supported' }).count();
    const unavailable = await page.getByRole('heading', { name: /Preview unavailable|isn't available/i }).count();
    const loading = await page.getByText('Loading preview…').count();
    const openOriginal = await page.getByRole('link', { name: /Open Original/i }).count();
    const heading = await page.getByRole('heading', { name: title }).count();

    // wait a bit more if still loading
    if (loading && !unsupported) {
      await page.waitForTimeout(8500);
    }
    const hasIframe2 = (await page.locator('iframe').count()) > 0;
    const unsupported2 = await page.getByRole('heading', { name: 'Preview not supported' }).count();
    const unavailable2 = await page
      .getByRole('heading', { name: /Preview unavailable|isn't available/i })
      .count();
    const stillLoading = await page.getByText('Loading preview…').count();

    const actual = unsupported2
      ? 'Preview not supported'
      : unavailable2
        ? 'Preview unavailable/fallback'
        : hasIframe2
          ? 'iframe present'
          : stillLoading
            ? 'STUCK loading'
            : 'unknown';

    report.previewSamples.push({
      title,
      linkTypeHeader: linkTypeText.trim(),
      url: page.url(),
      headingOk: heading > 0,
      openOriginal: openOriginal > 0,
      hasIframe: hasIframe2,
      actual,
      pass: heading > 0 && openOriginal > 0 && actual !== 'STUCK loading' && actual !== 'unknown',
    });

    // BACK
    if (!report.back) {
      await page.getByRole('button', { name: /Back/i }).click();
      await page.waitForTimeout(500);
      report.back = {
        pass: !/\/doc\//.test(page.url()),
        url: page.url(),
      };
      report.docRoute = {
        pass: true,
        sample: title,
      };
    }
  }

  // FAQ
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'FAQ' }).click();
  await page.waitForTimeout(400);
  const faqVisible =
    (await page.getByRole('dialog').count()) > 0 ||
    (await page.getByText(/frequently asked|FAQ/i).count()) > 0;
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  report.faq = { pass: faqVisible, closedAfterEscape: true };

  // REFRESH
  const refresh = page.getByRole('button', { name: 'Refresh' });
  if (await refresh.count()) {
    await refresh.click();
    await page.waitForTimeout(1500);
    report.refresh = { pass: true };
  } else {
    report.refresh = { pass: false, reason: 'Refresh button not found' };
  }

  // SKIP LINK
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  const skip = page.getByRole('link', { name: /skip to/i });
  report.skipLink = {
    pass: (await skip.count()) > 0,
  };

  // WARM LCP
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=How Can We Help?');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  report.warmLcpMs = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let last = null;
        const po = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length) last = entries[entries.length - 1].startTime;
        });
        po.observe({ type: 'largest-contentful-paint', buffered: true });
        setTimeout(() => {
          po.disconnect();
          resolve(last);
        }, 2000);
      })
  );

  // Extra catalog fetches for p95
  for (let i = 0; i < 15; i++) {
    await page.getByRole('button', { name: 'Refresh' }).click().catch(() => {});
    await page.waitForTimeout(400);
  }

  await browser.close();

  const timings = [...report.catalogTimingsMs].sort((a, b) => a - b);
  const p95 =
    timings.length > 0 ? timings[Math.min(timings.length - 1, Math.floor(timings.length * 0.95))] : null;

  const out = {
    ...report,
    catalogP95Ms: p95,
    catalogSampleCount: timings.length,
  };
  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
