import { readFileSync } from 'node:fs';
import { test } from '@playwright/test';
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
import { imgSnapshotTest } from '../helpers/util.ts';

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

    test(fixtureBaseName(relativePath), { tag: tags }, async ({ page }, testInfo) => {
      if (metadata?.description) {
        testInfo.annotations.push({ type: 'description', description: metadata.description });
      } else {
        // Not a failure — most fixtures don't have one yet — but flagged in the
        // report rather than left silent, since a missing sidecar is otherwise
        // invisible short of opening the fixture's folder directly.
        testInfo.annotations.push({ type: 'metadata', description: 'No metadata found for test' });
      }

      let source: string;
      try {
        source = readFileSync(fixturePath(relativePath), 'utf8');
      } catch (error) {
        throw new Error(
          `Failed to read mmd fixture ${relativePath}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      const fixedClock = fixedClockFor(relativePath);
      if (fixedClock) {
        // setFixedTime over install: never advances, so a diagram whose own
        // date parsing defaults to "now" can't resolve to a slightly later
        // instant than a render-time `new Date()` call (e.g. the today
        // marker) just because rendering took some real time to run.
        await page.clock.setFixedTime(new Date(fixedClock));
      }
      // Mirror the fixture's storage path so Argos sheets group by diagram
      // folder (e.g. diagrams/packet) rather than the runner spec file.
      await imgSnapshotTest(page, testInfo, source, {
        screenshotPath: `diagrams/${relativePath.replace(/\.mmd$/i, '')}`,
      });
    });
  }
};

test.describe('mmd snapshots', () => {
  registerFixtureNode(fixtureTree);
});
