/**
 * Rewrites captured Cypress screenshot paths to a deterministic, shard-independent
 * location before they are batched/uploaded to Argos.
 *
 * Why: Cypress names a screenshot's folder by the spec path relative to the
 * *common ancestor of the specs that ran in that invocation*. `cypress-split`
 * gives each shard a different subset, so a shard running only `rendering/**`
 * specs strips the `rendering/` prefix (`state/…`) while a shard that also got a
 * non-rendering spec keeps it (`rendering/state/…`). The same diagram therefore
 * gets a different Argos name run-to-run, which inflates the screenshot count and
 * produces huge spurious diffs against the baseline.
 *
 * Fix: re-root every screenshot under its spec's true path relative to
 * `cypress/integration`. Spec file names are unique across the suite, so the spec
 * directory segment that precedes Cypress's `/argos/` marker uniquely identifies
 * the spec. The canonical form equals the `rendering/…` ("kept") variant, so most
 * screenshots are unchanged and the one-time churn is limited to the stripped
 * ones.
 *
 * CLI usage:
 *   pnpm run argos:canonicalize
 *   ARGOS_SCREENSHOT_DIR=cypress/screenshots ARGOS_INTEGRATION_DIR=cypress/integration
 *     pnpm run argos:canonicalize
 */

import { readdir, rename, mkdir } from 'node:fs/promises';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCREENSHOT_DIR = process.env.ARGOS_SCREENSHOT_DIR ?? 'cypress/screenshots';
const INTEGRATION_DIR = process.env.ARGOS_INTEGRATION_DIR ?? 'cypress/integration';

const SPEC_SEGMENT_RE = /\.spec\.[cm]?[jt]s$/;
/** Cypress saves argosScreenshot files under an `argos/` namespace inside the spec folder. */
const ARGOS_MARKER = '/argos/';

/**
 * Maps a captured screenshot path to its deterministic location.
 *
 * `relPath` looks like `<maybe-stripped-dirs>/<spec>.spec.js/argos/<name>.png`
 * (or `.png.argos.json`). The segment right before `/argos/` is the spec
 * directory, whose basename uniquely identifies the spec; we rewrite the part
 * before `/argos/` to that spec's full path relative to `cypress/integration`.
 *
 * Returns `relPath` unchanged when it has no `/argos/` marker or the spec is
 * unknown (so non-spec assets pass through untouched, and the function is a no-op
 * on already-canonical paths).
 */
export function canonicalScreenshotPath(
  relPath: string,
  specPathByBasename: Map<string, string>
): string {
  const marker = relPath.indexOf(ARGOS_MARKER);
  if (marker === -1) {
    return relPath;
  }
  const specDir = relPath.slice(0, marker);
  const rest = relPath.slice(marker + ARGOS_MARKER.length);
  const specBasename = specDir.split('/').pop() ?? '';
  if (!SPEC_SEGMENT_RE.test(specBasename)) {
    return relPath;
  }
  const canonicalSpec = specPathByBasename.get(specBasename);
  if (!canonicalSpec || canonicalSpec === specDir) {
    return relPath;
  }
  return `${canonicalSpec}/argos/${rest}`;
}

/** Builds basename → path-relative-to-`integrationDir` for every spec file. */
export async function buildSpecMap(integrationDir: string): Promise<Map<string, string>> {
  const entries = await readdir(integrationDir, { recursive: true, withFileTypes: true });
  const map = new Map<string, string>();
  for (const entry of entries) {
    if (!entry.isFile() || !SPEC_SEGMENT_RE.test(entry.name)) {
      continue;
    }
    const abs = join(entry.parentPath ?? entry.path, entry.name);
    const rel = relative(integrationDir, abs).split(sep).join('/');
    const existing = map.get(entry.name);
    if (existing && existing !== rel) {
      throw new Error(
        `Duplicate spec file name "${entry.name}" (${existing} vs ${rel}); canonicalization needs unique spec file names.`
      );
    }
    map.set(entry.name, rel);
  }
  return map;
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) =>
      relative(dir, join(e.parentPath ?? e.path, e.name))
        .split(sep)
        .join('/')
    );
}

async function main(): Promise<void> {
  const specPathByBasename = await buildSpecMap(INTEGRATION_DIR);
  const files = await listFiles(SCREENSHOT_DIR);

  let moved = 0;
  for (const rel of files) {
    const canonical = canonicalScreenshotPath(rel, specPathByBasename);
    if (canonical === rel) {
      continue;
    }
    const from = join(SCREENSHOT_DIR, rel);
    const to = join(SCREENSHOT_DIR, canonical);
    await mkdir(dirname(to), { recursive: true });
    await rename(from, to);
    moved++;
  }
  process.stdout.write(
    `[argos-canonicalize] ${files.length} files, ${moved} re-rooted to their canonical spec path\n`
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main();
}
