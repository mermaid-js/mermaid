import { test as base, type Browser, type Page, type TestInfo } from '@playwright/test';
import { collectCoverage, startCoverage } from './coverage.ts';
import { imgSnapshotTest, renderInPage } from './util.ts';

type SnapshotOptions = Parameters<typeof imgSnapshotTest>[3];

const contextOptions = ({
  baseURL,
  viewport,
  deviceScaleFactor,
  timezoneId,
}: TestInfo['project']['use']) => ({
  baseURL,
  viewport,
  deviceScaleFactor,
  timezoneId,
});

// One e2e.html page per worker: diagrams render into it via window.renderGraph
// instead of reloading the page and its bundles for every test.
export const test = base.extend<object, { workerPage: Page }>({
  workerPage: [
    async ({ browser }, use, workerInfo) => {
      const context = await browser.newContext(contextOptions(workerInfo.project.use));
      const page = await context.newPage();
      await startCoverage(page);
      await page.goto('/e2e.html');
      await page.waitForFunction(() => typeof (window as any).renderGraph === 'function');
      await use(page);
      await collectCoverage(page);
      await context.close();
    },
    { scope: 'worker' },
  ],
});

/** Renders and screenshots `code` on the worker's shared page, or on a fresh page on retry. */
export const renderShared = async (
  workerPage: Page,
  browser: Browser,
  testInfo: TestInfo,
  code: string,
  options: SnapshotOptions = {}
): Promise<void> => {
  if (testInfo.retry === 0) {
    await renderInPage(workerPage, testInfo, code, options);
    return;
  }
  // Retry on a fresh page (which Playwright traces on retry) so a failure
  // can't be an artifact of the shared one.
  const context = await browser.newContext(contextOptions(testInfo.project.use));
  try {
    await imgSnapshotTest(await context.newPage(), testInfo, code, options);
  } finally {
    await context.close();
  }
};
