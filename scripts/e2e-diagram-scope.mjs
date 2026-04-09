#!/usr/bin/env node
/**
 * Detects which Cypress e2e spec files to run based on changed source files.
 *
 * CLI usage (reads changed file paths from stdin, one per line):
 *   git diff --name-only <base> HEAD | node scripts/e2e-diagram-scope.mjs
 *
 * Output:
 *   - A comma-separated list of spec patterns (for cypress --spec), OR
 *   - An empty string if the full suite should run (shared code changed, or
 *     unable to confidently scope the change)
 *
 * Module usage (import detectScope):
 *   import { detectScope } from './e2e-diagram-scope.mjs';
 *   const spec = detectScope(['packages/mermaid/src/diagrams/flowchart/flowchart.ts']);
 *   // => 'cypress/integration/rendering/flowchart.spec.js,...'
 */

import { createInterface } from 'readline';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Paths: if ANY changed file matches one of these prefixes, fall back to the
// full suite. Order matters — more specific prefixes should come first.
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

// Cypress spec files that test cross-diagram concerns. If one of these is
// directly modified, fall back to the full suite.
const CROSS_CUTTING_SPECS = new Set([
  'cypress/integration/rendering/multi_diagram_unique_ids.spec.js',
  'cypress/integration/rendering/theme.spec.js',
  'cypress/integration/rendering/conf-and-directives.spec.js',
  'cypress/integration/rendering/marker_unique_id.spec.js',
  'cypress/integration/rendering/current.spec.js',
  'cypress/integration/rendering/appli.spec.js',
  'cypress/integration/rendering/katex.spec.js',
  'cypress/integration/rendering/iconShape.spec.ts',
  'cypress/integration/rendering/imageShape.spec.ts',
  'cypress/integration/rendering/newShapes.spec.ts',
  'cypress/integration/rendering/oldShapes.spec.ts',
  'cypress/integration/rendering/newShapes-neo.spec.ts',
  'cypress/integration/rendering/oldShapes-neo.spec.ts',
]);

// ---------------------------------------------------------------------------
// Mapping: diagram folder name → spec files that should run for that diagram.
// Covers all files under cypress/integration/rendering/ that relate to the
// diagram. When a diagram has multiple spec variants (ELK, hand-drawn, etc.),
// all variants are included so a change to the base diagram is fully tested.
// ---------------------------------------------------------------------------
/** @type {Record<string, string[]>} */
export const DIAGRAM_SPEC_MAP = {
  architecture: ['cypress/integration/rendering/architecture.spec.ts'],
  block: ['cypress/integration/rendering/block.spec.js'],
  c4: ['cypress/integration/rendering/c4.spec.js'],
  class: [
    'cypress/integration/rendering/classDiagram.spec.js',
    'cypress/integration/rendering/classDiagram-v2.spec.js',
    'cypress/integration/rendering/classDiagram-v3.spec.js',
    'cypress/integration/rendering/classDiagram-elk-v3.spec.js',
    'cypress/integration/rendering/classDiagram-handDrawn-v3.spec.js',
    'cypress/integration/rendering/classDiagram-neo.spec.js',
  ],
  er: [
    'cypress/integration/rendering/erDiagram.spec.js',
    'cypress/integration/rendering/erDiagram-unified.spec.js',
    'cypress/integration/rendering/erDiagram-neo-look.spec.ts',
  ],
  error: ['cypress/integration/rendering/errorDiagram.spec.js'],
  eventmodeling: ['cypress/integration/rendering/eventmodeling.spec.ts'],
  flowchart: [
    'cypress/integration/rendering/flowchart.spec.js',
    'cypress/integration/rendering/flowchart-v2.spec.js',
    'cypress/integration/rendering/flowchart-elk.spec.js',
    'cypress/integration/rendering/flowchart-handDrawn.spec.js',
    'cypress/integration/rendering/flowchart-icon.spec.js',
    'cypress/integration/rendering/flowchart-shape-alias.spec.ts',
    'cypress/integration/rendering/flowchart-shape-themes.spec.ts',
  ],
  gantt: ['cypress/integration/rendering/gantt.spec.js'],
  git: [
    'cypress/integration/rendering/gitGraph.spec.js',
    'cypress/integration/rendering/gitGraph-neo-look.spec.js',
  ],
  info: ['cypress/integration/rendering/info.spec.ts'],
  ishikawa: ['cypress/integration/rendering/ishikawa.spec.ts'],
  kanban: ['cypress/integration/rendering/kanban.spec.ts'],
  mindmap: [
    'cypress/integration/rendering/mindmap.spec.ts',
    'cypress/integration/rendering/mindmap-tidy-tree.spec.js',
    'cypress/integration/rendering/mindmap-neo-look.spec.ts',
  ],
  packet: ['cypress/integration/rendering/packet.spec.ts'],
  pie: ['cypress/integration/rendering/pie.spec.ts'],
  'quadrant-chart': ['cypress/integration/rendering/quadrantChart.spec.js'],
  radar: ['cypress/integration/rendering/radar.spec.js'],
  requirement: [
    'cypress/integration/rendering/requirement.spec.js',
    'cypress/integration/rendering/requirementDiagram-unified.spec.js',
    'cypress/integration/rendering/requirementDiagram-neo-themes.spec.ts',
  ],
  sankey: ['cypress/integration/rendering/sankey.spec.ts'],
  sequence: [
    'cypress/integration/rendering/sequencediagram.spec.js',
    'cypress/integration/rendering/sequencediagram-v2.spec.js',
    'cypress/integration/rendering/sequenceDiagram-redux-themes.spec.ts',
  ],
  state: [
    'cypress/integration/rendering/stateDiagram.spec.js',
    'cypress/integration/rendering/stateDiagram-v2.spec.js',
    'cypress/integration/rendering/stateDiagram-neo.spec.js',
  ],
  timeline: [
    'cypress/integration/rendering/timeline.spec.ts',
    'cypress/integration/rendering/timeline-neo-look.spec.js',
  ],
  treeView: ['cypress/integration/rendering/treeView.spec.ts'],
  treemap: ['cypress/integration/rendering/treemap.spec.ts'],
  'user-journey': ['cypress/integration/rendering/journey.spec.js'],
  venn: ['cypress/integration/rendering/venn.spec.ts'],
  wardley: ['cypress/integration/rendering/wardley.spec.js'],
  xychart: ['cypress/integration/rendering/xyChart.spec.js'],
  zenuml: ['cypress/integration/rendering/zenuml.spec.js'],
};

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
 * @param {string[]} files - Changed file paths (relative to repo root)
 * @returns {string} Spec pattern, or '' for full suite
 */
export function detectScope(files) {
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
    const diagramMatch = trimmed.match(DIAGRAM_PATH_RE);
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

    // Directly modified spec file
    if (trimmed.startsWith('cypress/integration/rendering/')) {
      if (CROSS_CUTTING_SPECS.has(trimmed)) {
        touchesShared = true;
        break;
      }
      directlyChangedSpecs.push(trimmed);
      continue;
    }

    // Anything else (root config, CI YAML, docs, etc.) → full suite
    touchesShared = true;
    break;
  }

  if (touchesShared) {
    return '';
  }

  // Collect spec files from the diagram map
  const specs = new Set(directlyChangedSpecs);

  for (const name of diagramNames) {
    const diagramSpecs = DIAGRAM_SPEC_MAP[name];
    if (!diagramSpecs) {
      // Unknown diagram — can't confidently scope, fall back to full suite
      return '';
    }
    for (const s of diagramSpecs) {
      specs.add(s);
    }
  }

  if (specs.size === 0) {
    return '';
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
