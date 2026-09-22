import { expect, test } from '@playwright/test';
import { renderGraph, verifyScreenshot } from '../helpers/util.ts';

test.describe('Configuration', () => {
  test.describe('arrowMarkerAbsolute', () => {
    test('should handle default value false of arrowMarkerAbsolute', async ({ page }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `graph TD
        A[Christmas] -->|Get money| B(Go shopping)
        B --> C{Let me think}
        C -->|One| D[Laptop]
        C -->|Two| E[iPhone]
        C -->|Three| F[fa:fa-car Car]
        `,
        {}
      );

      // Check the marker-end property to make sure it is properly set to
      // start with #
      const path = page.locator('.edgePaths path').first();
      await expect(path).toHaveAttribute('marker-end');
      const markerEnd = await path.getAttribute('marker-end');
      expect(markerEnd).toContain('url(#');
    });

    test('should handle arrowMarkerAbsolute explicitly set to false', async ({
      page,
    }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `graph TD
        A[Christmas] -->|Get money| B(Go shopping)
        B --> C{Let me think}
        C -->|One| D[Laptop]
        C -->|Two| E[iPhone]
        C -->|Three| F[fa:fa-car Car]
        `,
        {
          arrowMarkerAbsolute: false,
        }
      );

      // Check the marker-end property to make sure it is properly set to
      // start with #
      const path = page.locator('.edgePaths path').first();
      await expect(path).toHaveAttribute('marker-end');
      const markerEnd = await path.getAttribute('marker-end');
      expect(markerEnd).toContain('url(#');
    });
    // This has been broken for a long time, but something about the Cypress environment was
    // rewriting the URL to be relative, causing the test to incorrectly pass.
    test.skip('should handle arrowMarkerAbsolute explicitly set to "false" as false', async ({
      page,
    }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `graph TD
        A[Christmas] -->|Get money| B(Go shopping)
        B --> C{Let me think}
        C -->|One| D[Laptop]
        C -->|Two| E[iPhone]
        C -->|Three| F[fa:fa-car Car]
        `,
        {
          arrowMarkerAbsolute: 'false',
        }
      );

      // Check the marker-end property to make sure it is properly set to
      // start with #
      const path = page.locator('.edgePaths path').first();
      await expect(path).toHaveAttribute('marker-end');
      const markerEnd = await path.getAttribute('marker-end');
      expect(markerEnd).toContain('url(#');
    });
    test('should handle arrowMarkerAbsolute set to true', async ({ page }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `flowchart TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[fa:fa-car Car]
    `,
        {
          arrowMarkerAbsolute: true,
        }
      );

      const path = page.locator('.edgePaths path').first();
      await expect(path).toHaveAttribute('marker-end');
      const markerEnd = await path.getAttribute('marker-end');
      expect(markerEnd).toContain('url(http://localhost');
    });
    test('should not taint the initial configuration when using multiple directives', async ({
      page,
    }, testInfo) => {
      const url = '/regression/issue-1874.html';
      await page.goto(url);
      await page.waitForFunction(() => window.rendered === true);
      await verifyScreenshot(
        page,
        testInfo,
        'configuration.spec-should-not-taint-initial-configuration-when-using-multiple-directives'
      );
    });
  });

  test.describe('suppressErrorRendering', () => {
    test.beforeEach(({ page }) => {
      page.on('pageerror', (err) => {
        if (err.message.includes('Parse error on line')) {
          return;
        }
        throw err;
      });
    });

    test('should not render error diagram if suppressErrorRendering is set', async ({
      page,
    }, testInfo) => {
      const url = '/suppressError.html?suppressErrorRendering=true';
      await page.goto(url);
      await page.waitForFunction(() => window.rendered === true);
      const svgs = page.locator('#test svg');
      await expect(svgs).toHaveCount(2);
      await expect(page.locator('#test')).not.toContainText('Syntax error');
      await verifyScreenshot(
        page,
        testInfo,
        'configuration.spec-should-not-render-error-diagram-if-suppressErrorRendering-is-set'
      );
    });

    test('should render error diagram if suppressErrorRendering is not set', async ({
      page,
    }, testInfo) => {
      const url = '/suppressError.html';
      await page.goto(url);
      await page.waitForFunction(() => window.rendered === true);
      const svgs = page.locator('#test svg');
      await expect(svgs).toHaveCount(5);
      await expect(page.locator('#test svg[aria-roledescription="error"]').first()).toContainText(
        'Syntax error'
      );
      await verifyScreenshot(
        page,
        testInfo,
        'configuration.spec-should-render-error-diagram-if-suppressErrorRendering-is-not-set'
      );
    });
  });
});
