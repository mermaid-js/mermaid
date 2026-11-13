import { describe, expect, it } from 'vitest';
import {
  DDLT_SIZE_CAPTURE_VERSION,
  assertSizesFixtureFresh,
  hashDdltFixtureSource,
} from './fixtureFreshness.js';
import type { SizesFixture } from './types.js';

const SOURCE = 'flowchart TB\n  a --> b\n';

function fixtureFor(source: string): SizesFixture {
  return {
    metadata: {
      captureVersion: DDLT_SIZE_CAPTURE_VERSION,
      sourceSha256: hashDdltFixtureSource(source),
    },
    nodes: [
      {
        id: 'a',
        width: 67,
        height: 51,
      },
    ],
  };
}

describe('DDLT size fixture freshness guard', () => {
  it('accepts metadata captured from the current source', () => {
    const fixture = fixtureFor(SOURCE);

    expect(() =>
      assertSizesFixtureFresh(fixture, { fixtureId: 'fresh', mmdSource: SOURCE })
    ).not.toThrow();
  });

  it('rejects metadata captured from a different source', () => {
    const fixture = fixtureFor('flowchart TB\n  stale --> source\n');

    expect(() =>
      assertSizesFixtureFresh(fixture, { fixtureId: 'stale', mmdSource: SOURCE })
    ).toThrow(/stale DDLT size fixture "stale"/);
  });

  it('rejects metadata captured by an old size-capture contract', () => {
    const fixture = fixtureFor(SOURCE);
    fixture.metadata = {
      ...fixture.metadata,
      captureVersion: DDLT_SIZE_CAPTURE_VERSION - 1,
    };

    expect(() =>
      assertSizesFixtureFresh(fixture, { fixtureId: 'old-version', mmdSource: SOURCE })
    ).toThrow(/unsupported DDLT size fixture "old-version"/);
  });

  it('allows legacy fixtures by default but can require metadata', () => {
    const legacy: SizesFixture = { nodes: [] };

    expect(() =>
      assertSizesFixtureFresh(legacy, { fixtureId: 'legacy', mmdSource: SOURCE })
    ).not.toThrow();
    expect(() =>
      assertSizesFixtureFresh(legacy, {
        fixtureId: 'legacy',
        mmdSource: SOURCE,
        requireMetadata: true,
      })
    ).toThrow(/missing freshness metadata/);
  });
});
