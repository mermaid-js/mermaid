import { expect, test, type Locator } from '@playwright/test';
import { imgSnapshotTest } from '../../../helpers/util';

test.describe('Flowchart edge label with math', () => {
  test('gets the same background as a plain edge label', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart LR
        A --- |"Ratio $$\\dfrac{a}{b}$$"| B
        C --- |"plain label"| D`,
      {},
      false,
      async (svg: Locator) => {
        const plainBackground = await svg
          .locator('span.edgeLabel > p')
          .evaluate((label) => getComputedStyle(label).backgroundColor);
        await expect(svg.locator('span.edgeLabel > div')).toHaveCSS(
          'background-color',
          plainBackground
        );
      }
    );
  });
});
