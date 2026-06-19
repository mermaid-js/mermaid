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

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.{js,ts}',
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
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}{ext}',
  globalTeardown: process.env.E2E_COVERAGE ? './e2e/global-teardown.ts' : undefined,
});
