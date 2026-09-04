import { test, expect, type Page } from '@playwright/test';
import { E2E_CATALOG } from '../src/test/fixtures';

async function mockCatalog(page: Page) {
  await page.route('**/api/catalog**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(E2E_CATALOG),
    });
  });
}

function resultCard(page: Page, title: string) {
  return page.getByRole('button', { name: `${title}. Open document.` });
}

test.describe('Knowledge base smoke', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalog(page);
  });

  test('loads home with catalog results', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'How Can We Help?' })).toBeVisible();
    await expect(resultCard(page, 'Alpha Google Doc')).toBeVisible();
    await expect(resultCard(page, 'Beta Google Slides')).toBeVisible();
  });

  test('search filters results', async ({ page }) => {
    await page.goto('./');
    const search = page.getByRole('textbox', { name: 'Search knowledge base' });
    await search.fill('SharePoint');
    await expect(resultCard(page, 'Gamma SharePoint File')).toBeVisible();
    await expect(resultCard(page, 'Alpha Google Doc')).toHaveCount(0);
  });

  test('applies source sheet filter from topic navigation', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Build Guides' }).first().click();

    await expect(page).toHaveURL(/Build%20Guides|sheet=Build/);
    await expect(resultCard(page, 'Alpha Google Doc')).toBeVisible();
    await expect(resultCard(page, 'Beta Google Slides')).toHaveCount(0);
  });

  test('opens /doc/:id and shows preview iframe for Google Doc', async ({ page }) => {
    await page.goto('./');
    await resultCard(page, 'Alpha Google Doc').click();
    await expect(page).toHaveURL(/\/doc\/doc-google-doc/);

    await expect(page.getByRole('heading', { name: 'Alpha Google Doc' })).toBeVisible();
    const preview = page.getByRole('region', { name: 'Document preview' });
    await expect(preview).toBeVisible();

    const iframe = preview.locator('iframe');
    const fallback = preview.getByRole('status');
    await expect(iframe.or(fallback)).toBeVisible({ timeout: 15_000 });
  });

  test('opens unsupported SharePoint doc and shows fallback UI', async ({ page }) => {
    await page.goto('./doc/doc-sharepoint');
    await expect(page.getByRole('heading', { name: 'Gamma SharePoint File' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Preview unavailable' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Open Original/i }).first()).toBeVisible();
    await expect(page.locator('iframe')).toHaveCount(0);
  });

  test('opens external tool and shows fallback UI', async ({ page }) => {
    await page.goto('./doc/doc-external');
    await expect(page.getByRole('heading', { name: 'Preview unavailable' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Open Original/i }).first()).toHaveAttribute(
      'href',
      'https://example.com/tool'
    );
  });

  test('opens FAQ modal from sidebar and closes with Escape', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'FAQ' }).click();

    const faqDialog = page.getByRole('dialog');
    await expect(faqDialog.getByRole('heading', { name: 'Frequently Asked Questions' })).toBeVisible();
    await expect(faqDialog.getByRole('button', { name: 'What is this?' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(faqDialog).toHaveCount(0);
  });
});
