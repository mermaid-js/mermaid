import { readFileSync } from 'node:fs';
import { test } from '@playwright/test';
import {
  assertUniqueSnapshotNames,
  buildFixtureTree,
  collectMmdFixtures,
  fixtureBaseName,
  fixturePath,
  type FixtureTree,
} from '../helpers/mmd-snapshots.ts';
import { imgSnapshotTest } from '../helpers/util.ts';

const fixtures = await collectMmdFixtures();
// Fail fast if two fixtures would share a screenshot baseline (see helper).
assertUniqueSnapshotNames(fixtures);
const fixtureTree = buildFixtureTree(fixtures);

const registerFixtureNode = (node: FixtureTree): void => {
  for (const segment of [...node.children.keys()].sort()) {
    test.describe(segment, () => {
      registerFixtureNode(node.children.get(segment)!);
    });
  }

  for (const relativePath of [...node.fixtures].sort()) {
    test(fixtureBaseName(relativePath), async ({ page }, testInfo) => {
      let source: string;
      try {
        source = readFileSync(fixturePath(relativePath), 'utf8');
      } catch (error) {
        throw new Error(
          `Failed to read mmd fixture ${relativePath}: ${error instanceof Error ? error.message : String(error)}`
        );
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
