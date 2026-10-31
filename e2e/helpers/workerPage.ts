import { test as base, type Page, type TestInfo } from '@playwright/test';
import { collectCoverage, startCoverage } from './coverage.ts';
import {
  imgSnapshotTest,
  renderInPage,
  waitForRenderGraph,
  type E2EMermaidConfig,
} from './util.ts';

type SharedRenderOptions = E2EMermaidConfig & {
  /** Pins the browser clock; such renders get a fresh page so the clock can't leak. */
  clock?: string;
};

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
export const test = base.extend<
  { renderShared: (code: string, options?: SharedRenderOptions) => Promise<void> },
  { workerPage: Page }
>({
  workerPage: [
    async ({ browser }, use, workerInfo) => {
      const context = await browser.newContext(contextOptions(workerInfo.project.use));
      const page = await context.newPage();
      await startCoverage(page);
      await page.goto('/e2e.html');
      await waitForRenderGraph(page);
      await use(page);
      await collectCoverage(page);
      await context.close();
    },
    { scope: 'worker' },
  ],

  /** Renders and screenshots `code` on the worker's shared page, or on a fresh page on retry. */
  renderShared: async ({ workerPage, browser }, use, testInfo) => {
    await use(async (code, { clock, ...options } = {}) => {
      if (testInfo.retry === 0 && !clock) {
        await renderInPage(workerPage, testInfo, code, options);
        return;
      }
      // Retry on a fresh page (which Playwright traces on retry) so a failure
      // can't be an artifact of the shared one.
      const context = await browser.newContext(contextOptions(testInfo.project.use));
      try {
        const page = await context.newPage();
        if (clock) {
          // setFixedTime over install: never advances, so a diagram whose own
          // date parsing defaults to "now" can't resolve to a slightly later
          // instant than a render-time `new Date()` call (e.g. the today
          // marker) just because rendering took some real time to run.
          await page.clock.setFixedTime(new Date(clock));
        }
        await imgSnapshotTest(page, testInfo, code, options);
      } finally {
        await context.close();
      }
    });
  },
});
