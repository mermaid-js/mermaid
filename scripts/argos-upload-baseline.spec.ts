import { afterAll, beforeAll, describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectLeafDirs, planBuckets, type LeafDir } from './argos-upload-baseline.ts';

describe('planBuckets', () => {
  const leaves: LeafDir[] = [
    { dir: 'rendering/a', count: 100 },
    { dir: 'rendering/b', count: 50 },
    { dir: 'class', count: 30 },
    { dir: 'flowchart', count: 20 },
    { dir: 'pie', count: 5 },
  ];

  it('partitions every leaf dir exactly once (disjoint + complete)', () => {
    const placed = planBuckets(leaves, 3).flat();
    expect(placed).toHaveLength(leaves.length);
    expect(new Set(placed.map((l) => l.dir)).size).toBe(leaves.length);
  });

  it('balances buckets by image count', () => {
    const buckets = planBuckets(leaves, 3);
    const loads = buckets.map((b) => b.reduce((s, l) => s + l.count, 0));
    // total 205 over 3 buckets → ideal ~68; greedy keeps the max near the largest single dir (100)
    expect(Math.max(...loads)).toBeLessThanOrEqual(105);
  });

  it('is deterministic', () => {
    expect(planBuckets(leaves, 3)).toEqual(planBuckets(leaves, 3));
  });

  it('drops empty buckets so length is the parallel-total to report', () => {
    // 5 dirs into 10 buckets → only 5 non-empty
    expect(planBuckets(leaves, 10)).toHaveLength(5);
  });
});

describe('collectLeafDirs', () => {
  let root: string;
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'argos-leaf-'));
    // sheet PNGs directly in a group dir
    await mkdir(join(root, 'rendering/sequence'), { recursive: true });
    await writeFile(join(root, 'rendering/sequence/sequence-001.png'), '');
    // individual screenshots nested under a spec's argos dir, with a sidecar
    await mkdir(join(root, 'rendering/sequence/seq.spec.js/argos'), { recursive: true });
    await writeFile(join(root, 'rendering/sequence/seq.spec.js/argos/a.png'), '');
    await writeFile(join(root, 'rendering/sequence/seq.spec.js/argos/a.png.argos.json'), '{}');
    await mkdir(join(root, 'class/class.spec.ts/argos'), { recursive: true });
    await writeFile(join(root, 'class/class.spec.ts/argos/b.png'), '');
  });
  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('finds dirs that directly contain images, counts images only (ignores sidecars)', () => {
    const leaves = collectLeafDirs(root);
    const byDir = Object.fromEntries(leaves.map((l) => [l.dir, l.count]));
    expect(byDir).toEqual({
      'rendering/sequence': 1, // the sheet, non-recursively (not the nested spec images)
      'rendering/sequence/seq.spec.js/argos': 1, // .argos.json not counted
      'class/class.spec.ts/argos': 1,
    });
  });

  it('returns leaf dirs sorted by path (deterministic)', () => {
    const dirs = collectLeafDirs(root).map((l) => l.dir);
    expect(dirs).toEqual([...dirs].sort((a, b) => a.localeCompare(b)));
  });
});
