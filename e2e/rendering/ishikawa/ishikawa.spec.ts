import { test, expect } from '@playwright/test';

import { renderGraph } from '../helpers/util.ts';

test.describe('Ishikawa diagram', () => {
  test('10: should render when useMaxWidth is true', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `ishikawa-beta
    Blurry Photo
        Process
            Out of focus
        User
            Shaky hands
      `,
      { ishikawa: { useMaxWidth: true } }
    );
    const svg = page.locator('svg');
    await expect(svg).toHaveAttribute('width', '100%');
    const style = await svg.getAttribute('style');
    expect(style).toMatch(/^max-width: [\d.]+px;$/);
  });

  test('11: should render when useMaxWidth is false', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `ishikawa-beta
    Blurry Photo
        Process
            Out of focus
        User
            Shaky hands
      `,
      { ishikawa: { useMaxWidth: false } }
    );
    const svg = page.locator('svg');
    const width = parseFloat((await svg.getAttribute('width')) ?? '0');
    expect(width).toBeGreaterThan(0);
    const height = parseFloat((await svg.getAttribute('height')) ?? '0');
    expect(height).toBeGreaterThan(0);
    await expect(svg).not.toHaveAttribute('style');
  });
});
