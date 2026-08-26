/**
 * Score sweep: one `validateLayout` score per fixture, and their total.
 *
 * `fixtureCorpus.spec.ts` asserts specific invariants — no two connectors along each
 * other, no label on a crossing, and so on. Each of those is a rule this layout is
 * meant to keep, so each is a pass/fail. This file measures something different: how
 * *good* the drawing is, on the repo's shared 0–1000 judge, summed over the corpus.
 * One number, comparable between runs, so an improvement loop can hill-climb it.
 *
 * `validateLayout` is the right judge here, and it was not for the layout's earlier
 * shape: it assumes a layout that owns its routing, and would have reported every
 * centre-to-centre core edge as non-orthogonal. Every edge is now an orthogonal
 * polyline ending on the node boundaries — core edges from HOLA's router, tree
 * connectors from its rank connector — so the judge sees what it expects.
 *
 * Deliberately no assertion on the total. A score is a measurement, and a test that
 * fails when a number moves either way is a tripwire, not a check. What *is* asserted
 * is the floor: the fixtures that validate today must keep validating, so a change
 * that breaks one is caught here rather than showing up as a quietly lower total.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { log, setLogLevel } from '../../../logger.js';
import { combineValidateLayoutResults } from '../ddlt/aggregateValidate.js';
import type { NamedValidateResult } from '../ddlt/aggregateValidate.js';
import { applyFixtureEdgeLabelSizes } from '../ddlt/backends.js';
import { applyFixtureContentSizesStrict, loadSizesFixture } from '../ddlt/fixtureSizes.js';
import { layoutTestsDir } from '../ddlt/paths.js';
import { parseMmdFileToLayoutData } from '../ddlt/parseToLayoutData.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import type { ValidateLayoutResult } from '../layout-utils/validateLayout.js';
import { runGridAttachedLayoutCore } from './layoutCore.js';

const FIXTURE_DIR = join(layoutTestsDir(), 'hola-faithful');

/**
 * Fixtures `validateLayout` currently rejects outright, and why they are not a floor
 * violation. A fixture scores 0 when it is invalid, so these are also the biggest
 * pieces of headroom in the total.
 *
 * Anything *not* listed here must stay valid: that is the floor this file guards.
 */
const KNOWN_INVALID: Record<string, string> = {
  '___ Hola paper main example algorithm':
    "57 edge-intersects-obstacle — tree connectors crossing core nodes and other trees' nodes",
  architecture: 'edge-bend-near-endpoint, and a label over its own arrowhead',
  'Company-simp': 'edge-bend-near-endpoint, and a label over a foreign edge',
  domus1: 'edge-bend-near-endpoint',
  'edge-types': 'edge-bend-near-endpoint, and a label over a foreign edge',
  'GRAPH - Bipartite Graph k3,3': 'non-planar: shared ports and shared subpaths on a tiny core',
  'GRAPH - complete_graph_k4': 'non-planar: detached endpoints, shared ports, shared subpaths',
  'GRAPH - hola paper graph 8': 'edge-bend-near-endpoint',
  'incremental-editing': 'edge-bend-near-endpoint',
  'life-choices': 'edge-bend-near-endpoint',
  'multiple-edges': 'edge-endpoint-detached-from-node on a bundle of parallel edges',
  // Subgraph fixtures. The frames themselves are fitted correctly; what these three
  // trip is the pre-existing terminal-bend defect, plus one new interaction:
  // `validateLayout` treats a frame's *border* as a line an edge may cross but not
  // run along, and a frame is fitted `groupPadding` outside its members, which can
  // land the border beside a route that was settled long before any frame existed.
  // Neither side can give way once both are drawn — the padding is already the
  // minimum, and growing it would put the route inside the frame — so this needs
  // frames to be known before routing, not a wider padding.
  'nested-subgraphs-reverse-order':
    'edge-border-hugging: a route rail settles 1px outside frame "A" and runs 32 units along it',
  'right-angles-not-curves': 'edge-bend-near-endpoint',
  'subgraph-labels-2': 'edge-bend-near-endpoint, and a label over a foreign edge',
  'subgraph-labels-3': 'edge-bend-near-endpoint',
  'project-sox2': 'edge-bend-near-endpoint',
};

function fixtures(): { name: string; sizes: string }[] {
  const files = readdirSync(FIXTURE_DIR);
  return files
    .filter((file) => file.endsWith('.mmd'))
    .map((file) => file.replace(/\.mmd$/, ''))
    .flatMap((name) => {
      for (const sizes of [`${name}.sizes.json`, `${name}.json`]) {
        if (files.includes(sizes)) {
          return [{ name, sizes }];
        }
      }
      return [];
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Per-issue counts and a few examples, for picking what to work on next.
 *
 * Off by default because the sweep's job is the total; set `GRID_ATTACHED_ISSUES=1`
 * when the question is *why* a fixture scores what it does. A count tells you which
 * defect dominates, and the examples name the edge and the node so the case can be
 * reproduced directly.
 */
function reportIssues(name: string, result: ValidateLayoutResult): void {
  if (!process.env.GRID_ATTACHED_ISSUES || result.issues.length === 0) {
    return;
  }
  const counts = new Map<string, number>();
  for (const issue of result.issues) {
    counts.set(issue.type, (counts.get(issue.type) ?? 0) + 1);
  }
  const summary = [...counts]
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `${type}=${count}`)
    .join(' ');
  log.debug(`GRID-ATTACHED-ISSUES: ${name} ${summary}`);
  for (const issue of result.issues.slice(0, 4)) {
    log.debug(`GRID-ATTACHED-ISSUES:   ${name} | ${issue.type} | ${issue.message}`);
  }
}

describe('grid-attached score sweep', () => {
  beforeAll(() => {
    setLogLevel('debug');
    addDiagrams();
  });

  it('scores every fixture and reports the total', async () => {
    const results: NamedValidateResult[] = [];

    for (const { name, sizes } of fixtures()) {
      const layout = await parseMmdFileToLayoutData(join(FIXTURE_DIR, `${name}.mmd`), {
        stampFlowchartRendererFields: true,
      });
      const captured = loadSizesFixture(join(FIXTURE_DIR, sizes));
      applyFixtureContentSizesStrict(layout, captured);
      applyFixtureEdgeLabelSizes(layout, captured);
      runGridAttachedLayoutCore(layout);
      const validated = validateLayout(layout);
      results.push({ id: name, result: validated });
      reportIssues(name, validated);
    }

    const report = combineValidateLayoutResults(results);

    log.debug('GRID-ATTACHED-AGG: aggregate report', {
      total: report.totalScore,
      avg: Math.round(report.avgScore),
      min: report.minScore,
      invalid: report.invalidCount,
      cases: report.byCase.length,
    });
    for (const row of report.byCase) {
      log.debug(
        `GRID-ATTACHED-AGG: ${row.id} score=${row.score} valid=${row.valid} issues=${
          row.issueTypes.join(',') || '-'
        }`
      );
    }

    expect(report.byCase.length).toBeGreaterThan(5);

    const brokeTheFloor = report.byCase
      .filter((row) => !row.valid && KNOWN_INVALID[row.id] === undefined)
      .map((row) => `${row.id} (${row.issueTypes.join(',')})`);
    expect(brokeTheFloor).toEqual([]);
  });
});
