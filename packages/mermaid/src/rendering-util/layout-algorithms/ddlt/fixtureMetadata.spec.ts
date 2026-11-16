import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { discoverLayoutTestFixtures } from './discoverFixtures.js';
import { DDLT_SIZE_CAPTURE_VERSION, hashDdltFixtureSource } from './fixtureFreshness.js';
import * as paths from './paths.js';

const tempDirs: string[] = [];

describe('DDLT layout-test size fixture metadata', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { force: true, recursive: true });
    }
  });

  it('requires every discovered swimlane captured-size fixture to match its current source', () => {
    // Scoped to `swimlanes/` until other slices (domus, …) land on this branch
    // with their refreshed metadata blocks. This protects DDLT from validating
    // a layout against browser sizes captured for a different Mermaid source.
    const fixtures = discoverLayoutTestFixtures().filter((f) => f.id.startsWith('swimlanes/'));
    const staleOrLegacy = fixtures
      .map((fixture) => {
        const metadata = fixture.sizes.metadata;
        const sourceSha256 = hashDdltFixtureSource(readFileSync(fixture.mmdPath, 'utf-8'));
        if (
          metadata?.captureVersion === DDLT_SIZE_CAPTURE_VERSION &&
          metadata.sourceSha256 === sourceSha256
        ) {
          return undefined;
        }
        return {
          id: fixture.id,
          captureVersion: metadata?.captureVersion,
          sourceSha256: metadata?.sourceSha256,
          expectedSourceSha256: sourceSha256,
        };
      })
      .filter((value): value is NonNullable<typeof value> => value !== undefined);

    expect(staleOrLegacy).toEqual([]);
  });

  it.each([
    { manifestProfile: undefined, expectedProfile: 'grid' },
    { manifestProfile: 'flowchart-domus', expectedProfile: 'flowchart-domus' },
  ])(
    'discovers grid fixtures with manifest profile $manifestProfile as $expectedProfile',
    ({ manifestProfile, expectedProfile }) => {
      const sourceDir = join(paths.layoutTestsDir(), 'grid');
      const dir = mkdtempSync(join(tmpdir(), 'ddlt-profile-'));
      tempDirs.push(dir);
      mkdirSync(join(dir, 'grid'));
      for (const extension of ['mmd', 'sizes.json']) {
        copyFileSync(
          join(sourceDir, `simple.${extension}`),
          join(dir, 'grid', `simple.${extension}`)
        );
      }
      if (manifestProfile !== undefined) {
        writeFileSync(
          join(dir, 'ddlt-manifest.json'),
          JSON.stringify({ fixtures: [{ id: 'grid/simple', profile: manifestProfile }] })
        );
      }
      vi.spyOn(paths, 'layoutTestsDir').mockReturnValue(dir);

      expect(discoverLayoutTestFixtures()).toEqual([
        expect.objectContaining({ id: 'grid/simple', profile: expectedProfile }),
      ]);
    }
  );
});
