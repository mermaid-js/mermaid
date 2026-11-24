import { test, expect } from '@playwright/test';

test.describe('IIFE', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iife.html');
  });

  test('should render when using mermaid.min.js', async ({ page }) => {
    await page.waitForFunction(() => window.rendered === true);
    await expect(page.locator('#d2 svg')).toBeVisible();
    await expect(page.locator('#d2')).toContainText('Hello');
  });
});
