import { test } from '@playwright/test';
import { urlSnapshotTest } from '../../../helpers/util';

test.describe('architecture - external', () => {
  test('should allow adding external icons', async ({ page }, testInfo) => {
    await urlSnapshotTest(page, testInfo, '/architecture-external.html');
  });
});
