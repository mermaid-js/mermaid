import { test } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

test.describe('Zen UML', () => {
  test('Basic Zen UML diagram', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    zenuml
			A.method() {
        if(x) {
          B.method() {
            selfCall() { return X }
          }
        }
      }
    `,
      {}
    );
  });
});
