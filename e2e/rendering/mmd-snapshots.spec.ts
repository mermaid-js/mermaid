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

/**
 * `flowchart-elk` / `graph-elk` fixtures select ELK in the detector, whose
 * choice `flowDiagram.init` ranks below a user-supplied layout. Pinning the
 * baseline layout for these would silently render them with dagre instead, so
 * they keep whatever the diagram itself asks for. Fixtures that declare
 * `layout:` in frontmatter need no such treatment: a directive already wins.
 *
 * Deliberately does NOT look at `flowchart.defaultRenderer`. Only
 * `flowDiagram.init` promotes the detector's choice into the real config, so on
 * a non-flowchart (the class/er/mindmap fixtures that carry it) the setting is
 * inert and the fixture must stay pinned like any other.
 */
const selectsElkBySyntax = (source: string): boolean =>
  /^\s*(?:flowchart-elk|graph-elk)\b/m.test(source);

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
        useDiagramLayout: selectsElkBySyntax(source),
      });
    });
  }
};

test.describe('mmd snapshots', () => {
  registerFixtureNode(fixtureTree);
});
