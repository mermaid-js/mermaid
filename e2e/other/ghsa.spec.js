import { test, expect } from '@playwright/test';
import { urlSnapshotTest, openURLAndVerifyRendering, imgSnapshotTest } from '../helpers/util.ts';

test.describe('CSS injections', () => {
  test('should not allow CSS injections outside of the diagram', async ({ page }, testInfo) => {
    await urlSnapshotTest(page, testInfo, '/ghsa1.html', {
      logLevel: 1,
      flowchart: { htmlLabels: false },
    });
  });
  test('should not allow adding styletags affecting the page', async ({ page }, testInfo) => {
    await urlSnapshotTest(page, testInfo, '/ghsa3.html', {
      logLevel: 1,
      flowchart: { htmlLabels: false },
    });
  });
  test('should not allow manipulating styletags using arrowheads', async ({ page }, testInfo) => {
    await openURLAndVerifyRendering(page, testInfo, '/xss23-css.html', {
      logLevel: 1,
      arrowMarkerAbsolute: false,
      flowchart: { htmlLabels: true },
    });
  });
  test('should sanitize CSS in class definitions', async ({ page }, testInfo) => {
    await urlSnapshotTest(page, testInfo, '/css-injection.html', {
      logLevel: 1,
      flowchart: { htmlLabels: false },
    });
    await expect(page.locator('.otp-3')).not.toHaveCSS(
      'background-image',
      'url("https://example.test/3.png")'
    );
  });
  test('should prevent HTML injection via class definitions', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `stateDiagram-v2
  classDef xss fill:red</style></svg><style>*{x:x;y:y;overflow:visible!important;contain:none!important;transform:none!important;filter:none!important;clip-path:none!important}</style><div id="pwned" style="x:x;y:y;color:red;font:5em/1 monospace;display:grid;place-items:center;z-index:2147483647;width:100vw;height:100vh;position:fixed;top:0;left:0;background:black">HACKED</div><svg><style>a:b
  [*] --> A:::xss
     `,
      { logLevel: 1 }
    );
    await expect(page.locator('body > div #pwned')).toHaveCount(0);
  });
  test('should prevent CSS namespace injection via :not(&)', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
title: Green background CSS should not be able to escape the diagram using :not(&)
config:
  themeCSS: ':not(&){background:green !important}'
---
flowchart
  A --> B
     `,
      { logLevel: 1 }
    );
    await expect(page.locator('body')).not.toHaveCSS('background-color', 'rgb(0, 128, 0)');
  });
});
