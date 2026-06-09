/**
 * DDLT spec for a minimal cluster (compound/subgraph) fixture. Foundation
 * for Phase D / R5 work: cluster boundary vertices per Siebenhaller §3.
 *
 * Unlike `company-simp.ddlt.spec.ts` this fixture is built in-memory (no
 * `.mmd` parsing, no `.sizes.json`) so it is fully portable and avoids
 * jsdom getBoundingClientRect blockers that have prevented the existing
 * `domus.compound.spec.ts` tests from running.
 *
 * Graph shape:
 *
 *     G (group, 200×120, parent)
 *       ├── A (leaf, 60×40, parentId=G)
 *       └── B (leaf, 60×40, parentId=G)
 *     X (leaf, 60×40, external)
 *
 *     Edges: A → B  (intra-cluster)
 *            B → X  (cluster-crossing)
 *
 * Current state (iter-23, commit e0cb7311d):
 *   `pipeline/context.ts:38` silently downgrades `backend: 'domus'` →
 *   `'routing-graph'` when the graph has any group node (R5). So this
 *   fixture exercises the FALLBACK path, not DOMUS-native placement.
 *   The iter-24 job is to pin that current behaviour as a canary; iter-25+
 *   will land Phase D work (boundary vertices `c_t / c_b / uc_l^i / uc_r^i`).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import type { LayoutData, Node, Edge } from '../../types.js';
import { layoutOrthogonalNodes, runOrthogonalEdgePipeline } from './pipeline.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { setLogLevel } from '../../../logger.js';

function buildClusterFixture(): LayoutData {
  // Pre-positioned leaf nodes. DOMUS runs `layoutOrthogonalNodes` before
  // edge routing which will recompute these; leaving something non-zero
  // here keeps the fixture diagnostic if placement is accidentally skipped.
  const G: Node = {
    id: 'G',
    isGroup: true,
    label: 'Group G',
    // Group dimensions are typically expanded post-placement to enclose
    // children; seeding with a sensible default here.
    width: 200,
    height: 120,
    x: 0,
    y: 0,
    shape: 'rect',
  } as Node;
  const A: Node = {
    id: 'A',
    isGroup: false,
    parentId: 'G',
    label: 'A',
    width: 60,
    height: 40,
    x: 0,
    y: 0,
    shape: 'rect',
  } as Node;
  const B: Node = {
    id: 'B',
    isGroup: false,
    parentId: 'G',
    label: 'B',
    width: 60,
    height: 40,
    x: 0,
    y: 0,
    shape: 'rect',
  } as Node;
  const X: Node = {
    id: 'X',
    isGroup: false,
    label: 'X',
    width: 60,
    height: 40,
    x: 0,
    y: 0,
    shape: 'rect',
  } as Node;

  const eAB: Edge = {
    id: 'e_A_B',
    start: 'A',
    end: 'B',
    type: 'arrow_point',
    arrowTypeEnd: 'arrow_point',
  } as Edge;
  const eBX: Edge = {
    id: 'e_B_X',
    start: 'B',
    end: 'X',
    type: 'arrow_point',
    arrowTypeEnd: 'arrow_point',
  } as Edge;

  return {
    nodes: [G, A, B, X],
    edges: [eAB, eBX],
    direction: 'TB',
    // Scalar fields kept minimal; `runOrthogonalEdgePipeline` only needs
    // nodes + edges for this fixture.
  } as unknown as LayoutData;
}

async function runClusterLayout(
  options: { allowDomusWithGroups?: boolean } = {}
): Promise<LayoutData> {
  const layout = buildClusterFixture();
  await layoutOrthogonalNodes(layout);
  runOrthogonalEdgePipeline(layout, {
    spacing: 10,
    routingBackend: 'domus',
    routingGraphModel: 'channels',
    allowDomusWithGroups: options.allowDomusWithGroups,
  });
  return layout;
}

function rectFor(n: Node) {
  const cx = n.x ?? 0;
  const cy = n.y ?? 0;
  const w = n.width ?? 0;
  const h = n.height ?? 0;
  return { left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2 };
}

describe('Domus DDLT — minimal cluster (iter-24 foundation for D1/R5)', () => {
  beforeAll(() => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');
  });

  it('places all leaf nodes at distinct positions', async () => {
    const layout = await runClusterLayout();
    const leafs = (layout.nodes ?? []).filter((n) => !n.isGroup) as Node[];
    expect(leafs.length).toBe(3);
    const positions = leafs.map((n) => `${n.x},${n.y}`);
    expect(new Set(positions).size).toBe(positions.length);
  });

  it('emits non-empty polylines for both edges', async () => {
    const layout = await runClusterLayout();
    expect(layout.edges?.length).toBe(2);
    for (const edge of layout.edges ?? []) {
      expect(edge.points).toBeDefined();
      expect((edge.points ?? []).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('group rect G geometrically encloses its children (A, B) after pipeline', async () => {
    // This is the Phase D / R5 invariant: children must lie inside their
    // parent cluster rect. Currently relies on the routing-graph fallback's
    // cluster-sizing pass (non-DOMUS path). Canary for D1 progress.
    const layout = await runClusterLayout();
    const byId = new Map<string, Node>();
    for (const n of layout.nodes ?? []) {
      byId.set(String(n.id), n);
    }
    const G = byId.get('G')!;
    const A = byId.get('A')!;
    const B = byId.get('B')!;
    const rG = rectFor(G);
    const rA = rectFor(A);
    const rB = rectFor(B);
    expect(rA.left >= rG.left - 1e-6).toBe(true);
    expect(rA.right <= rG.right + 1e-6).toBe(true);
    expect(rA.top >= rG.top - 1e-6).toBe(true);
    expect(rA.bottom <= rG.bottom + 1e-6).toBe(true);
    expect(rB.left >= rG.left - 1e-6).toBe(true);
    expect(rB.right <= rG.right + 1e-6).toBe(true);
    expect(rB.top >= rG.top - 1e-6).toBe(true);
    expect(rB.bottom <= rG.bottom + 1e-6).toBe(true);
  });

  it('external node X is placed outside group G', async () => {
    const layout = await runClusterLayout();
    const byId = new Map<string, Node>();
    for (const n of layout.nodes ?? []) {
      byId.set(String(n.id), n);
    }
    const G = byId.get('G')!;
    const X = byId.get('X')!;
    const rG = rectFor(G);
    const rX = rectFor(X);
    const disjoint =
      rX.right < rG.left - 1e-6 ||
      rX.left > rG.right + 1e-6 ||
      rX.bottom < rG.top - 1e-6 ||
      rX.top > rG.bottom + 1e-6;
    expect(disjoint).toBe(true);
  });

  it('validateLayout baseline: pins current canary issue count (iter-24)', async () => {
    // Canary — the current (routing-graph fallback) layout is expected to
    // validate clean on this fixture. When D1 lands, this should still
    // hold (or tighten). Failure here means either D1 regressed the
    // fallback output OR the fallback changed behaviour.
    const layout = await runClusterLayout();
    const result = validateLayout(layout);
    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('validateLayout baseline: pins current quality metrics (iter-24)', async () => {
    // Canary — captures `validateLayout`'s breakdown as a regression boundary.
    // Numbers may be tightened as D1/D1a/D1b land paper-faithful boundary
    // vertices.
    const layout = await runClusterLayout();
    const { breakdown } = validateLayout(layout);
    const totalBends = breakdown.edges.reduce((acc, e) => acc + Math.max(0, e.points - 2), 0);
    const avgBendsPerEdge = breakdown.edgeCount > 0 ? totalBends / breakdown.edgeCount : 0;
    expect.soft(breakdown.crossings).toBe(0);
    expect.soft(avgBendsPerEdge).toBeLessThanOrEqual(2);
    expect.soft(totalBends).toBeLessThanOrEqual(4);
  });
});

// iter-25 — D1-v1 pragmatic (Phase D / R5). Opts into `allowDomusWithGroups`
// to keep the DOMUS backend active on cluster fixtures (no silent downgrade
// to routing-graph). Groups remain filtered from the DOMUS vertex list;
// `preprocessClusters` sizes them from children's bbox pre-DOMUS. These
// tests lock in that the DOMUS-native path produces the same high-level
// invariants as the routing-graph fallback on this fixture.
describe('Domus DDLT — minimal cluster with allowDomusWithGroups (iter-25 D1-v1)', () => {
  beforeAll(() => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');
  });

  it('DOMUS-native path places all leaf nodes at distinct positions', async () => {
    const layout = await runClusterLayout({ allowDomusWithGroups: true });
    const leafs = (layout.nodes ?? []).filter((n) => !n.isGroup) as Node[];
    expect(leafs.length).toBe(3);
    const positions = leafs.map((n) => `${n.x},${n.y}`);
    expect(new Set(positions).size).toBe(positions.length);
  });

  it('DOMUS-native path emits non-empty polylines for both edges', async () => {
    const layout = await runClusterLayout({ allowDomusWithGroups: true });
    expect(layout.edges?.length).toBe(2);
    for (const edge of layout.edges ?? []) {
      expect(edge.points).toBeDefined();
      expect((edge.points ?? []).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('DOMUS-native path: group rect G encloses its children', async () => {
    // preprocessClusters sizes G from children's bbox + padding.
    const layout = await runClusterLayout({ allowDomusWithGroups: true });
    const byId = new Map<string, Node>();
    for (const n of layout.nodes ?? []) {
      byId.set(String(n.id), n);
    }
    const G = byId.get('G')!;
    const A = byId.get('A')!;
    const B = byId.get('B')!;
    const rG = rectFor(G);
    const rA = rectFor(A);
    const rB = rectFor(B);
    expect(rA.left >= rG.left - 1e-6).toBe(true);
    expect(rA.right <= rG.right + 1e-6).toBe(true);
    expect(rA.top >= rG.top - 1e-6).toBe(true);
    expect(rA.bottom <= rG.bottom + 1e-6).toBe(true);
    expect(rB.left >= rG.left - 1e-6).toBe(true);
    expect(rB.right <= rG.right + 1e-6).toBe(true);
    expect(rB.top >= rG.top - 1e-6).toBe(true);
    expect(rB.bottom <= rG.bottom + 1e-6).toBe(true);
  });

  it('DOMUS-native path: external node X is outside group G', async () => {
    const layout = await runClusterLayout({ allowDomusWithGroups: true });
    const byId = new Map<string, Node>();
    for (const n of layout.nodes ?? []) {
      byId.set(String(n.id), n);
    }
    const G = byId.get('G')!;
    const X = byId.get('X')!;
    const rG = rectFor(G);
    const rX = rectFor(X);
    const disjoint =
      rX.right < rG.left - 1e-6 ||
      rX.left > rG.right + 1e-6 ||
      rX.bottom < rG.top - 1e-6 ||
      rX.top > rG.bottom + 1e-6;
    expect(disjoint).toBe(true);
  });
});
