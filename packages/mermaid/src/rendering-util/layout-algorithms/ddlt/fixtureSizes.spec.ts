import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DDLT_SIZE_CAPTURE_VERSION, hashDdltFixtureSource } from './fixtureFreshness.js';
import { loadFreshSizesFixture } from './fixtureSizes.js';

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ddlt-sizes-'));
  tempDirs.push(dir);
  return dir;
}

describe('loadFreshSizesFixture', () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { force: true, recursive: true });
    }
  });

  it('loads a metadata-backed fixture when it matches the current Mermaid source', () => {
    const dir = makeTempDir();
    const mmdPath = join(dir, 'fresh.mmd');
    const sizesPath = join(dir, 'fresh.sizes.json');
    const source = 'flowchart TB\n  a --> b\n';
    writeFileSync(mmdPath, source);
    writeFileSync(
      sizesPath,
      JSON.stringify({
        metadata: {
          captureVersion: DDLT_SIZE_CAPTURE_VERSION,
          sourceSha256: hashDdltFixtureSource(source),
        },
        nodes: [{ id: 'a', width: 67, height: 51 }],
      })
    );

    expect(loadFreshSizesFixture(sizesPath, mmdPath, 'fresh').nodes).toHaveLength(1);
  });

  it('rejects a fixture without freshness metadata', () => {
    const dir = makeTempDir();
    const mmdPath = join(dir, 'legacy.mmd');
    const sizesPath = join(dir, 'legacy.sizes.json');
    writeFileSync(mmdPath, 'flowchart TB\n  a --> b\n');
    writeFileSync(sizesPath, JSON.stringify({ nodes: [] }));

    expect(() => loadFreshSizesFixture(sizesPath, mmdPath, 'legacy')).toThrow(
      /missing freshness metadata/
    );
  });

  it('does not mutate the fixture file while validating freshness', () => {
    const dir = makeTempDir();
    const mmdPath = join(dir, 'readonly.mmd');
    const sizesPath = join(dir, 'readonly.sizes.json');
    const source = 'flowchart TB\n  a --> b\n';
    const fixtureText = JSON.stringify({
      metadata: {
        captureVersion: DDLT_SIZE_CAPTURE_VERSION,
        sourceSha256: hashDdltFixtureSource(source),
      },
      nodes: [],
    });
    writeFileSync(mmdPath, source);
    writeFileSync(sizesPath, fixtureText);

    loadFreshSizesFixture(sizesPath, mmdPath, 'readonly');

    expect(readFileSync(sizesPath, 'utf-8')).toBe(fixtureText);
  });
});
