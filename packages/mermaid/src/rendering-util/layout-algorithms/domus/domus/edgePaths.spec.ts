import { describe, it, expect } from 'vitest';
import {
  derivePortPlanFromPaths,
  derivePortPlanFromShape,
  createEdgePathsFromShapeAtPorts,
} from './edgePaths.js';
import { createShape } from './types.js';
import type { DomusGraph, DomusResult } from './types.js';
import type { LayoutData } from '../../../types.js';
import type { Point } from '../types.js';

// B / iter-19 — port-plan derivation from A1's shape-walked polylines.
//
// DOMUS §3 (`6784b3d1`): each edge is a sequence of segment labels λ ∈
// {L,R,U,D} — λ is the direction the edge travels between consecutive
// vertices. The first segment's direction IS the start-side outward
// normal; the last segment's direction IS the inverse of the end-side
// outward normal (edge enters the end vertex from the opposite side).
//
// For iter-19 B we derive the portPlan from the walked polyline's first
// and last axis-aligned segments, since DOMUS-labelled paths produce
// axis-aligned pts after `bendTwoPointIfMisaligned` + collinear collapse.
// That geometric reading IS the paper label reading.

describe('derivePortPlanFromPaths', () => {
  it('returns E/W for an axis-aligned horizontal walk', () => {
    const pts: Point[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];
    const data = {
      edges: [{ id: 'e1', start: 'A', end: 'B', points: pts }],
    } as unknown as LayoutData;
    const plan = derivePortPlanFromPaths(new Map([['e1', pts]]), data);
    expect(plan.get('e1')).toEqual({ startSide: 'E', endSide: 'W' });
  });

  it('returns N/S-family sides for an axis-aligned vertical walk', () => {
    const pts: Point[] = [
      { x: 0, y: 0 },
      { x: 0, y: -100 },
    ];
    const data = {
      edges: [{ id: 'e1', start: 'A', end: 'B', points: pts }],
    } as unknown as LayoutData;
    const plan = derivePortPlanFromPaths(new Map([['e1', pts]]), data);
    // Leaving upward (y decreasing) → startSide N. Arriving from below
    // (y still decreasing at arrival) → endSide S.
    expect(plan.get('e1')).toEqual({ startSide: 'N', endSide: 'S' });
  });

  it('derives sides from first and last segments independently for multi-bend paths', () => {
    // Shape walks out N from A, turns E via a dummy bend, arrives at B
    // from the west. First segment A→bend is N (y decreases); last
    // segment bend→B is E (x increases), so B's entry side is W.
    const pts: Point[] = [
      { x: 0, y: 0 },
      { x: 0, y: -50 },
      { x: 100, y: -50 },
    ];
    const data = {
      edges: [{ id: 'e1', start: 'A', end: 'B', points: pts }],
    } as unknown as LayoutData;
    const plan = derivePortPlanFromPaths(new Map([['e1', pts]]), data);
    expect(plan.get('e1')).toEqual({ startSide: 'N', endSide: 'W' });
  });

  it('skips entries when first or last segment is diagonal', () => {
    // Diagonal first segment — no axis, so no side can be inferred.
    // The helper returns no entry rather than guessing, so downstream
    // callers fall back to the positional heuristic.
    const pts: Point[] = [
      { x: 0, y: 0 },
      { x: 100, y: 50 },
    ];
    const data = {
      edges: [{ id: 'e1', start: 'A', end: 'B', points: pts }],
    } as unknown as LayoutData;
    const plan = derivePortPlanFromPaths(new Map([['e1', pts]]), data);
    expect(plan.has('e1')).toBe(false);
  });

  it('ignores self-loops (handled by loop router, not port plan)', () => {
    const pts: Point[] = [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 },
      { x: 0, y: 50 },
    ];
    const data = {
      edges: [{ id: 'self', start: 'A', end: 'A', points: pts }],
    } as unknown as LayoutData;
    const plan = derivePortPlanFromPaths(new Map([['self', pts]]), data);
    expect(plan.has('self')).toBe(false);
  });
});

// ----------------------------------------------------------------------
// iter-21 / R15 full — shape-label-authoritative portPlan derivation and
// port-anchored edge-path construction.
// ----------------------------------------------------------------------

function buildGraphAndShape(
  vertexIds: string[],
  edges: { id: string; from: string; to: string; label: 'L' | 'R' | 'U' | 'D' }[]
): { graph: DomusGraph; shape: ReturnType<typeof createShape> } {
  const graphEdges = edges.map((e) => ({ id: e.id, from: e.from, to: e.to }));
  // Build graph via createDomusGraph-style pattern but allow for dummy vertices.
  const vertices = new Set<string>(vertexIds);
  const edgeMap = new Map<
    string,
    { id: string; from: string; to: string; originalEdgeId: string }
  >();
  const adjacency = new Map<string, { neighbor: string; edgeId: string }[]>();
  for (const v of vertices) {
    adjacency.set(v, []);
  }
  const shape = createShape();
  for (const e of graphEdges) {
    const eId = e.id;
    const originalEdgeId = edges.find((x) => x.id === e.id)!.id.split('__')[0] ?? e.id;
    edgeMap.set(eId, { id: eId, from: e.from, to: e.to, originalEdgeId });
    adjacency.get(e.from)?.push({ neighbor: e.to, edgeId: eId });
    adjacency.get(e.to)?.push({ neighbor: e.from, edgeId: eId });
    const label = edges.find((x) => x.id === e.id)!.label;
    shape.setLabel(eId, label, e.from, e.to);
  }
  const graph: DomusGraph = {
    vertices,
    edges: edgeMap as unknown as DomusGraph['edges'],
    adjacency,
    dummyVertices: new Map(),
    originalVertices: vertices,
  };
  return { graph, shape };
}

describe('derivePortPlanFromShape (iter-21 R15)', () => {
  it('reads startSide from first segment label and endSide as inverse of last segment label', () => {
    // Single segment A→B labeled R: start leaves E (toward east), end enters W (from west).
    const { graph, shape } = buildGraphAndShape(
      ['A', 'B'],
      [{ id: 'e1', from: 'A', to: 'B', label: 'R' }]
    );
    const domusResult: DomusResult = {
      success: true,
      graph,
      shape,
      stats: { satInvocations: 0, cyclesAdded: 0, edgeSplits: 0, dummyVertices: 0 },
    };
    const layoutEdges = [{ id: 'e1', start: 'A', end: 'B' }];
    const plan = derivePortPlanFromShape(domusResult, layoutEdges as never);
    expect(plan.get('e1')).toEqual({ startSide: 'E', endSide: 'W' });
  });

  it('derives N/S from U/D-labelled single segment', () => {
    // Label U means travel upward (y decreases): leaves N, enters S (end below).
    const { graph, shape } = buildGraphAndShape(
      ['A', 'B'],
      [{ id: 'e1', from: 'A', to: 'B', label: 'U' }]
    );
    const domusResult: DomusResult = {
      success: true,
      graph,
      shape,
      stats: { satInvocations: 0, cyclesAdded: 0, edgeSplits: 0, dummyVertices: 0 },
    };
    const layoutEdges = [{ id: 'e1', start: 'A', end: 'B' }];
    const plan = derivePortPlanFromShape(domusResult, layoutEdges as never);
    expect(plan.get('e1')).toEqual({ startSide: 'N', endSide: 'S' });
  });

  it('handles multi-segment paths via first and last segment labels independently', () => {
    // A exits north (label U on A→bend), then bends east to B (label R on bend→B).
    // Expect startSide='N' (from U on first segment); endSide='W' (R labels last segment,
    // edge entering B from the west).
    const { graph, shape } = buildGraphAndShape(
      ['A', 'B', 'bend'],
      [
        { id: 'seg1', from: 'A', to: 'bend', label: 'U' },
        { id: 'seg2', from: 'bend', to: 'B', label: 'R' },
      ]
    );
    // Both segments carry the same originalEdgeId so derivePortPlanFromShape
    // can join them into one logical edge.
    const edge1 = graph.edges.get('seg1') as { originalEdgeId: string };
    edge1.originalEdgeId = 'e1';
    const edge2 = graph.edges.get('seg2') as { originalEdgeId: string };
    edge2.originalEdgeId = 'e1';

    const domusResult: DomusResult = {
      success: true,
      graph,
      shape,
      stats: { satInvocations: 0, cyclesAdded: 0, edgeSplits: 0, dummyVertices: 0 },
    };
    const layoutEdges = [{ id: 'e1', start: 'A', end: 'B' }];
    const plan = derivePortPlanFromShape(domusResult, layoutEdges as never);
    expect(plan.get('e1')).toEqual({ startSide: 'N', endSide: 'W' });
  });

  it('returns empty plan when domusResult.shape is missing', () => {
    const { graph } = buildGraphAndShape(
      ['A', 'B'],
      [{ id: 'e1', from: 'A', to: 'B', label: 'R' }]
    );
    const domusResult: DomusResult = {
      success: true,
      graph,
      // shape omitted
      stats: { satInvocations: 0, cyclesAdded: 0, edgeSplits: 0, dummyVertices: 0 },
    };
    const layoutEdges = [{ id: 'e1', start: 'A', end: 'B' }];
    const plan = derivePortPlanFromShape(domusResult, layoutEdges as never);
    expect(plan.has('e1')).toBe(false);
  });

  // iter-22 — vertex-expansion resolution.
  //
  // In `vertexExpansion.ts:expandHighDegreeVerticesPostSat`, a high-degree
  // LayoutData vertex `H` is replaced by an internal chain:
  // `H_core` plus `H_port_*`. Edges incident on `H` are rewired so that
  // `seg.from` / `seg.to` point at the chain vertex, not at `H`. Iter-21's
  // `derivePortPlanFromShape` filtered segments by direct-incidence on the
  // LayoutData ID and therefore skipped every edge adjacent to an expanded
  // vertex (5/9 fell through on `company-simp`). This block pins the
  // expansion-aware resolution path so coverage can reach 9/9.
  it('resolves expanded start vertex via neighborToChainVertex (port case)', () => {
    // H is expanded: H_port_D_0 is the D-side port that connects to B.
    // The external edge `e1` was rewired so seg.from = H_port_D_0.
    const { graph, shape } = buildGraphAndShape(
      ['H_core', 'H_port_D_0', 'B'],
      [{ id: 'e1', from: 'H_port_D_0', to: 'B', label: 'D' }]
    );
    const domusResult: DomusResult = {
      success: true,
      graph,
      shape,
      expansions: new Map([
        [
          'H',
          {
            originalVertexId: 'H',
            chainVertexIds: ['H_core', 'H_port_D_0'],
            chainEdgeIds: [],
            neighborToChainVertex: new Map([['B', 'H_port_D_0']]),
          },
        ],
      ]),
      stats: { satInvocations: 0, cyclesAdded: 0, edgeSplits: 0, dummyVertices: 0 },
    };
    // LayoutData uses the logical ID `H`, NOT the chain vertex ID.
    const layoutEdges = [{ id: 'e1', start: 'H', end: 'B' }];
    const plan = derivePortPlanFromShape(domusResult, layoutEdges as never);
    // Label D on H_port_D_0 → B means travel south out of H. startSide = S.
    // endSide = inverse of D = N.
    expect(plan.get('e1')).toEqual({ startSide: 'S', endSide: 'N' });
  });

  it('resolves expanded start vertex via neighborToChainVertex (core case)', () => {
    // H is expanded: H_core is the direct core vertex (single-neighbor
    // direction from expandVertexIntoBox:159) connecting to C.
    const { graph, shape } = buildGraphAndShape(
      ['H_core', 'H_port_D_0', 'C'],
      [{ id: 'e2', from: 'H_core', to: 'C', label: 'L' }]
    );
    const domusResult: DomusResult = {
      success: true,
      graph,
      shape,
      expansions: new Map([
        [
          'H',
          {
            originalVertexId: 'H',
            chainVertexIds: ['H_core', 'H_port_D_0'],
            chainEdgeIds: [],
            neighborToChainVertex: new Map([['C', 'H_core']]),
          },
        ],
      ]),
      stats: { satInvocations: 0, cyclesAdded: 0, edgeSplits: 0, dummyVertices: 0 },
    };
    const layoutEdges = [{ id: 'e2', start: 'H', end: 'C' }];
    const plan = derivePortPlanFromShape(domusResult, layoutEdges as never);
    // Label L → travel west. startSide = W. endSide = inverse L = E.
    expect(plan.get('e2')).toEqual({ startSide: 'W', endSide: 'E' });
  });

  it('resolves both endpoints when both are expanded', () => {
    // Two expanded vertices: H and K. Edge goes from H's port out to K's port.
    const { graph, shape } = buildGraphAndShape(
      ['H_core', 'H_port_R_0', 'K_core', 'K_port_L_0'],
      [{ id: 'e3', from: 'H_port_R_0', to: 'K_port_L_0', label: 'R' }]
    );
    const domusResult: DomusResult = {
      success: true,
      graph,
      shape,
      expansions: new Map([
        [
          'H',
          {
            originalVertexId: 'H',
            chainVertexIds: ['H_core', 'H_port_R_0'],
            chainEdgeIds: [],
            neighborToChainVertex: new Map([['K', 'H_port_R_0']]),
          },
        ],
        [
          'K',
          {
            originalVertexId: 'K',
            chainVertexIds: ['K_core', 'K_port_L_0'],
            chainEdgeIds: [],
            neighborToChainVertex: new Map([['H', 'K_port_L_0']]),
          },
        ],
      ]),
      stats: { satInvocations: 0, cyclesAdded: 0, edgeSplits: 0, dummyVertices: 0 },
    };
    const layoutEdges = [{ id: 'e3', start: 'H', end: 'K' }];
    const plan = derivePortPlanFromShape(domusResult, layoutEdges as never);
    expect(plan.get('e3')).toEqual({ startSide: 'E', endSide: 'W' });
  });
});

describe('createEdgePathsFromShapeAtPorts (iter-21 R15)', () => {
  // Nodes: A at (0,0) 20x20; B at (100,0) 20x20. Horizontal gap, same y.
  const A = { id: 'A', isGroup: false, x: 0, y: 0, width: 20, height: 20 };
  const B = { id: 'B', isGroup: false, x: 100, y: 0, width: 20, height: 20 };

  it('anchors a 2-point walk at port positions (straight horizontal when t=0.5 on both)', () => {
    const { graph, shape } = buildGraphAndShape(
      ['A', 'B'],
      [{ id: 'e1', from: 'A', to: 'B', label: 'R' }]
    );
    (graph.edges.get('e1') as { originalEdgeId: string }).originalEdgeId = 'e1';
    const domusResult: DomusResult = {
      success: true,
      graph,
      shape,
      stats: { satInvocations: 0, cyclesAdded: 0, edgeSplits: 0, dummyVertices: 0 },
    };
    const layout = {
      nodes: [A, B],
      edges: [{ id: 'e1', start: 'A', end: 'B' }],
    } as unknown as LayoutData;
    const portPlan = new Map([['e1', { startSide: 'E' as const, endSide: 'W' as const }]]);
    const tByEdgeEndpointKey = new Map([
      ['e1|start', 0.5],
      ['e1|end', 0.5],
    ]);

    const paths = createEdgePathsFromShapeAtPorts(
      layout,
      domusResult,
      portPlan,
      tByEdgeEndpointKey
    );
    const pts = paths.get('e1')!;
    // port0 = A.right (10), A.cy (0). port1 = B.left (90), B.cy (0). Straight horizontal.
    expect(pts[0]).toEqual({ x: 10, y: 0 });
    expect(pts[pts.length - 1]).toEqual({ x: 90, y: 0 });
    // No elbow needed; polyline is straight (single segment).
    expect(pts.length).toBe(2);
  });

  it('inserts an elbow when start and end ports are off-axis', () => {
    // t=0.2 on A's E-side → port at y=-6; t=0.5 on B's W-side → port at y=0.
    // Label R → horizontal-first exit → bend at (port1.x, port0.y).
    const { graph, shape } = buildGraphAndShape(
      ['A', 'B'],
      [{ id: 'e1', from: 'A', to: 'B', label: 'R' }]
    );
    (graph.edges.get('e1') as { originalEdgeId: string }).originalEdgeId = 'e1';
    const domusResult: DomusResult = {
      success: true,
      graph,
      shape,
      stats: { satInvocations: 0, cyclesAdded: 0, edgeSplits: 0, dummyVertices: 0 },
    };
    const layout = {
      nodes: [A, B],
      edges: [{ id: 'e1', start: 'A', end: 'B' }],
    } as unknown as LayoutData;
    const portPlan = new Map([['e1', { startSide: 'E' as const, endSide: 'W' as const }]]);
    const tByEdgeEndpointKey = new Map([
      ['e1|start', 0.2],
      ['e1|end', 0.5],
    ]);

    const paths = createEdgePathsFromShapeAtPorts(
      layout,
      domusResult,
      portPlan,
      tByEdgeEndpointKey
    );
    const pts = paths.get('e1')!;
    // Port0 = (10, -6). Port1 = (90, 0). Expect an intermediate elbow.
    expect(pts[0]).toEqual({ x: 10, y: -6 });
    expect(pts[pts.length - 1]).toEqual({ x: 90, y: 0 });
    expect(pts.length).toBe(3);
    const elbow = pts[1];
    // First segment horizontal (port0.y constant → elbow.y = -6).
    expect(elbow.y).toBeCloseTo(-6);
    // Second segment vertical (elbow.x = port1.x).
    expect(elbow.x).toBeCloseTo(90);
  });

  it('preserves interior dummy bends between port anchors', () => {
    // Walk: A → dummy(at x=50, y=-40) → B, labels U then R.
    // Ports: startSide N, endSide W. Port0 = (A.cx=0, A.top=-10). Port1 = (B.left=90, B.cy=0).
    // Expected polyline: [port0, (port0.x, dummy.y), dummy, (dummy.x, port1.y)?, port1]
    // With centered ports, dummy at (50,-40) provides the interior shape.
    // Minimally: [port0, (0,-40), (50,-40), (50,0)? wait port1.y=0 → (50,0), port1].
    // Simpler invariants: pts[0] at port0, pts[last] at port1, all segments axis-aligned,
    // dummy coordinate (50,-40) present somewhere in the interior.
    const { graph, shape } = buildGraphAndShape(
      ['A', 'B', 'dummy'],
      [
        { id: 'seg1', from: 'A', to: 'dummy', label: 'U' },
        { id: 'seg2', from: 'dummy', to: 'B', label: 'R' },
      ]
    );
    (graph.edges.get('seg1') as { originalEdgeId: string }).originalEdgeId = 'e1';
    (graph.edges.get('seg2') as { originalEdgeId: string }).originalEdgeId = 'e1';
    const fullCoordinates = new Map<string, Point>([
      ['A', { x: 0, y: 0 }],
      ['B', { x: 100, y: 0 }],
      ['dummy', { x: 50, y: -40 }],
    ]);
    const domusResult: DomusResult = {
      success: true,
      graph,
      shape,
      fullCoordinates,
      stats: { satInvocations: 0, cyclesAdded: 0, edgeSplits: 0, dummyVertices: 0 },
    };
    const layout = {
      nodes: [A, B],
      edges: [{ id: 'e1', start: 'A', end: 'B' }],
    } as unknown as LayoutData;
    const portPlan = new Map([['e1', { startSide: 'N' as const, endSide: 'W' as const }]]);
    const tByEdgeEndpointKey = new Map([
      ['e1|start', 0.5],
      ['e1|end', 0.5],
    ]);

    const paths = createEdgePathsFromShapeAtPorts(
      layout,
      domusResult,
      portPlan,
      tByEdgeEndpointKey
    );
    const pts = paths.get('e1')!;
    // pts[0] at A's N-centre port = (0, -10).
    expect(pts[0]).toEqual({ x: 0, y: -10 });
    // pts[last] at B's W-centre port = (90, 0).
    expect(pts[pts.length - 1]).toEqual({ x: 90, y: 0 });
    // Every segment axis-aligned (no diagonals).
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const dx = Math.abs(a.x - b.x);
      const dy = Math.abs(a.y - b.y);
      expect(dx < 1e-6 || dy < 1e-6).toBe(true);
    }
    // Dummy coordinate visible somewhere in the polyline (visual bend point at its x or y).
    const hasDummyX = pts.some((p) => Math.abs(p.x - 50) < 1e-6);
    const hasDummyY = pts.some((p) => Math.abs(p.y - -40) < 1e-6);
    expect(hasDummyX && hasDummyY).toBe(true);
  });
});
