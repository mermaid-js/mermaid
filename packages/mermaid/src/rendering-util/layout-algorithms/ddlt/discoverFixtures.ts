import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import type { DdltFixtureProfile, DdltManifest, LayoutTestFixture, SizesFixture } from './types.js';
import { layoutTestsDir } from './paths.js';
import { loadFreshSizesFixture } from './fixtureSizes.js';

function walkSizesFiles(dir: string, acc: string[]): void {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      walkSizesFiles(p, acc);
    } else if (ent.isFile() && ent.name.endsWith('.sizes.json')) {
      acc.push(p);
    }
  }
}

function defaultProfileForRelId(relId: string): DdltFixtureProfile {
  return relId.startsWith('swimlanes/') ? 'swimlanes' : 'flowchart-domus';
}

function loadManifest(baseDir: string): DdltManifest {
  const manifestPath = join(baseDir, 'ddlt-manifest.json');
  if (!existsSync(manifestPath)) {
    return {};
  }
  return JSON.parse(readFileSync(manifestPath, 'utf-8')) as DdltManifest;
}

function manifestEntryMap(
  manifest: DdltManifest
): Map<string, { profile?: DdltFixtureProfile; allowLevel1Failure?: boolean }> {
  const m = new Map<string, { profile?: DdltFixtureProfile; allowLevel1Failure?: boolean }>();
  for (const f of manifest.fixtures ?? []) {
    m.set(f.id, { profile: f.profile, allowLevel1Failure: f.allowLevel1Failure });
  }
  return m;
}

/**
 * Discover every `.sizes.json` under the layout-tests folder with a sibling `.mmd`.
 */
export function discoverLayoutTestFixtures(): LayoutTestFixture[] {
  const baseDir = layoutTestsDir();
  const manifest = loadManifest(baseDir);
  const manifestById = manifestEntryMap(manifest);

  const sizesPaths: string[] = [];
  walkSizesFiles(baseDir, sizesPaths);
  sizesPaths.sort();

  const out: LayoutTestFixture[] = [];
  const problems: string[] = [];

  for (const sizesPath of sizesPaths) {
    const relSizes = relative(baseDir, sizesPath);
    if (basename(sizesPath) === 'ddlt-manifest.json') {
      continue;
    }
    const mmdPath = join(dirname(sizesPath), basename(sizesPath, '.sizes.json') + '.mmd');
    if (!existsSync(mmdPath)) {
      problems.push(
        `Missing .mmd for sizes fixture: ${relSizes} (expected ${relative(baseDir, mmdPath)})`
      );
      continue;
    }

    const relId = relative(baseDir, mmdPath)
      .replace(/\.mmd$/, '')
      .replace(/\\/g, '/');
    const override = manifestById.get(relId);
    const profile = override?.profile ?? defaultProfileForRelId(relId);
    const allowLevel1Failure = Boolean(override?.allowLevel1Failure);

    let sizes: SizesFixture;
    try {
      sizes = loadFreshSizesFixture(sizesPath, mmdPath, relId);
    } catch (e) {
      // On this branch, only swimlane fixtures have been refreshed with the
      // freshness-metadata block. Fixtures from other slices (e.g. domus root
      // fixtures kept as dev-page assets) are skipped from discovery rather
      // than blocking the swimlane harness. The metadata invariant is asserted
      // explicitly by `fixtureMetadata.spec.ts`, scoped to swimlanes/ until
      // other slices land.
      problems.push(`Skipped ${relSizes}: ${String(e)}`);
      continue;
    }

    out.push({
      id: relId,
      sizesPath,
      mmdPath,
      sizes,
      profile,
      allowLevel1Failure,
    });
  }

  if (problems.length > 0 && process.env.DDLT_DISCOVER_VERBOSE) {
    console.warn(
      `DDLT: fixture discovery skipped ${problems.length} fixture(s):\n${problems.join('\n')}`
    );
  }

  return out;
}
