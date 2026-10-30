import { expect, test } from '@playwright/test';
import { renderGraph } from '../../helpers/util.ts';

test.describe('Flowchart node metadata tooltip', () => {
  test('should show the tooltip on hover and hide it on mouseout', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `flowchart LR
        A@{ tooltip: "Extra details shown on hover" } --> B`,
      { screenshot: false }
    );

    const nodeA = page.locator('g.node').filter({ hasText: 'A' });
    const nodeB = page.locator('g.node').filter({ hasText: 'B' });
    const tooltip = page.locator('.mermaidTooltip');

    await expect(nodeA).toHaveAttribute('title', 'Extra details shown on hover');

    await nodeA.hover();
    await expect(tooltip).toHaveText('Extra details shown on hover');
    await expect(tooltip).toHaveCSS('opacity', '0.9');

    await nodeB.hover();
    await expect(tooltip).toHaveCSS('opacity', '0');
  });
});
