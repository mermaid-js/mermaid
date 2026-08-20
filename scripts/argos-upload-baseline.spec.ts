import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  collectImageRelPaths,
  countLeafDirs,
  planSlices,
  sliceGlobs,
  type LeafDir,
} from './argos-upload-baseline.js';

const leaf = (dir: string, images: number): LeafDir => ({ dir, images });

describe('countLeafDirs', () => {
  it('counts direct images per directory, with the root as "."', () => {
    expect(
      countLeafDirs([
        'diagrams/pie/a.png',
        'diagrams/pie/b.png',
        'rendering/theme.spec.js/theme-001.png',
        'top-level.png',
      ])
    ).toEqual([leaf('.', 1), leaf('diagrams/pie', 2), leaf('rendering/theme.spec.js', 1)]);
  });
});

describe('planSlices', () => {
  const totalImages = (slices: LeafDir[][]) =>
    slices.flat().reduce((sum, { images }) => sum + images, 0);

  it('partitions every directory into exactly one slice', () => {
    const dirs = Array.from({ length: 17 }, (_, i) =>
      leaf(`d${String(i).padStart(2, '0')}`, i + 1)
    );
    const slices = planSlices(dirs, 5);
    const seen = slices.flat().map(({ dir }) => dir);
    expect(seen.length).toBe(dirs.length);
    expect(new Set(seen).size).toBe(dirs.length);
    expect(totalImages(slices)).toBe(dirs.reduce((sum, { images }) => sum + images, 0));
  });

  it('balances by image count, so one huge directory cannot drag others with it', () => {
    // One dominant dir (the old top-level-folder bucketing put ~60% of the
    // suite into a single slice, which is what tripped the 413).
    const dirs = [
      leaf('rendering/big', 60),
      ...Array.from({ length: 8 }, (_, i) => leaf(`d${i}`, 10)),
    ];
    const slices = planSlices(dirs, 5);
    const sizes = slices.map((dirsInSlice) => dirsInSlice.reduce((sum, d) => sum + d.images, 0));
    // The dominant dir gets a slice to itself; the rest spread over the others.
    expect(Math.max(...sizes)).toBe(60);
    expect(slices.find((s) => s.some((d) => d.dir === 'rendering/big'))).toHaveLength(1);
  });

  it('drops empty slices so --parallel-total matches the uploads Argos waits for', () => {
    expect(planSlices([leaf('a', 1), leaf('b', 1)], 5)).toHaveLength(2);
    expect(planSlices([], 5)).toHaveLength(0);
  });

  it('is deterministic regardless of input order', () => {
    const dirs = [leaf('a', 3), leaf('b', 3), leaf('c', 7), leaf('d', 1)];
    const shuffled = [dirs[2], dirs[0], dirs[3], dirs[1]];
    expect(planSlices(shuffled, 3)).toEqual(planSlices(dirs, 3));
  });
});

describe('sliceGlobs', () => {
  it('emits non-recursive image globs, with the bare pattern for the root', () => {
    expect(sliceGlobs([leaf('.', 1), leaf('diagrams/pie', 2)])).toEqual([
      '*.{png,jpg,jpeg}',
      'diagrams/pie/*.{png,jpg,jpeg}',
    ]);
  });
});

describe('collectImageRelPaths', () => {
  let root: string | undefined;
  afterEach(() => {
    if (root) {
      rmSync(root, { recursive: true, force: true });
      root = undefined;
    }
  });

  it('finds images recursively and leaves metadata sidecars out', () => {
    root = mkdtempSync(join(tmpdir(), 'argos-baseline-'));
    mkdirSync(join(root, 'diagrams/pie'), { recursive: true });
    writeFileSync(join(root, 'diagrams/pie/a.png'), 'png');
    writeFileSync(join(root, 'diagrams/pie/a.png.argos.json'), '{}');
    writeFileSync(join(root, 'sheet-001.jpg'), 'jpg');
    expect(collectImageRelPaths(root)).toEqual(['diagrams/pie/a.png', 'sheet-001.jpg']);
  });
});
