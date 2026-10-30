import { readFileSync } from 'node:fs';
import { test as base, type Page, type TestInfo } from '@playwright/test';
import { collectCoverage, startCoverage } from '../helpers/coverage.ts';
import {
  assertUniqueSnapshotNames,
  buildFixtureTree,
  collectMmdFixtures,
  DIAGRAMS_DIR,
  fixtureBaseName,
  fixturePath,
  readFixtureMetadata,
  type FixtureTree,
} from '../helpers/mmd-snapshots.ts';
import { imgSnapshotTest, renderInPage } from '../helpers/util.ts';

// One e2e.html page per worker: fixtures render into it via window.renderGraph
// instead of reloading the page and its bundles for every test.
const test = base.extend<object, { workerPage: Page }>({
  workerPage: [
    async ({ browser }, use, workerInfo) => {
      const { baseURL, viewport, deviceScaleFactor, timezoneId } = workerInfo.project.use;
      const context = await browser.newContext({
        baseURL,
        viewport,
        deviceScaleFactor,
        timezoneId,
      });
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

// Set by CI (.github/workflows/e2e.yml, .github/workflows/nightly-e2e.yml)
// to a comma-separated tier list (e.g. 'pr' or 'pr,nightly') when a run is
// scoped to specific tiers — narrows fixture collection to each diagram's
// matching subfolder(s) instead of every tier.
const fixtureTiers = process.env.MERMAID_E2E_FIXTURE_TIER?.split(',')
  .map((tier) => tier.trim())
  .filter(Boolean);
const fixtures = await collectMmdFixtures(
  DIAGRAMS_DIR,
  fixtureTiers?.length ? fixtureTiers.map((tier) => `*/${tier}/**/*.mmd`) : undefined
);
// Fail fast if two fixtures would share a screenshot baseline (see helper).
assertUniqueSnapshotNames(fixtures);
const fixtureTree = buildFixtureTree(fixtures);

// Gantt fixtures are dated around 1010-10-10 and several of them exercise the
// today marker, which the renderer places at `new Date()`. Pin the browser
// clock to that date so the marker lands inside the chart instead of
// somewhere off-canvas. Keyed by top-level folder (e.g. 'gantt') as the
// default for the whole diagram type, or by a fixture's full relative path
// when it needs the marker at a specific spot instead (checked first).
const FIXED_CLOCKS: Record<string, string> = {
  gantt: '1010-10-10',
  // Seconds-based dateFormat: lands the marker between the "01" and "02"
  // tick marks, clear of both the task-start edge and any task boundary.
  'gantt/pr-check/should-render-a-gantt-diagram-with-a-vert-tag.mmd': '1010-10-10T00:00:01.500Z',
};

const fixedClockFor = (relativePath: string): string | undefined =>
  FIXED_CLOCKS[relativePath] ?? FIXED_CLOCKS[relativePath.split('/')[0]];

const registerFixtureNode = (node: FixtureTree): void => {
  for (const segment of [...node.children.keys()].sort()) {
    test.describe(segment, () => {
      registerFixtureNode(node.children.get(segment)!);
    });
  }

  for (const relativePath of [...node.fixtures].sort()) {
    // Read at registration time (sync, like the fixture file itself below):
    // `tag` has to be a static option on the `test()` call, not something
    // decided from inside the async test body.
    const metadata = readFixtureMetadata(relativePath);
    const tags = metadata?.tags?.map((tag) => (tag.startsWith('@') ? tag : `@${tag}`));

    const prepare = (testInfo: TestInfo) => {
      if (metadata?.description) {
        testInfo.annotations.push({ type: 'description', description: metadata.description });
      } else {
        // Not a failure — most fixtures don't have one yet — but flagged in the
        // report rather than left silent, since a missing sidecar is otherwise
        // invisible short of opening the fixture's folder directly.
        testInfo.annotations.push({ type: 'metadata', description: 'No metadata found for test' });
      }
      try {
        return readFileSync(fixturePath(relativePath), 'utf8');
      } catch (error) {
        throw new Error(
          `Failed to read mmd fixture ${relativePath}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    };
    // Mirror the fixture's storage path so Argos sheets group by diagram
    // folder (e.g. diagrams/packet) rather than the runner spec file.
    const screenshotPath = `diagrams/${relativePath.replace(/\.mmd$/i, '')}`;
    const fixedClock = fixedClockFor(relativePath);

    if (fixedClock) {
      // A pinned clock would leak into later fixtures, so these keep a fresh page.
      test(fixtureBaseName(relativePath), { tag: tags }, async ({ page }, testInfo) => {
        const source = prepare(testInfo);
        // setFixedTime over install: never advances, so a diagram whose own
        // date parsing defaults to "now" can't resolve to a slightly later
        // instant than a render-time `new Date()` call (e.g. the today
        // marker) just because rendering took some real time to run.
        await page.clock.setFixedTime(new Date(fixedClock));
        await imgSnapshotTest(page, testInfo, source, { screenshotPath });
      });
    } else {
      test(
        fixtureBaseName(relativePath),
        { tag: tags },
        async ({ workerPage, browser }, testInfo) => {
          const source = prepare(testInfo);
          if (testInfo.retry === 0) {
            await renderInPage(workerPage, testInfo, source, { screenshotPath });
            return;
          }
          // Retry on a fresh page (which Playwright traces on retry) so a failure
          // can't be an artifact of the shared one.
          const { baseURL, viewport, deviceScaleFactor, timezoneId } = testInfo.project.use;
          const context = await browser.newContext({
            baseURL,
            viewport,
            deviceScaleFactor,
            timezoneId,
          });
          try {
            await imgSnapshotTest(await context.newPage(), testInfo, source, { screenshotPath });
          } finally {
            await context.close();
          }
        }
      );
    }
  }
};

test.describe('mmd snapshots', () => {
  registerFixtureNode(fixtureTree);
});
