#!/usr/bin/env node
/**
 * Builds the Playwright spec pattern for a given set of fixture/spec
 * tiers (e.g. just "pr-check", or "pr-check"+"nightly-check" for the
 * nightly build): every diagram's curated tier-subfolder hand-written
 * specs under e2e/rendering, the cross-cutting specs under e2e/other
 * (xss, ghsa, configuration, etc. — only ever has a pr-check/ subfolder
 * today), plus the global mmd snapshot runner (which is separately
 * tier-filtered to each diagram's matching fixtures under e2e/diagrams
 * at runtime, via MERMAID_E2E_FIXTURE_TIER — pass it the same tier list,
 * comma-separated).
 *
 * Convention: every diagram folder under e2e/rendering may have a
 * subfolder per tier (pr-check/nightly-check/visual-check). No hardcoded
 * diagram list — discovered at runtime, same as
 * scripts/e2e-diagram-scope.mjs.
 *
 * Used by:
 *   - .github/workflows/e2e.yml's detect-scope job, tier ["pr-check"],
 *     when a PR on this fork carries the "run pr tests" label (develop);
 *     tiers ["pr-check","nightly-check"] for the "run release test" label
 *     (master) — visual-check is deliberately excluded from this
 *     automated gate; see that workflow's comments.
 *   - .github/workflows/nightly-e2e.yml, tiers ["pr-check","nightly-check"].
 *
 * CLI usage (one or more tier names; defaults to "pr-check" if none given):
 *   node scripts/e2e-tier-scope.mjs pr-check
 *   node scripts/e2e-tier-scope.mjs pr-check nightly-check
 *
 * Module usage:
 *   import { buildTierSpecPattern } from './e2e-tier-scope.mjs';
 *   buildTierSpecPattern(['pr-check', 'nightly-check']);
 */

import { existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';

export const SPEC_BASE_DIR = 'e2e/rendering';
export const MMD_SNAPSHOTS_SPEC = `${SPEC_BASE_DIR}/mmd-snapshots.spec.ts`;
// e2e/other/ holds cross-cutting specs (xss, ghsa, configuration, iife,
// interaction, rerender, external-diagrams) — not a per-diagram folder, so
// it isn't discovered by the e2e/rendering scan below and is checked
// explicitly instead.
export const OTHER_DIR = 'e2e/other';

/**
 * @param {string} tier
 * @returns {string} e2e/other's subfolder for that tier (e.g. 'e2e/other/pr').
 */
export const otherTierDir = (tier) => `${OTHER_DIR}/${tier}`;

/**
 * @param {readonly string[]} tiers - one or more tier names, e.g. ['pr'] or ['pr', 'nightly'].
 * @param {string} [specBaseDir]
 * @returns {string} Comma-separated, sorted spec pattern for `playwright test`.
 */
export function buildTierSpecPattern(tiers, specBaseDir = SPEC_BASE_DIR) {
  if (!tiers || tiers.length === 0) {
    throw new Error('buildTierSpecPattern requires at least one tier name');
  }

  const specs = new Set();

  let entries;
  try {
    entries = readdirSync(specBaseDir, { withFileTypes: true });
  } catch {
    entries = [];
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    for (const tier of tiers) {
      const tierDir = `${specBaseDir}/${entry.name}/${tier}`;
      if (existsSync(tierDir)) {
        specs.add(`${tierDir}/`);
      }
    }
  }

  for (const tier of tiers) {
    const otherDir = otherTierDir(tier);
    if (existsSync(otherDir)) {
      specs.add(`${otherDir}/`);
    }
  }

  specs.add(MMD_SNAPSHOTS_SPEC);

  return [...specs].sort().join(',');
}

/** Back-compat convenience wrapper for the single-tier "pr-check" case. */
export function buildPrTierSpecPattern(specBaseDir = SPEC_BASE_DIR) {
  return buildTierSpecPattern(['pr-check'], specBaseDir);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tiers = process.argv.slice(2);
  process.stdout.write(buildTierSpecPattern(tiers.length > 0 ? tiers : ['pr-check']));
}
