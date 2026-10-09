import { expect, test } from '@playwright/test';

import { renderGraph } from '../../../helpers/util.ts';

// The e2e page does not load FontAwesome CSS, so this checks the markup, not a screenshot.
test.describe('Test iconShape with an unregistered FontAwesome icon', () => {
  test('draws the FontAwesome glyph instead of the unknown-icon placeholder', async ({
    page,
  }, testInfo) => {
    const flowchartCode = `flowchart TB\n  nA --> nAA@{ icon: 'fab:truck', label: 'unregistered prefix' }\n`;
    await renderGraph(page, testInfo, flowchartCode, { screenshot: false });
    await expect(page.locator('.icon-shape foreignObject i.fab.fa-truck')).toHaveCount(1);
    await expect(page.locator('.icon-shape text', { hasText: '?' })).toHaveCount(0);
  });
});
