import { test, expect } from '@playwright/test';
import { renderGraph } from '../../helpers/util.ts';

test.describe('pie chart', () => {
  test('should render a pie diagram when useMaxWidth is true (default)', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `pie title Sports in Sweden
        "Bandy": 40
        "Ice-Hockey": 80
        "Football": 90
      `,
      { pie: { useMaxWidth: true } }
    );
    const svg = page.locator('svg');
    await expect(svg).toHaveAttribute('width', '100%');
    const style = await svg.getAttribute('style');
    expect(style).toMatch(/^max-width: [\d.]+px;$/);
    const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
    expect(maxWidthValue).toBeGreaterThanOrEqual(590);
    expect(maxWidthValue).toBeLessThanOrEqual(600);
  });

  test('should render a pie diagram when useMaxWidth is false', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `pie title Sports in Sweden
        "Bandy": 40
        "Ice-Hockey": 80
        "Football": 90
      `,
      { pie: { useMaxWidth: false } }
    );
    const svg = page.locator('svg');
    const width = parseFloat((await svg.getAttribute('width')) ?? '0');
    expect(width).toBeGreaterThanOrEqual(590);
    expect(width).toBeLessThanOrEqual(600);
    await expect(svg).not.toHaveAttribute('style');
  });

  test('should render a pie diagram that highlights specific slice', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `pie title Budget Allocation
        "Food": 300
        "Entertainment": 80
        "Rent": 500
      `,
      { pie: { highlightSlice: 'Food' } }
    );
    await expect(page.locator('.pieCircle').first()).toHaveClass(/highlighted/);
  });

  test('should render a pie diagram that highlights hovered slice', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `pie title Portfolio Holdings
        "Stock": 60
        "Bond": 30
        "Cash": 10
      `,
      { pie: { highlightSlice: 'hover' } }
    );

    const pieCircles = page.locator('.pieCircle');
    const count = await pieCircles.count();
    for (let i = 0; i < count; i++) {
      await expect(pieCircles.nth(i)).toHaveClass(/highlightedOnHover/);
    }
  });
});
