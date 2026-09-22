import { globby } from 'globby';
import { basename, join } from 'node:path';

export const DIAGRAMS_DIR = 'e2e/diagrams';

export interface FixtureTree {
  fixtures: string[];
  children: Map<string, FixtureTree>;
}

export const fixtureBaseName = (relativePath: string): string =>
  basename(relativePath).replace(/\.mmd$/i, '');

export const buildFixtureTree = (relativePaths: readonly string[]): FixtureTree => {
  const root: FixtureTree = { fixtures: [], children: new Map() };

  for (const relativePath of relativePaths) {
    const segments = relativePath.split('/');
    const fileName = segments.pop();
    if (!fileName) {
      continue;
    }

    let node = root;
    for (const segment of segments) {
      let child = node.children.get(segment);
      if (!child) {
        child = { fixtures: [], children: new Map() };
        node.children.set(segment, child);
      }
      node = child;
    }
    node.fixtures.push(relativePath);
  }

  return root;
};

export const collectMmdFixtures = async (diagramsDir = DIAGRAMS_DIR): Promise<string[]> => {
  return globby('**/*.mmd', { cwd: diagramsDir, onlyFiles: true });
};

export const fixturePath = (relativePath: string, diagramsDir = DIAGRAMS_DIR): string =>
  join(diagramsDir, relativePath);

/**
 * Mirrors the snapshot-name flattening in helpers/util.ts: the screenshot name
 * is the test's title path (folder segments + base name) with every run of
 * non `[\w.-]` characters — including the `/` folder separators — collapsed to
 * `-`. So `a/b/c` and `a/b-c` flatten to the same name. Used to detect fixtures
 * that would share a baseline.
 */
export const snapshotNameKey = (relativePath: string): string =>
  relativePath.replace(/\.mmd$/i, '').replace(/[^\w.-]+/g, '-');

/**
 * Throws if two fixtures collapse to the same snapshot name — otherwise they
 * would write/compare the same screenshot and one would silently mask the
 * other (and churn the Argos baseline). Called once at test registration.
 */
export const assertUniqueSnapshotNames = (relativePaths: readonly string[]): void => {
  const byKey = new Map<string, string[]>();
  for (const relativePath of relativePaths) {
    const key = snapshotNameKey(relativePath);
    const bucket = byKey.get(key);
    if (bucket) {
      bucket.push(relativePath);
    } else {
      byKey.set(key, [relativePath]);
    }
  }
  const collisions = [...byKey.values()].filter((paths) => paths.length > 1);
  if (collisions.length > 0) {
    throw new Error(
      'mmd fixtures collapse to the same snapshot name (one would mask another):\n' +
        collisions.map((paths) => `  ${paths.join('  ==  ')}`).join('\n')
    );
  }
};
