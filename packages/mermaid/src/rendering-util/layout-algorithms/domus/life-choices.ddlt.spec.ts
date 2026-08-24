/**
 * DDLT spec for the DOMUS layout of life-choices.mmd — iter-45 baseline.
 *
 * Structure mirrors `company-simp.ddlt.spec.ts`. Fixture: flat (no-cluster)
 * TB decision tree with 22 nodes, 24 edges, no clusters or self-loops, one
 * convergence node (`ne`) at the bottom.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { Edge, LayoutData, Node, NonClusterNode } from '../../types.js';
import { Diagram } from '../../../Diagram.js';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { preprocessDiagram } from '../../../preprocess.js';
import { runOrthogonalEdgePipeline } from './pipeline.js';
import { validateLayout } from './validateLayoutProxy.js';
import { finalizeDummyLabelNodesToOverlayLabels } from './finalizeOverlayLabels.js';
import { partitionDomusValidationIssues } from './pipeline/domusBackend.js';
import { setLogLevel } from '../../../logger.js';

interface FixtureNode {
  id: string;
  width: number;
  height: number;
}
interface SizesFixture {
  nodes: FixtureNode[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURE_PATH = resolve(
  __dirname,
  '../../../../../../e2e/platform/dev-diagrams/layout-tests/domus/life-choices.sizes.json'
);
const MMD_PATH = resolve(
  __dirname,
  '../../../../../../e2e/platform/dev-diagrams/layout-tests/domus/life-choices.mmd'
);

function loadFixture(): SizesFixture {
  return JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8')) as SizesFixture;
}

function fixtureSizeById(fixture: SizesFixture, id: string) {
  return fixture.nodes.find((n) => n.id === id);
}

async function parseLayout(): Promise<LayoutData> {
  const mmdText = readFileSync(MMD_PATH, 'utf-8');
  const { code } = preprocessDiagram(mmdText);
  const diagram = await Diagram.fromText(code);
  const layoutData = (diagram.db as { getData: () => LayoutData }).getData();
  layoutData.layoutAlgorithm = 'domus';
  return layoutData;
}

function applyCapturedContentSizes(layout: LayoutData, fixture: SizesFixture) {
  for (const node of layout.nodes) {
    if (node.isGroup) {
      continue;
    }
    const size = fixtureSizeById(fixture, node.id);
    if (!size) {
      continue;
    }
    (node as { width: number; height: number }).width = size.width;
    (node as { width: number; height: number }).height = size.height;
  }
}

function applyCapturedLabelSizes(layout: LayoutData, fixture: SizesFixture) {
  for (const node of layout.nodes) {
    if (!(node as { isEdgeLabel?: boolean }).isEdgeLabel) {
      continue;
    }
    const size = fixtureSizeById(fixture, node.id);
    if (!size) {
      continue;
    }
    (node as { width: number; height: number }).width = size.width;
    (node as { width: number; height: number }).height = size.height;
  }
}

function injectEdgeLabelNodes(data: LayoutData): void {
  const hasLabelNodes = (data.nodes ?? []).some((n: Node) =>
    String(n?.id ?? '').startsWith('edge-label-')
  );
  const hasLabelEdges = (data.edges ?? []).some((e: Edge) => Boolean(e?.isLabelEdge));
  if (hasLabelNodes || hasLabelEdges) {
    return;
  }

  const nodesById = new Map<string, Node>();
  for (const n of data.nodes ?? []) {
    nodesById.set(String(n?.id ?? ''), n);
  }

  const newNodes: NonClusterNode[] = [];
  const newEdges: Edge[] = [];
  for (const edge of [...(data.edges ?? [])]) {
    if (edge?.label && String(edge.label).length > 0) {
      const startId = String(edge.start ?? '');
      const endId = String(edge.end ?? '');
      const startNode = nodesById.get(startId);
      const labelNodeId = `edge-label-${startId}-${endId}-${String(edge.id ?? '')}`;
      newNodes.push({
        id: labelNodeId,
        label: edge.label,
        edgeStart: startId,
        edgeEnd: endId,
        shape: 'labelRect',
        width: 0,
        height: 0,
        isEdgeLabel: true,
        isDummy: true,
        parentId: undefined,
        isGroup: false,
        layer: 0,
        order: 0,
        labelStyle: edge?.labelStyle?.[0] ?? '',
        ...(startNode?.dir ? { dir: startNode.dir } : {}),
      } as NonClusterNode);
      newEdges.push(
        {
          ...edge,
          id: `${String(edge.id ?? '')}-to-label`,
          end: labelNodeId,
          label: undefined,
          isLabelEdge: true,
          arrowTypeEnd: 'none',
          arrowTypeStart: 'none',
        },
        {
          ...edge,
          id: `${String(edge.id ?? '')}-from-label`,
          start: labelNodeId,
          end: endId,
          label: undefined,
          isLabelEdge: true,
          arrowTypeStart: 'none',
          arrowTypeEnd: 'arrow_point',
        }
      );
    } else {
      newEdges.push(edge);
    }
  }

  for (const n of newNodes) {
    if (!nodesById.has(String(n.id))) {
      data.nodes.push(n);
      nodesById.set(String(n.id), n);
    }
  }
  data.edges = newEdges;
}

async function runDomus(fixture: SizesFixture): Promise<LayoutData> {
  const layout = await parseLayout();
  applyCapturedContentSizes(layout, fixture);
  injectEdgeLabelNodes(layout);
  applyCapturedLabelSizes(layout, fixture);
  runOrthogonalEdgePipeline(layout, {
    spacing: 10,
    routingBackend: 'domus',
    routingGraphModel: 'channels',
    ocrFallback: true,
    ocrMaxExpansions: 50_000,
    useExistingPositions: false,
    // iter-45 NOTE: we do NOT pass `respectFlowDirection: true` here even
    // though the production render path would want it. iter-45 attempted to
    // flip the production default and reverted after user visual review:
    // A4 correctly TB-orients the tree (rankFaithfulness −0.43 → +0.88) but
    // the SAT's direction-constrained shape regresses routing (22 bends,
    // 5 crossings, 1 intersect-obstacle on `L_n0_nw_0`, 4 diagonal endpoints,
    // min seg 2.5u). iter-46+ should address R3/R10 on A4-constrained
    // geometries BEFORE re-attempting the production flip. See
    // `.tmp/domus-improve/20260422-iter45/aborted.md`.
  });
  finalizeDummyLabelNodesToOverlayLabels(layout);
  return layout;
}

describe('Domus DDLT — life-choices.mmd', () => {
  let fixture: SizesFixture;

  beforeAll(() => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');
    addDiagrams();
    fixture = loadFixture();
  });

  it(
    'Level 1: validateLayout — produces a valid orthogonal layout',
    { timeout: 30_000 },
    async () => {
      const layout = await runDomus(fixture);
      const result = validateLayout(layout);
      // iter-13 partition: DOMUS uses center-endpoint polyline convention; paint-time
      // intersectRect clips to node boundary. validateLayout runs pre-paint and
      // flags center-endpoint segments crossing the edge's own start/end as
      // "conventional" (not real routing defects). Assert against REAL issues only.
      const partitioned = partitionDomusValidationIssues(result.issues, layout);
      // eslint-disable-next-line no-console
      console.log(
        '[LIFE_CHOICES_BASELINE]',
        'real=',
        JSON.stringify(partitioned.real),
        'conventional_count=',
        partitioned.conventional.length
      );
      expect(partitioned.real).toEqual([]);
    }
  );

  // iter-46: explicit canary for the n8→nk middle-segment bug. DOMUS emits a
  // polyline that exits n8's top (N) and enters nk's bottom (S) even though
  // n8 is above nk on screen — the middle segment then runs 150u straight
  // down through both endpoint-node interiors. validateLayout catches both
  // crossings as `edge-intersects-obstacle` at segmentIndex 1, but the pre-
  // iter-46 partition silenced them because the obstacle IDs match the
  // edge's own start/end. iter-46 tightens the partition to require the
  // segment be first or last (index 0 or len-2) for that suppression to
  // apply. Middle-segment crossings of own-endpoint nodes now surface.
  //
  // This test is expected to FAIL on master-iter-45 (baseline) and PASS
  // once iter-46 lands. The routing fix itself (swap n8's exit port to S
  // and nk's entry port to N) is iter-47+ work per iter-45's aborted.md.
  it(
    'Level 1 (iter-46 canary): no middle-segment crosses through own-endpoint nodes',
    { timeout: 30_000 },
    async () => {
      const layout = await runDomus(fixture);
      const result = validateLayout(layout);
      const partitioned = partitionDomusValidationIssues(result.issues, layout);
      const middleSelfCrossings = partitioned.real.filter(
        (iss) =>
          iss.type === 'edge-intersects-obstacle' &&
          iss.details?.segmentIndex != null &&
          (iss.details.segmentIndex as number) > 0 &&
          iss.edgeId != null &&
          Array.isArray(iss.nodeIds) &&
          iss.nodeIds.some((nid) => {
            const edge = layout.edges.find((e) => String(e.id) === String(iss.edgeId));
            const lastIdx = (edge?.points?.length ?? 0) - 2;
            return (
              iss.details?.segmentIndex !== lastIdx &&
              (String(edge?.start) === nid || String(edge?.end) === nid)
            );
          })
      );
      expect(middleSelfCrossings).toEqual([]);
    }
  );

  // iter-47: the DOMUS-native drawability phase places vertical-chain nodes
  // (nl, n4, no, n6, ne — all connected by D-labeled edges) in one shared
  // Gx equivalence class at x=667.406, paper-faithful per DOMUS §3 Theorem 2.
  // The post-gate nudger chain (minGap=50 nudgeConnectedPairsForMinGap)
  // then shifts n4 5u LEFT to open a gap with sibling `nr` (at x=908), and
  // similarly shifts `np` and `n5` within the left-column chain. The 5u
  // offset produces visible horizontal jogs in the rendered edges
  // (L_nl_n4_0 has 2 extra bends at y=443.5 from (667.4)→(662.4)).
  // This canary asserts same-column stacks are actually aligned.
  it(
    'Level 1 (iter-47 canary): vertical-chain siblings share one x-coord',
    { timeout: 30_000 },
    async () => {
      const layout = await runDomus(fixture);
      const byId = new Map<string, { x: number; y: number }>();
      for (const n of layout.nodes ?? []) {
        if (
          !(n as { isGroup?: boolean }).isGroup &&
          !(n as { isEdgeLabel?: boolean }).isEdgeLabel
        ) {
          byId.set(String(n.id), { x: (n as { x: number }).x, y: (n as { y: number }).y });
        }
      }
      // Right column chain nl → n4 → no → n6 → ne, all D-labeled.
      const rightChain = ['nl', 'n4', 'no', 'n6', 'ne'].map((id) => byId.get(id)!.x);
      const rightSpread = Math.max(...rightChain) - Math.min(...rightChain);
      // Left-center chain nv → np (and B/nm/n1/nq/n8/nk known aligned).
      const centerChain = ['nv', 'np'].map((id) => byId.get(id)!.x);
      const centerSpread = Math.max(...centerChain) - Math.min(...centerChain);
      // iter-47 target: spread ≤ 1.0 (float-noise tolerance, paper demands exact).
      expect(rightSpread).toBeLessThanOrEqual(1.0);
      expect(centerSpread).toBeLessThanOrEqual(1.0);
    }
  );

  it('Level 1: no micro-segments (min segment length >= 4)', { timeout: 30_000 }, async () => {
    const layout = await runDomus(fixture);
    let minSegLen = Infinity;
    for (const edge of layout.edges ?? []) {
      const pts = edge.points;
      if (!pts || pts.length < 2) {
        continue;
      }
      for (let i = 0; i < pts.length - 1; i++) {
        const len = Math.abs(pts[i].x - pts[i + 1].x) + Math.abs(pts[i].y - pts[i + 1].y);
        if (len > 0 && len < minSegLen) {
          minSegLen = len;
        }
      }
    }
    expect(Number.isFinite(minSegLen) ? minSegLen : 0).toBeGreaterThanOrEqual(4);
  });

  it('Level 2: validateLayout — baseline breakdown', { timeout: 30_000 }, async () => {
    const layout = await runDomus(fixture);
    const { breakdown } = validateLayout(layout);
    const totalBends = breakdown.edges.reduce((acc, e) => acc + Math.max(0, e.points - 2), 0);
    // eslint-disable-next-line no-console
    console.log('[LIFE_CHOICES_BASELINE]', 'breakdown=', JSON.stringify(breakdown));
    expect(breakdown).toBeDefined();
    // iter-46 baseline shift: the partition-tightening (R13 refinement) now
    // surfaces middle-segment self-crossings as real issues, triggering the
    // routing-graph fallback at `pipeline/domusBackend.ts:532`. The fallback
    // produces valid but more-bendy polylines (n8→nk straight from bottom→
    // top instead of DOMUS-native's U-shape around both nodes). Bend/length
    // metrics therefore reflect the fallback path, not DOMUS-native.
    // iter-47+ will re-route DOMUS-native around this class of defect, at
    // which point these canaries should tighten back toward shape-first
    // metrics (totalBends=0 on a 22-node tree). rankFaithfulness and
    // diagonalEndpoints are direction-agnostic and unchanged.
    expect.soft(totalBends).toBeLessThanOrEqual(24);
    expect.soft(breakdown.crossings).toBeLessThanOrEqual(1);
  });
});
