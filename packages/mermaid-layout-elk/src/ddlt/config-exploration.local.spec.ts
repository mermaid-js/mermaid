/**
 * ELK configuration exploration over the DDLT fixture corpus.
 *
 * `.local.spec.ts` — an experiment, not a gate. It asserts almost nothing; its
 * output is the table. The gate is `elk-fixtures.ddlt.spec.ts`, which pins
 * whatever configuration actually ships.
 *
 *   vitest run packages/mermaid-layout-elk/src/ddlt/config-exploration.local.spec.ts
 *
 * Each variant is one hypothesis about ELK's options, expressed as a patch over
 * the shipping defaults in `createRootElkGraph` — never as a fork of it, so the
 * measurement stays about the pipeline the browser runs. Options come from the
 * `elk.layered` reference:
 * https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html
 *
 * NOTE ON EARLIER RESULTS: the first run of this sweep concluded that no variant
 * could move a 251-hard-issue baseline. That baseline was measuring the harness,
 * not ELK — DDLT was skipping the measure step, so no node had an `intersect`
 * and every endpoint used a fallback the browser never takes (see the
 * `KNOWN_INVALID` note in `elk-fixtures.ddlt.spec.ts`). Those numbers are void.
 * Re-run against the current baseline before drawing any conclusion from them.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { addDiagrams } from 'mermaid/src/diagram-api/diagram-orchestration.js';
import { setLogLevel } from 'mermaid/src/logger.js';
import { discoverLayoutTestFixtures } from 'mermaid/src/rendering-util/layout-algorithms/ddlt/index.js';
import {
  formatVariantTable,
  measureVariant,
  rankVariants,
  type ElkConfigVariant,
  type VariantMeasurement,
} from './configSweep.js';

const VARIANTS: ElkConfigVariant[] = [
  {
    name: 'baseline',
    note: 'shipping defaults from createRootElkGraph',
    options: {},
  },

  // ── Edge routing ──────────────────────────────────────────────────────────
  // The validator wants orthogonal polylines; ELK's default for `elk.layered`
  // is ORTHOGONAL already, so these two ask whether the non-orthogonal segments
  // in the corpus come from routing or from the adapter's endpoint fix-ups.
  {
    name: 'edgeRouting=ORTHOGONAL',
    note: 'state the default explicitly, to confirm it is what is running',
    options: { rootLayoutOptions: { 'elk.edgeRouting': 'ORTHOGONAL' } },
  },
  {
    name: 'edgeRouting=POLYLINE',
    note: 'expected worse — a control for the orthogonality rules',
    options: { rootLayoutOptions: { 'elk.edgeRouting': 'POLYLINE' } },
  },

  // ── Node placement ────────────────────────────────────────────────────────
  // Straighter edges mean fewer bends, which is most of `quality`.
  {
    name: 'favorStraightEdges',
    note: 'BK post-processing that trades placement freedom for straight edges',
    options: {
      rootLayoutOptions: { 'elk.layered.nodePlacement.favorStraightEdges': true },
    },
  },
  {
    name: 'nodePlacement=NETWORK_SIMPLEX',
    note: 'the ELK default; ours is BRANDES_KOEPF',
    options: { elkConfig: { nodePlacementStrategy: 'NETWORK_SIMPLEX' } },
  },
  {
    name: 'nodePlacement=LINEAR_SEGMENTS',
    options: { elkConfig: { nodePlacementStrategy: 'LINEAR_SEGMENTS' } },
  },
  {
    name: 'bk.fixedAlignment=BALANCED',
    note: 'ours defaults to NONE (smallest height of the four candidates)',
    options: { elkConfig: { nodePlacementAlignment: 'BALANCED' } },
  },

  // ── Crossing minimisation vs model order ──────────────────────────────────
  // We ship `considerModelOrder = NODES_AND_EDGES`, which constrains crossing
  // minimisation to keep authoring order. These ask what that costs.
  {
    name: 'considerModelOrder=NONE',
    note: 'let crossing minimisation off the leash',
    options: { elkConfig: { considerModelOrder: 'NONE' } },
  },
  {
    name: 'considerModelOrder=PREFER_EDGES',
    options: { elkConfig: { considerModelOrder: 'PREFER_EDGES' } },
  },
  {
    name: 'thoroughness=30',
    note: 'ELK default is 7; more crossing-minimisation restarts',
    options: { rootLayoutOptions: { 'elk.layered.thoroughness': 30 } },
  },

  // ── Spacing ───────────────────────────────────────────────────────────────
  // `spacing.baseValue: 40` is the only spacing we set; everything else derives
  // from it. Edges hugging borders and running too close to each other are the
  // most common hard issues in the corpus, and both are spacing-shaped.
  {
    name: 'spacing.baseValue=25',
    options: { rootLayoutOptions: { 'spacing.baseValue': 25 } },
  },
  {
    name: 'spacing.baseValue=60',
    options: { rootLayoutOptions: { 'spacing.baseValue': 60 } },
  },
  {
    name: 'edgeNode/edgeEdge spacing up',
    note: 'targets edge-border-hugging and edge-parallel-segment-too-close',
    options: {
      rootLayoutOptions: {
        'spacing.edgeNode': 20,
        'spacing.edgeEdge': 15,
        'spacing.edgeNodeBetweenLayers': 20,
        'spacing.edgeEdgeBetweenLayers': 20,
      },
    },
  },

  // ── Bend and merge behaviour ──────────────────────────────────────────────
  {
    name: 'mergeEdges=true',
    note: 'shared trunks — expected to trade crossings for edge-shared-subpath',
    options: { elkConfig: { mergeEdges: true } },
  },
  {
    name: 'mergeHierarchyEdges=false',
    note: 'we force this on; subgraph-crossing edges are where the corpus hurts',
    options: { rootLayoutOptions: { 'elk.layered.mergeHierarchyEdges': false } },
  },
  {
    name: 'unnecessaryBendpoints=false',
    note: 'we force this on; it is the knob nearest the short endpoint stubs',
    options: { rootLayoutOptions: { 'elk.layered.unnecessaryBendpoints': false } },
  },

  // ── Batch 2: aimed at the dominant defect ─────────────────────────────────
  // Baseline diagnosis: ~230 of 251 hard issues are one pattern — ELK puts the
  // first bend at the SAME coordinate as the port, so the opening segment runs
  // ALONG the node's own border instead of leaving perpendicular to it. That
  // one shape produces edge-port-direction-mismatch, edge-intersects-obstacle
  // (against the edge's own endpoint node), edge-border-hugging,
  // edge-bend-near-endpoint and edge-shared-attachment-point at once.
  //
  // Note on option ids: `spacing.edgeNodeBetweenLayers` in batch 1 is NOT a
  // real ELK id — the between-layers spacings live under `elk.layered.spacing.*`
  // — so that variant was measuring nothing. Batch 2 uses fully-qualified ids.
  {
    name: 'layered.spacing.edgeNodeBetweenLayers=25',
    note: 'distance from a node to the first bend in the layer gap',
    options: {
      rootLayoutOptions: { 'elk.layered.spacing.edgeNodeBetweenLayers': 25 },
    },
  },
  {
    name: 'spacing.edgeNode=25 (qualified)',
    options: { rootLayoutOptions: { 'elk.spacing.edgeNode': 25 } },
  },
  {
    name: 'spacing.edgeEdge=15 (qualified)',
    options: { rootLayoutOptions: { 'elk.spacing.edgeEdge': 15 } },
  },
  {
    name: 'layered.spacing.edgeEdgeBetweenLayers=20',
    options: {
      rootLayoutOptions: { 'elk.layered.spacing.edgeEdgeBetweenLayers': 20 },
    },
  },
  {
    name: 'portConstraints=FIXED_SIDE',
    note: 'pin ports to a side and let ELK route away from it',
    options: { rootLayoutOptions: { 'elk.portConstraints': 'FIXED_SIDE' } },
  },
  {
    name: 'spacing.portsSurrounding=12',
    note: 'reserve a corridor around the node for its own ports',
    options: {
      rootLayoutOptions: { 'elk.spacing.portsSurrounding': '[top=12,left=12,bottom=12,right=12]' },
    },
  },
  {
    name: 'bk.edgeStraightening=IMPROVE_STRAIGHTNESS',
    options: {
      rootLayoutOptions: {
        'elk.layered.nodePlacement.bk.edgeStraightening': 'IMPROVE_STRAIGHTNESS',
      },
    },
  },
  {
    name: 'nodeSize.constraints=PORTS',
    note: 'let node size account for its ports',
    options: { rootLayoutOptions: { 'elk.nodeSize.constraints': '[PORTS]' } },
  },
  {
    name: 'hierarchyHandling=SEPARATE_CHILDREN',
    note: 'we ship INCLUDE_CHILDREN; cross-subgraph edges are the worst fixtures',
    options: { rootLayoutOptions: { 'elk.hierarchyHandling': 'SEPARATE_CHILDREN' } },
  },
  {
    name: 'combo: edgeNode25 + betweenLayers25',
    options: {
      rootLayoutOptions: {
        'elk.spacing.edgeNode': 25,
        'elk.layered.spacing.edgeNodeBetweenLayers': 25,
      },
    },
  },
];

describe('ELK configuration exploration', () => {
  beforeAll(() => {
    setLogLevel('fatal');
    addDiagrams();
  });

  it(
    'measures each ELK configuration variant over the fixture corpus',
    { timeout: 900_000 },
    async () => {
      const fixtures = discoverLayoutTestFixtures().filter((fx) => fx.profile === 'flowchart-elk');
      expect(fixtures.length).toBeGreaterThan(0);

      const measured: VariantMeasurement[] = [];
      for (const variant of VARIANTS) {
        measured.push(await measureVariant(fixtures, variant));
      }

      const baseline = measured.find((m) => m.name === 'baseline')!;
      console.log(
        `\nELK config exploration — ${fixtures.length} fixtures, ${VARIANTS.length} variants\n`
      );
      console.log(formatVariantTable(measured, baseline));

      console.log('\nBaseline per fixture:');
      for (const row of [...baseline.byFixture].sort((a, b) => b.hardIssues - a.hardIssues)) {
        console.log(
          `  ${row.id.padEnd(66)} hard=${String(row.hardIssues).padStart(3)} ` +
            `soft=${String(row.softIssues).padStart(2)} quality=${row.quality.toFixed(0).padStart(4)} ` +
            `xings=${String(row.crossings).padStart(3)}  ${row.hardTypes.join(',') || '-'}`
        );
      }

      const best = rankVariants(measured)[0];
      console.log(
        `\nBest by (hard, quality): ${best.name} — hard=${best.hardIssues} quality=${best.quality.toFixed(0)}` +
          ` vs baseline hard=${baseline.hardIssues} quality=${baseline.quality.toFixed(0)}\n`
      );

      // The only real assertion: the sweep ran. Everything else is the report.
      expect(measured).toHaveLength(VARIANTS.length);
    }
  );
});
