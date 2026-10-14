import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { renderGraph } from '../../helpers/util.ts';

const source = readFileSync(new URL('../../../demos/threat-model.mmd', import.meta.url), 'utf8');

test('renders threat annotations and keeps the register inside the SVG viewport', async ({
  page,
}, testInfo) => {
  await renderGraph(page, testInfo, source, {
    securityLevel: 'strict',
    flowchart: { htmlLabels: false },
  });
  await expect(page.locator('[data-threat-element]')).toHaveCount(6);
  await expect(page.locator('.threat-model-badge')).toHaveCount(5);
  await expect(page.locator('.threat-model-register')).toContainText('T1 | HIGH | open');
  await expect(page.locator('.threat-model-register')).toContainText('Evidence:');
  const inside = await page
    .locator('svg')
    .first()
    .evaluate((svg) => {
      const bounds = svg.getBBox();
      const viewport = svg.viewBox.baseVal;
      return (
        bounds.x >= viewport.x &&
        bounds.y >= viewport.y &&
        bounds.x + bounds.width <= viewport.x + viewport.width + 1 &&
        bounds.y + bounds.height <= viewport.y + viewport.height + 1
      );
    });
  expect(inside).toBe(true);
});
