import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { discoverLayoutTestFixtures } from './discoverFixtures.js';
import { DDLT_SIZE_CAPTURE_VERSION, hashDdltFixtureSource } from './fixtureFreshness.js';

describe('DDLT layout-test size fixture metadata', () => {
  it('requires every discovered swimlane captured-size fixture to match its current source', () => {
    // Scoped to `swimlanes/` until other slices (domus, …) land on this branch
    // with their refreshed metadata blocks. This protects DDLT from validating
    // a layout against browser sizes captured for a different Mermaid source.
    const fixtures = discoverLayoutTestFixtures().filter((f) => f.id.startsWith('swimlanes/'));
    const staleOrLegacy = fixtures
      .map((fixture) => {
        const metadata = fixture.sizes.metadata;
        const sourceSha256 = hashDdltFixtureSource(readFileSync(fixture.mmdPath, 'utf-8'));
        // A supported version, not the latest one: capture versions only add
        // optional fields, so a swimlane fixture stays valid when a version is
        // introduced for something it does not use. What must hold is that the
        // sizes still describe the current `.mmd`.
        const captureVersion = metadata?.captureVersion;
        const versionSupported =
          typeof captureVersion === 'number' &&
          captureVersion >= 1 &&
          captureVersion <= DDLT_SIZE_CAPTURE_VERSION;
        if (versionSupported && metadata?.sourceSha256 === sourceSha256) {
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
});
