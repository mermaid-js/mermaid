#!/usr/bin/env node
/**
 * Detects which Cypress e2e spec files to run based on changed source files.
 *
 * Convention: every diagram type has a matching subfolder under
 * cypress/integration/rendering/<diagram-name>/. Adding a new spec file to
 * that subfolder requires no configuration here — it is discovered at runtime.
 *
 * CLI usage (reads changed file paths from stdin, one per line):
 *   git diff --name-only <base> HEAD | node scripts/e2e-diagram-scope.mjs
 *
 * Output:
 *   - A comma-separated list of spec patterns (for cypress --spec), OR
 *   - An empty string if the full suite should run (shared code changed, or
 *     unable to confidently scope the change)
 *
 * Module usage:
 *   import { detectScope } from './e2e-diagram-scope.mjs';
 *   const spec = detectScope(['packages/mermaid/src/diagrams/flowchart/flowchart.ts']);
 *   // => 'cypress/integration/rendering/flowchart/**'
 */

import { createInterface } from 'readline';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

// Base directory where diagram spec subfolders live
export const SPEC_BASE_DIR = 'cypress/integration/rendering';

// Sentinel value returned when all changed files are ignorable (e.g.
// docs-only PRs).  Consumers should skip e2e entirely when they receive this.
export const SKIP = 'SKIP';

// ---------------------------------------------------------------------------
// Ignorable paths: files that can NEVER affect rendered diagram output.
// When a changed file matches one of these, it is silently skipped (continue)
// rather than triggering the full suite.
// ---------------------------------------------------------------------------
const IGNORABLE_PREFIXES = [
  // Root-level repo metadata
  'img/',
  'CITATION.cff',
  'FUNDING.json',
  'LICENSE',
  'CODE_OF_CONDUCT.md',
  'CONTRIBUTING.md',
  'README.md',
  'README.zh-CN.md',
  // Config/tooling that doesn't affect rendering
  'renovate.json',
  'docker-compose.yml',
  'Dockerfile',
  'netlify.toml',
  'cspell.config.yaml',
  // Documentation (source and generated)
  'packages/mermaid/src/docs/',
  'packages/mermaid/src/vitepress/',
  'packages/examples/',
  'packages/mermaid-local-editor/',
  'packages/tiny/',
  'docs/',
  // Changeset descriptions
  '.changeset/',
  // AI assistant / agent config
  '.claude/',
  'assistant/',
  // GitHub metadata that doesn't affect rendering
  '.github/workflows/build-docs.yml',
  '.github/workflows/publish-docs.yml',
  '.github/ISSUE_TEMPLATE/',
  '.github/CODEOWNERS',
  '.github/FUNDING.yml',
  '.github/workflows/autofix.yml',
  '.github/workflows/check-readme-in-sync.yml',
  '.github/workflows/codeql.yml',
  '.github/workflows/dependency-review.yml',
  '.github/workflows/issue-triage.yml',
  '.github/workflows/link-checker.yml',
  '.github/workflows/lint.yml',
  '.github/workflows/pr-labeler.yml',
  '.github/workflows/renovatebot-config-lint.yml',
  '.github/workflows/scorecard.yml',
  '.github/workflows/unlock-reopened-issues.yml',
  '.github/workflows/update-browserlist.yml',
  '.github/workflows/validate-lockfile.yml',
  // Doc-related scripts
  'packages/mermaid/scripts/docs',
  // Demos
  'demos/',
];

// Files ending with these suffixes are ignorable UNLESS they live inside a
// diagram source folder (where even a .md might be a samples file that
// signals intent to test).
const IGNORABLE_SUFFIXES = ['.md'];

// ---------------------------------------------------------------------------
// Paths: if ANY changed file matches one of these prefixes, fall back to the
// full suite.
// ---------------------------------------------------------------------------
const SHARED_PREFIXES = [
  // Shared diagram utilities (used by all diagram types)
  'packages/mermaid/src/diagrams/common/',
  // Shared rendering utilities (shapes, edges, layout — affects all diagrams)
  'packages/mermaid/src/rendering-util/',
  // Themes (affects all visual output)
  'packages/mermaid/src/themes/',
  // Core API and config (affects all diagrams)
  'packages/mermaid/src/config',
  'packages/mermaid/src/mermaid',
  'packages/mermaid/src/mermaidAPI',
  'packages/mermaid/src/diagram-api/',
  'packages/mermaid/src/Diagram.',
  'packages/mermaid/src/schemas/',
  // Parser package (used by multiple diagram types via Langium)
  'packages/parser/',
  // Layout engine packages
  'packages/dagre-wrapper/',
  'packages/mermaid-layout-elk/',
  'packages/mermaid-layout-tidy-tree/',
  // Plugin packages (separate bundles but tested in main suite)
  'packages/mermaid-zenuml/',
  'packages/mermaid-example-diagram/',
  // Cypress: config and cross-cutting test utilities
  'cypress/integration/other/',
  'cypress/helpers/',
  'cypress.config',
  // Build and tooling (may affect all output)
  '.esbuild/',
  '.vite/',
  'vitest.',
  'tsconfig',
];

// Regex: extract diagram name from paths like
// packages/mermaid/src/diagrams/<name>/...
const DIAGRAM_PATH_RE = /^packages\/mermaid\/src\/diagrams\/([^/]+)\//;

// ---------------------------------------------------------------------------
// Core detection function
// ---------------------------------------------------------------------------

/**
 * Given a list of changed file paths (relative to repo root), returns the
 * comma-separated spec pattern to pass to `cypress run --spec`, or an empty
 * string if the full suite should run.
 *
 * The function uses the filesystem to discover which diagram spec subfolders
 * exist. No mapping table is maintained — adding a spec to a subfolder is
 * sufficient.
 *
 * @param {string[]} files - Changed file paths (relative to repo root)
 * @param {{ specBaseDir?: string }} [options]
 * @returns {string} Spec pattern, or '' for full suite
 */
export function detectScope(files, options = {}) {
  const specBaseDir = options.specBaseDir ?? SPEC_BASE_DIR;

  if (files.length === 0) {
    return '';
  }

  /** @type {Set<string>} */
  const diagramNames = new Set();
  let touchesShared = false;
  /** @type {string[]} */
  const directlyChangedSpecs = [];

  for (const file of files) {
    const trimmed = file.trim();
    if (!trimmed) {
      continue;
    }

    // Shared infrastructure → full suite
    if (SHARED_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) {
      touchesShared = true;
      break;
    }

    // File inside a diagram folder
    const diagramMatch = DIAGRAM_PATH_RE.exec(trimmed);
    if (diagramMatch) {
      const name = diagramMatch[1];
      // 'common' and 'globalStyles' are shared — already caught above,
      // but guard here for safety
      if (name === 'common' || name === 'globalStyles') {
        touchesShared = true;
        break;
      }
      diagramNames.add(name);
      continue;
    }

    // File under the spec base directory
    const specFolderPrefix = `${specBaseDir}/`;
    if (trimmed.startsWith(specFolderPrefix)) {
      const rest = trimmed.slice(specFolderPrefix.length);
      const slashIdx = rest.indexOf('/');

      if (slashIdx === -1) {
        // No subfolder separator → file sits at the root of SPEC_BASE_DIR.
        // Root-level specs are cross-cutting by convention; full suite.
        touchesShared = true;
        break;
      }

      // File inside a diagram subfolder → scope to that subfolder.
      const subFolder = rest.slice(0, slashIdx);
      directlyChangedSpecs.push(`${specFolderPrefix}${subFolder}/**`);
      continue;
    }

    // Ignorable files (docs, changesets, AI config, etc.) → skip silently.
    // Guard: .md files inside a diagram source folder are NOT ignorable — they
    // may be samples or signal intent, and their diagram folder was already
    // handled by DIAGRAM_PATH_RE above.
    if (
      IGNORABLE_PREFIXES.some((prefix) => trimmed.startsWith(prefix)) ||
      (IGNORABLE_SUFFIXES.some((suffix) => trimmed.endsWith(suffix)) &&
        !DIAGRAM_PATH_RE.test(trimmed))
    ) {
      continue;
    }

    // Anything else (root config, CI YAML, cypress/other, etc.) → full suite
    touchesShared = true;
    break;
  }

  if (touchesShared) {
    return '';
  }

  // Build spec patterns from diagram names using filesystem discovery
  const specs = new Set(directlyChangedSpecs);

  for (const name of diagramNames) {
    const folder = `${specBaseDir}/${name}`;
    if (!existsSync(folder)) {
      // No subfolder exists for this diagram — fall back to full suite so
      // we don't silently skip tests for diagrams with no spec subfolder
      return '';
    }
    specs.add(`${folder}/**`);
  }

  if (specs.size === 0) {
    // All files were either ignorable or empty — no e2e tests needed.
    return SKIP;
  }

  return [...specs].join(',');
}

// ---------------------------------------------------------------------------
// CLI entry point: read changed files from stdin, write spec to stdout
// ---------------------------------------------------------------------------

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const lines = [];
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of rl) {
    lines.push(line);
  }
  const result = detectScope(lines);
  process.stdout.write(result);
}
