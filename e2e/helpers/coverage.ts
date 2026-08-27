import { CoverageReport } from 'monocart-coverage-reports';
import type { Page, TestInfo } from '@playwright/test';

const COVERAGE = process.env.E2E_COVERAGE === 'true';

// Mirrors the Cypress cypress-monocart-coverage config: collect native V8
// coverage of the mermaid bundle (no instrumentation) and map it back to source
// via the bundle's inline source maps (build:coverage emits inline maps).
// Per-test `add()` caches raw V8 under outputDir; global-teardown `generate()`
// merges the cache into an istanbul lcov.
export const coverageOptions = {
  name: 'mermaid e2e coverage',
  outputDir: 'coverage/playwright',
  reports: ['lcovonly', 'json'],
  // Only the mermaid bundle and its lazy chunks (not sibling packages).
  entryFilter: {
    '**/mermaid.esm.mjs': true,
    '**/chunks/mermaid.esm/**': true,
    '**/*': false,
  },
  // Sourcemap paths are package-relative (`src/...`); make them repo-relative.
  sourcePath: (filePath: string): string =>
    filePath.startsWith('src/') ? `packages/mermaid/${filePath}` : filePath,
  sourceFilter: (sourcePath: string): boolean => sourcePath.startsWith('packages/mermaid/src/'),
};

interface CoverageState {
  __covStarted?: boolean;
  __covDone?: boolean;
}

/** Start native V8 coverage on the page before it navigates. No-op off CI. */
export async function startCoverage(page: Page): Promise<void> {
  const state = page as unknown as CoverageState;
  if (!COVERAGE || state.__covStarted) {
    return;
  }
  state.__covStarted = true;
  await page.coverage.startJSCoverage({ resetOnNavigation: false });
}

/** Stop coverage and cache the raw V8 data; global-teardown emits the lcov. */
export async function collectCoverage(page: Page, _testInfo: TestInfo): Promise<void> {
  const state = page as unknown as CoverageState;
  if (!COVERAGE || !state.__covStarted || state.__covDone) {
    return;
  }
  state.__covDone = true;
  const coverage = await page.coverage.stopJSCoverage();
  await new CoverageReport(coverageOptions).add(coverage);
}
