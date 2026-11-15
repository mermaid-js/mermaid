import { CoverageReport } from 'monocart-coverage-reports';
import { coverageOptions } from './helpers/coverage.js';

// Merge the per-test raw V8 coverage cached by collectCoverage() into a single
// istanbul lcov (coverage/playwright/lcov.info), which the codecov-upload CI job
// uploads. A missing/empty cache (e.g. all tests skipped) is a no-op.
async function globalTeardown(): Promise<void> {
  if (process.env.E2E_COVERAGE !== 'true') {
    return;
  }
  try {
    await new CoverageReport(coverageOptions).generate();
  } catch {
    // No coverage collected — leave nothing for codecov to upload.
  }
}

export default globalTeardown;
