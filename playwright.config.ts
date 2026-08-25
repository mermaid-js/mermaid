import { createHash } from 'node:crypto';
import { basename } from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

function resolveE2EPort(): string {
  if (process.env.MERMAID_PORT) {
    return process.env.MERMAID_PORT;
  }
  if (process.env.CI) {
    return '9000';
  }
  if (process.env.MERMAID_DEV_PORT) {
    return process.env.MERMAID_DEV_PORT;
  }
  const worktreeRoot = process.cwd();
  if (basename(worktreeRoot) === 'alana-mermaid') {
    return '9000';
  }
  const hash = createHash('sha1').update(worktreeRoot).digest();
  return String(9000 + (hash.readUInt16BE(0) % 100));
}

const port = resolveE2EPort();
process.env.MERMAID_PORT ??= port;
process.env.MERMAID_DEV_PORT ??= port;

const devCommand = process.env.E2E_COVERAGE ? 'pnpm dev:coverage' : 'pnpm dev';

// Applitools batches are keyed on this id (see e2e/helpers/applitools.ts), so it
// has to be identical in every worker. This file is evaluated in the runner
// process before workers fork (they inherit process.env), which makes it the one
// place a per-run seed can be minted; CI sets it per workflow dispatch instead.
if (process.env.USE_APPLI) {
  process.env.APPLITOOLS_BATCH_ID ??= Date.now().toString();
}

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.{js,ts}',
  // e2e/helpers holds Vitest unit tests for the e2e helpers (e.g.
  // mmd-snapshots.spec.ts imports from 'vitest'); they must not be collected by
  // Playwright. Vitest runs them (vite.config.ts excludes only e2e/rendering + e2e/other).
  testIgnore: '**/helpers/**',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  reporter: [
    // 'github' emits ::error:: file/line annotations; 'line' adds newline-flushed
    // progress so CI logs stream per-test instead of buffering like 'dot'.
    ...(process.env.CI ? [['github'], ['line']] : [['list']]),
  ],
  use: {
    baseURL: `http://localhost:${port}`,
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 1024 },
    // Render at 2x device pixels so diagram screenshots have enough resolution to
    // stay sharp when the Argos grid enlarges them to fill a cell.
    deviceScaleFactor: 2,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}{ext}',
  globalTeardown: process.env.E2E_COVERAGE ? './e2e/global-teardown.ts' : undefined,
  webServer: {
    command: devCommand,
    url: `http://localhost:${port}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      MERMAID_PORT: port,
      MERMAID_DEV_PORT: port,
    },
  },
});
