import { test, expect } from '@playwright/test';
import { imgSnapshotTest, mermaidUrl, utf8ToB64 } from '../helpers/util.ts';

test.describe('XSS', () => {
  test('should handle xss in tags', async ({ page }, testInfo) => {
    const str =
      'eyJjb2RlIjoiXG5ncmFwaCBMUlxuICAgICAgQi0tPkQoPGltZyBvbmVycm9yPWxvY2F0aW9uPWBqYXZhc2NyaXB0XFx1MDAzYXhzc0F0dGFja1xcdTAwMjhkb2N1bWVudC5kb21haW5cXHUwMDI5YCBzcmM9eD4pOyIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In19';

    const url = mermaidUrl(str, {}, true);

    await page.goto(url);
    await page.waitForTimeout(1000);
    await expect(page.locator('.mermaid')).toHaveCount(1);
    await expect(page.locator('#the-malware')).toHaveCount(0);
  });

  test('should not allow tags in the css', async ({ page }, testInfo) => {
    const str =
      'eyJjb2RlIjoiJSV7aW5pdDogeyAnZm9udEZhbWlseSc6ICdcXFwiPjwvc3R5bGU+PGltZyBzcmM9eCBvbmVycm9yPXhzc0F0dGFjaygpPid9IH0lJVxuZ3JhcGggTFJcbiAgICAgQSAtLT4gQiIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0IiwiZmxvd2NoYXJ0Ijp7Imh0bWxMYWJlbHMiOmZhbHNlfX0sInVwZGF0ZUVkaXRvciI6ZmFsc2V9';

    const url = mermaidUrl(
      str,
      {
        theme: 'default',
        flowchart: {
          htmlMode: false,
        },
      },
      true
    );

    await page.goto(url);
    await page.waitForTimeout(1000);
    await expect(page.locator('#the-malware')).toHaveCount(0);
  });

  test('should handle xss in tags in non-html mode', async ({ page }, testInfo) => {
    const str =
      'eyJjb2RlIjoiXG5ncmFwaCBMUlxuICAgICAgQi0tPkQoPGltZyBvbmVycm9yPWxvY2F0aW9uPWBqYXZhc2NyaXB0XFx1MDAzYXhzc0F0dGFja1xcdTAwMjhkb2N1bWVudC5kb21haW5cXHUwMDI5YCBzcmM9eD4pOyIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0IiwiZmxvd2NoYXJ0Ijp7Imh0bWxMYWJlbHMiOmZhbHNlfX19';

    const url = mermaidUrl(
      str,
      {
        theme: 'default',
        flowchart: {
          htmlMode: false,
        },
      },
      true
    );

    await page.goto(url);
    await page.waitForTimeout(1000);

    await expect(page.locator('#the-malware')).toHaveCount(0);
  });

  test('should not allow changing the __proto__ attribute using config', async ({
    page,
  }, testInfo) => {
    await page.goto('/xss2.html');
    await page.waitForTimeout(1000);
    await expect(page.locator('#the-malware')).toHaveCount(0);
  });
  test('should not allow manipulating htmlLabels into a false positive', async ({
    page,
  }, testInfo) => {
    await page.goto('/xss4.html');
    await page.waitForTimeout(1000);
    await expect(page.locator('#the-malware')).toHaveCount(0);
  });
  test('should not allow manipulating antiscript to run javascript', async ({ page }, testInfo) => {
    await page.goto('/xss5.html');
    await page.waitForTimeout(1000);
    await expect(page.locator('#the-malware')).toHaveCount(0);
  });
  test('should not allow manipulating antiscript to run javascript using onerror', async ({
    page,
  }, testInfo) => {
    await page.goto('/xss6.html');
    await page.waitForTimeout(1000);
    await expect(page.locator('#the-malware')).toHaveCount(0);
  });
  test('should not allow manipulating antiscript to run javascript using onerror in state diagrams with dagre wrapper', async ({
    page,
  }, testInfo) => {
    await page.goto('/xss8.html');
    await page.waitForTimeout(1000);
    await expect(page.locator('#the-malware')).toHaveCount(0);
  });
  test('should not allow manipulating antiscript to run javascript using onerror in state diagrams with dagre d3 (xss9)', async ({
    page,
  }) => {
    page.on('pageerror', () => {
      // continue rendering even if mermaid throws an error
    });
    await page.goto('/xss9.html');
    await page.waitForTimeout(1000);
    await expect(page.locator('#the-malware')).toHaveCount(0);
  });
  test('should not allow manipulating antiscript to run javascript using onerror in state diagrams with dagre d3 (xss10)', async ({
    page,
  }, testInfo) => {
    await page.goto('/xss10.html');
    await page.waitForTimeout(1000);
    await expect(page.locator('#the-malware')).toHaveCount(0);
  });
  test('should not allow manipulating antiscript to run javascript using onerror in state diagrams with dagre d3 (xss11)', async ({
    page,
  }, testInfo) => {
    await page.goto('/xss11.html');
    await page.waitForTimeout(1000);
    await expect(page.locator('#the-malware')).toHaveCount(0);
  });
  test('should not allow manipulating antiscript to run javascript using onerror in state diagrams with dagre d3 (xss12)', async ({
    page,
  }, testInfo) => {
    await page.goto('/xss12.html');
    await page.waitForTimeout(1000);
    await expect(page.locator('#the-malware')).toHaveCount(0);
  });
  test('should not allow manipulating antiscript to run javascript using onerror in state diagrams with dagre d3 (xss13)', async ({
    page,
  }, testInfo) => {
    await page.goto('/xss13.html');
    await page.waitForTimeout(1000);
    await expect(page.locator('#the-malware')).toHaveCount(0);
  });
  test('should not allow manipulating antiscript to run javascript iframes in class diagrams', async ({
    page,
  }, testInfo) => {
    await page.goto('/xss14.html');
    await page.waitForTimeout(1000);
    await expect(page.locator('#the-malware')).toHaveCount(0);
  });
  test('should sanitize cardinalities properly in class diagrams', async ({ page }, testInfo) => {
    await page.goto('/xss18.html');
    await page.waitForTimeout(1000);
    await expect(page.locator('#the-malware')).toHaveCount(0);
  });
  test('should sanitize colons properly', async ({ page }, testInfo) => {
    await page.goto('/xss20.html');
    await page.waitForTimeout(1000);
    await page.locator('a').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('#the-malware')).toHaveCount(0);
  });
  test('should sanitize colons properly (xss21)', async ({ page }, testInfo) => {
    await page.goto('/xss21.html');
    await page.waitForTimeout(1000);
    await page.locator('a').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('#the-malware')).toHaveCount(0);
  });
  test('should sanitize backticks in class names properly', async ({ page }, testInfo) => {
    await page.goto('/xss24.html');
    await page.waitForTimeout(1000);
    await expect(page.locator('#the-malware')).toHaveCount(0);
  });
  test('should sanitize backticks block diagram labels properly', async ({ page }, testInfo) => {
    await page.goto('/xss25.html');
    await page.waitForTimeout(1000);
    await expect(page.locator('#the-malware')).toHaveCount(0);
  });

  test('should sanitize icon labels in architecture diagrams', async ({ page }, testInfo) => {
    const str = JSON.stringify({
      code: `architecture-beta
    group api(cloud)[API]
    service db "<img src=x onerror=\\"xssAttack()\\">" [Database] in api`,
    });
    await imgSnapshotTest(page, testInfo, utf8ToB64(str), {}, true);
    await page.waitForTimeout(1000);
    await expect(page.locator('#the-malware')).toHaveCount(0);
  });

  test('should sanitize katex blocks', async ({ page }, testInfo) => {
    const str = JSON.stringify({
      code: `sequenceDiagram
    participant A as Alice<img src="x" onerror="xssAttack()">$$\\text{Alice}$$
    A->>John: Hello John, how are you?`,
    });
    await imgSnapshotTest(page, testInfo, utf8ToB64(str), {}, true);
    await page.waitForTimeout(1000);
    await expect(page.locator('#the-malware')).toHaveCount(0);
  });

  test('should sanitize labels', async ({ page }, testInfo) => {
    const str = JSON.stringify({
      code: `erDiagram
    "<img src=x onerror=xssAttack()>" ||--|| ENTITY2 : "<img src=x onerror=xssAttack()>"
    `,
    });
    await imgSnapshotTest(page, testInfo, utf8ToB64(str), {}, true);
    await page.waitForTimeout(1000);
    await expect(page.locator('#the-malware')).toHaveCount(0);
  });
});
