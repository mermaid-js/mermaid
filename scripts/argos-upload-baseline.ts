/**
 * Upload the full Argos baseline — composite sheets plus individual
 * screenshots — as one parallel build, in size-balanced slices.
 *
 * Runs on pushes to the baseline branch (develop): merges `e2e/sheets` and
 * `e2e/screenshots` into one upload root so the default build's baseline is a
 * superset that grouped PR runs and per-screenshot manual runs can both diff
 * against (each marked --subset).
 *
 * A single upload of the whole tree fails: Argos's finalize request carries
 * the file list, and one body for ~3000 screenshots exceeds its size limit
 * (HTTP 413). Bucketing by top-level folder doesn't help — `rendering/` alone
 * is most of the suite — so leaf directories (those directly holding images)
 * are bin-packed by image count into up to MAX_SLICES balanced slices, each
 * uploaded with --parallel under the shared ARGOS_PARALLEL_NONCE.
 *
 * Slice globs are non-recursive (`dir/*.png`, not `dir/**`) so the slices
 * stay a disjoint partition of the tree, and match only images: a recursive
 * glob would also pick up the `<name>.png.argos.json` metadata sidecars,
 * which Argos treats as screenshots and whose doubled `<sidecar>.argos.json`
 * lookup overflows the 255-byte filename limit (ENAMETOOLONG, surfaced as
 * "Failed to read metadata").
 *
 *   pnpm run argos:upload-baseline
 *   pnpm run argos:upload-baseline -- --dry-run   # print the slices, skip upload
 */

import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_SLICES = 5;
const IMAGE_PATTERN = /\.(png|jpe?g)$/i;

function log(message: string): void {
  process.stdout.write(`[argos-baseline] ${message}\n`);
}

/** A directory that directly holds images, with how many it holds. */
export interface LeafDir {
  dir: string;
  images: number;
}

/** Relative paths of every image under `root`, using `/` separators. */
export function collectImageRelPaths(root: string): string[] {
  return readdirSync(root, { recursive: true, encoding: 'utf8' })
    .map((rel) => rel.replaceAll('\\', '/'))
    .filter((rel) => IMAGE_PATTERN.test(rel))
    .sort();
}

/** Leaf directories (`.` for the root itself) with their direct image counts. */
export function countLeafDirs(imageRelPaths: readonly string[]): LeafDir[] {
  const counts = new Map<string, number>();
  for (const rel of imageRelPaths) {
    const dir = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '.';
    counts.set(dir, (counts.get(dir) ?? 0) + 1);
  }
  return [...counts]
    .map(([dir, images]) => ({ dir, images }))
    .sort((a, b) => (a.dir < b.dir ? -1 : 1));
}

/**
 * Bin-pack leaf directories into at most `maxSlices` size-balanced slices:
 * largest directory first, each into the currently lightest slice. Empty
 * slices are dropped so `--parallel-total` matches the number of uploads
 * Argos actually waits for. Deterministic for a given input set (ties break
 * on directory name), regardless of input order.
 */
export function planSlices(leafDirs: readonly LeafDir[], maxSlices: number): LeafDir[][] {
  const slices = Array.from({ length: Math.max(1, maxSlices) }, () => ({
    dirs: [] as LeafDir[],
    images: 0,
  }));
  const heaviestFirst = [...leafDirs].sort(
    (a, b) => b.images - a.images || (a.dir < b.dir ? -1 : 1)
  );
  for (const leaf of heaviestFirst) {
    const lightest = slices.reduce((best, slice) => (slice.images < best.images ? slice : best));
    lightest.dirs.push(leaf);
    lightest.images += leaf.images;
  }
  return slices
    .filter((slice) => slice.dirs.length > 0)
    .map((slice) => [...slice.dirs].sort((a, b) => (a.dir < b.dir ? -1 : 1)));
}

/** Non-recursive image globs for one slice, as passed to `argos upload --files`. */
export function sliceGlobs(dirs: readonly LeafDir[]): string[] {
  return dirs.map(({ dir }) => (dir === '.' ? '*.{png,jpg,jpeg}' : `${dir}/*.{png,jpg,jpeg}`));
}

function main(): void {
  const dryRun = process.argv.includes('--dry-run');
  const baselineDir = process.env.BASELINE_DIR ?? 'e2e/argos-baseline';
  const sources = ['e2e/sheets', 'e2e/screenshots'].filter((dir) => existsSync(dir));
  if (sources.length === 0) {
    throw new Error('neither e2e/sheets nor e2e/screenshots exists — nothing to upload');
  }

  mkdirSync(baselineDir, { recursive: true });
  for (const source of sources) {
    cpSync(source, baselineDir, { recursive: true });
    log(`merged ${source} into ${baselineDir}`);
  }

  const images = collectImageRelPaths(resolve(baselineDir));
  const leafDirs = countLeafDirs(images);
  const slices = planSlices(leafDirs, MAX_SLICES);
  log(
    `planned ${slices.length} upload slices for ${images.length} images ` +
      `across ${leafDirs.length} leaf dirs ` +
      `(${slices.map((dirs) => dirs.reduce((n, d) => n + d.images, 0)).join('+')})`
  );

  if (dryRun) {
    for (const [i, dirs] of slices.entries()) {
      log(`slice ${i + 1}/${slices.length}: ${sliceGlobs(dirs).join(' ')}`);
    }
    return;
  }

  if (!process.env.ARGOS_PARALLEL_NONCE) {
    throw new Error('ARGOS_PARALLEL_NONCE must be set — parallel slices must share a nonce');
  }

  for (const [i, dirs] of slices.entries()) {
    const args = [
      'exec',
      'argos',
      'upload',
      baselineDir,
      '--files',
      ...sliceGlobs(dirs),
      '--parallel',
      '--parallel-total',
      String(slices.length),
      '--parallel-index',
      String(i + 1),
    ];
    log(`uploading slice ${i + 1}/${slices.length}: pnpm ${args.join(' ')}`);
    const result = spawnSync('pnpm', args, { stdio: 'inherit', env: process.env });
    if (result.error) {
      throw new Error(`Failed to run "pnpm ${args.join(' ')}": ${result.error.message}`);
    }
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
