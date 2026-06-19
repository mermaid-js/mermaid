/**
 * Uploads the develop Argos baseline — the grouped composite sheets plus the
 * individual per-test screenshots — as a single Argos build, split into K
 * size-balanced parallel uploads.
 *
 * Why split: a develop push uploads both representations so the baseline is a
 * superset that both grouped PRs and per-screenshot runs can diff against.
 * Argos's finalize PUT inlines per-screenshot metadata (including the base64
 * diagram source), so sending the whole superset in one request exceeds the API
 * body limit (HTTP 413). We therefore upload K parallel slices sharing one nonce
 * (ARGOS_PARALLEL_NONCE), which Argos combines into one build once all report.
 *
 * Why balance by leaf directory: bucketing by top-level folder is uneven —
 * `rendering/` alone is ~60% of the suite, so one bucket stayed oversized and
 * still 413'd regardless of K. We bin-pack the leaf directories (those that
 * directly contain images) by image count, so the largest bucket is ~1/K of the
 * suite. Each leaf dir is globbed non-recursively (`<dir>/*`) so the slices stay
 * a disjoint partition and the `<name>.png.argos.json` metadata sidecars are
 * never matched as screenshots.
 *
 * CLI usage:
 *   pnpm run argos:upload-baseline
 *   ARGOS_PARALLEL_TOTAL=5 pnpm run argos:upload-baseline
 */

import { cpSync, mkdirSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const SHEETS_DIR = process.env.ARGOS_SHEETS_DIR ?? 'cypress/argos-sheets';
const SCREENSHOT_DIR = process.env.ARGOS_SCREENSHOT_DIR ?? 'cypress/screenshots';
const BASELINE_DIR = process.env.ARGOS_BASELINE_DIR ?? 'cypress/argos-baseline';
const PARALLEL_TOTAL = Number(process.env.ARGOS_PARALLEL_TOTAL ?? 5);

const IMAGE_RE = /\.(?:png|jpe?g)$/i;

export interface LeafDir {
  /** Path relative to the upload root, forward-slashed. */
  dir: string;
  /** Number of images directly inside `dir` (non-recursive). */
  count: number;
}

/** Collects every directory under `root` that directly contains images, with counts. Sorted by path. */
export function collectLeafDirs(root: string): LeafDir[] {
  const leaves: LeafDir[] = [];
  const walk = (abs: string): void => {
    let direct = 0;
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(join(abs, entry.name));
      } else if (IMAGE_RE.test(entry.name)) {
        direct++;
      }
    }
    if (direct > 0) {
      leaves.push({ dir: relative(root, abs).split(sep).join('/'), count: direct });
    }
  };
  walk(root);
  return leaves.sort((a, b) => a.dir.localeCompare(b.dir));
}

/**
 * Greedy largest-first bin-pack of leaf dirs into `k` buckets balanced by image
 * count. Deterministic: ties broken by path. Empty buckets are dropped, so the
 * result length is the parallel-total to report to Argos.
 */
export function planBuckets(leafDirs: LeafDir[], k: number): LeafDir[][] {
  const buckets: LeafDir[][] = Array.from({ length: Math.max(1, k) }, () => []);
  const load = new Array(buckets.length).fill(0);
  const ordered = [...leafDirs].sort((a, b) => b.count - a.count || a.dir.localeCompare(b.dir));
  for (const leaf of ordered) {
    let min = 0;
    for (let i = 1; i < load.length; i++) {
      if (load[i] < load[min]) {
        min = i;
      }
    }
    buckets[min].push(leaf);
    load[min] += leaf.count;
  }
  return buckets.filter((bucket) => bucket.length > 0);
}

function main(): void {
  // Merge sheets + individual screenshots into one upload root. Their relative
  // paths don't collide (sheets: <group>/<name>-NNN.png; individuals:
  // <group>/<spec>.spec.js/argos/<name>.png), so a plain merge preserves both
  // naming schemes — exactly what scoped PR / manual runs upload.
  mkdirSync(BASELINE_DIR, { recursive: true });
  cpSync(SHEETS_DIR, BASELINE_DIR, { recursive: true });
  cpSync(SCREENSHOT_DIR, BASELINE_DIR, { recursive: true });

  const leafDirs = collectLeafDirs(BASELINE_DIR);
  const buckets = planBuckets(leafDirs, PARALLEL_TOTAL);
  const total = leafDirs.reduce((sum, leaf) => sum + leaf.count, 0);
  const largest = Math.max(...buckets.map((b) => b.reduce((s, l) => s + l.count, 0)));
  process.stdout.write(
    `[argos-baseline] ${total} images in ${leafDirs.length} leaf dirs → ${buckets.length} parallel uploads ` +
      `(largest ${largest}, ~${Math.round((100 * largest) / total)}%)\n`
  );

  buckets.forEach((bucket, i) => {
    // Non-recursive glob per leaf dir → disjoint slices, images only.
    const files = bucket.map((leaf) => `${leaf.dir}/*.{png,jpg,jpeg}`);
    execFileSync(
      'npx',
      [
        'argos',
        'upload',
        BASELINE_DIR,
        '--files',
        ...files,
        '--parallel',
        '--parallel-total',
        String(buckets.length),
        '--parallel-index',
        String(i + 1),
      ],
      { stdio: 'inherit' }
    );
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
