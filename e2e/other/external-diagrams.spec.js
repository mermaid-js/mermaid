import { test } from '@playwright/test';
import { urlSnapshotTest } from '../helpers/util.ts';

test.describe('mermaid', () => {
  test.describe('registerDiagram', () => {
    test('should work on @mermaid-js/mermaid-example-diagram', async ({ page }, testInfo) => {
      const url = '/external-diagrams-example-diagram.html';
      await urlSnapshotTest(page, testInfo, url, {}, false, false);
    });
  });
});
