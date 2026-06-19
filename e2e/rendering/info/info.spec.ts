import { test } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

test.describe('info diagram', () => {
  test('should handle an info definition', async ({ page }, testInfo) => {
    await imgSnapshotTest(page, testInfo, `info`);
  });

  test('should handle an info definition with showInfo', async ({ page }, testInfo) => {
    await imgSnapshotTest(page, testInfo, `info showInfo`);
  });
});
