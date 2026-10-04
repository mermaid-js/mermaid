import { test, expect } from '@playwright/test';
import { assertNoDuplicateIds } from '../helpers/util.ts';

test.describe('Multi-Diagram Unique IDs', () => {
  test('should have no duplicate element IDs across all diagrams on the page', async ({ page }) => {
    await page.goto('/multi_diagram_unique_ids.html');
    await page.waitForFunction(() => window.rendered === true);
    expect(await page.locator('svg').count()).toBeGreaterThanOrEqual(8);
    await assertNoDuplicateIds(page);
  });
});
