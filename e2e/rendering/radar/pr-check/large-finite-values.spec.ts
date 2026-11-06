import { expect, test, type Locator } from '@playwright/test';
import { imgSnapshotTest } from '../../../helpers/util.ts';

test('renders finite radar coordinates for large finite values', async ({ page }, testInfo) => {
  const max = `1${'0'.repeat(308)}`;
  const half = `5${'0'.repeat(307)}`;
  await imgSnapshotTest(
    page,
    testInfo,
    `radar-beta
      axis A, B, C
      curve sample{${max}, ${half}, 1}
      max ${max}`,
    { screenshot: false },
    false,
    async (svg: Locator) => {
      const paths = await svg
        .locator('path')
        .evaluateAll((elements) => elements.map((element) => element.getAttribute('d')));
      expect(paths.length).toBeGreaterThan(0);
      expect(paths.every((path) => path && !/NaN|Infinity/.test(path))).toBe(true);
    }
  );
});
