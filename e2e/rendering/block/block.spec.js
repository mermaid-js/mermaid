import { expect, test } from '@playwright/test';

import { renderGraph } from '../../helpers/util.ts';

test.describe('Block diagram', () => {
  test('BL38: should not let a sibling with a much wider label overflow into its neighbors', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `block-beta
  block:ID
    A
    B["This label is intentionally very wide so that it clearly exceeds the two hundred pixel default wrap threshold"]
    C
  end`,
      { screenshot: false }
    );

    const ranges = await page.evaluate(() => {
      const svg = document.querySelector('svg');
      return ['A', 'B', 'C'].map((id) => {
        const g = svg.querySelector(`[id$="-${id}"]`);
        const rect = g.querySelector('rect');
        const transform = g.getAttribute('transform');
        const tx = parseFloat(/translate\(([\d.-]+)/.exec(transform)[1]);
        const x = parseFloat(rect.getAttribute('x'));
        const width = parseFloat(rect.getAttribute('width'));
        return { id, left: tx + x, right: tx + x + width };
      });
    });

    const sorted = [...ranges].sort((a, b) => a.left - b.left);
    for (let i = 1; i < sorted.length; i++) {
      expect(
        sorted[i].left,
        `${sorted[i - 1].id} [${sorted[i - 1].left}, ${sorted[i - 1].right}] should not overlap ${sorted[i].id} [${sorted[i].left}, ${sorted[i].right}]`
      ).toBeGreaterThanOrEqual(sorted[i - 1].right);
    }
  });
});
