import { test, expect } from '@playwright/test';
import { urlSnapshotTest, assertNoDuplicateIds } from '../helpers/util.ts';

test.describe('Marker Unique IDs Per Diagram', () => {
  test('should render a blue arrow tip in second digram', async ({ page }, testInfo) => {
    await urlSnapshotTest(page, testInfo, '/marker_unique_id.html', {
      logLevel: 1,
      flowchart: { htmlLabels: false },
    });
  });

  test('should have no duplicate element IDs across all four diagrams', async ({ page }) => {
    await page.goto('/marker_unique_id.html');
    await page.waitForFunction(() => window.rendered === true);
    expect(await page.locator('svg').count()).toBeGreaterThanOrEqual(4);
    await assertNoDuplicateIds(page);
  });
});
