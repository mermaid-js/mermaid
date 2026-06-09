import { describe, it, expect } from 'vitest';
import { applyDomusPortDistribution, createPortTAllocator } from './portDistribution.js';
import { applyPortDirectionStubs } from './portStubs.js';
import { validateLayout } from '../../layout-utils/validateLayout.js';
import type { LayoutData, Node } from '../../../types.js';

describe('domus/pipeline/portDistribution - ', () => {
  it('allocates t values deterministically based on geometry order', () => {
    const A: Node = { id: 'A', isGroup: false, x: 0, y: 0, width: 10, height: 10 };
    const B: Node = { id: 'B', isGroup: false, x: 100, y: -50, width: 10, height: 10 };
    const C: Node = { id: 'C', isGroup: false, x: 100, y: 50, width: 10, height: 10 };
    const data = {
      nodes: [A, B, C],
      edges: [
        { id: 'eUp', start: 'A', end: 'B' },
        { id: 'eDown', start: 'A', end: 'C' },
      ],
    } as unknown as LayoutData;
    const nodesById = new Map<string, Node>([
      ['A', A],
      ['B', B],
      ['C', C],
    ]);

    const { tByEdgeEndpointKey } = createPortTAllocator({ data, nodesById });
    const tUp = tByEdgeEndpointKey.get('eUp|start')!;
    const tDown = tByEdgeEndpointKey.get('eDown|start')!;
    expect(tUp).toBeLessThan(tDown);
    expect(tUp).toBeCloseTo(0.2);
    expect(tDown).toBeCloseTo(0.8);
  });

  describe('applyDomusPortDistribution', () => {
    it('distributes collinear same-side departures to distinct boundary ports', () => {
      // R3 / Phase C1 — DOMUS emits centre-based polylines. Two edges leaving
      // A's E side share the same (5, 0) endpoint (validator: edge-same-port-
      // departure). The helper should push each to its allocator-assigned t
      // along the E side without touching interior bends.
      const A: Node = { id: 'A', isGroup: false, x: 0, y: 0, width: 10, height: 10 };
      const B: Node = { id: 'B', isGroup: false, x: 100, y: -50, width: 10, height: 10 };
      const C: Node = { id: 'C', isGroup: false, x: 100, y: 50, width: 10, height: 10 };
      const edges = [
        {
          id: 'eUp',
          start: 'A',
          end: 'B',
          points: [
            { x: 0, y: 0 },
            { x: 100, y: -50 },
          ],
        },
        {
          id: 'eDown',
          start: 'A',
          end: 'C',
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 50 },
          ],
        },
      ];
      const data = { nodes: [A, B, C], edges } as unknown as LayoutData;
      const nodesById = new Map<string, Node>([
        ['A', A],
        ['B', B],
        ['C', C],
      ]);

      applyDomusPortDistribution(data, nodesById);

      const upStart = edges[0].points[0];
      const downStart = edges[1].points[0];
      // Both on A's E side — x pinned to right boundary (cx + w/2 = 5).
      expect(upStart.x).toBeCloseTo(5);
      expect(downStart.x).toBeCloseTo(5);
      // Allocator sorts by neighbour cy ascending: B at -50 before C at 50,
      // so eUp gets t=0.2 (y = top + 0.2 * h = -3) and eDown gets t=0.8 (y = 3).
      expect(upStart.y).toBeCloseTo(-3);
      expect(downStart.y).toBeCloseTo(3);
      expect(upStart.y).toBeLessThan(downStart.y);
    });

    it('skips self-loops but distributes group endpoints', () => {
      const A: Node = { id: 'A', isGroup: false, x: 0, y: 0, width: 10, height: 10 };
      const G: Node = { id: 'G', isGroup: true, x: 50, y: 50, width: 40, height: 40 };
      const H: Node = { id: 'H', isGroup: true, x: 100, y: 30, width: 40, height: 40 };
      const edges = [
        {
          id: 'loop',
          start: 'A',
          end: 'A',
          points: [
            { x: 0, y: 0 },
            { x: 0, y: 0 },
          ],
        },
        {
          id: 'toGroup',
          start: 'A',
          end: 'G',
          points: [
            { x: 0, y: 0 },
            { x: 50, y: 50 },
          ],
        },
        {
          id: 'fromGroup',
          start: 'G',
          end: 'H',
          points: [
            { x: 50, y: 50 },
            { x: 100, y: 30 },
          ],
        },
      ];
      const data = { nodes: [A, G, H], edges } as unknown as LayoutData;
      const nodesById = new Map<string, Node>([
        ['A', A],
        ['G', G],
        ['H', H],
      ]);

      applyDomusPortDistribution(data, nodesById);

      // Untouched: self-loop polylines still have their original centres.
      expect(edges[0].points[0]).toEqual({ x: 0, y: 0 });
      // Group endpoints are now distributed just like leaf endpoints.
      expect(edges[1].points[edges[1].points.length - 1].x).toBeCloseTo(30);
      expect(edges[2].points[0].x).toBeCloseTo(70);
    });

    it('preserves interior bends when replacing endpoints', () => {
      const A: Node = { id: 'A', isGroup: false, x: 0, y: 0, width: 10, height: 10 };
      const B: Node = { id: 'B', isGroup: false, x: 200, y: 100, width: 10, height: 10 };
      const edges = [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 200, y: 100 },
          ],
        },
      ];
      const data = { nodes: [A, B], edges } as unknown as LayoutData;
      const nodesById = new Map<string, Node>([
        ['A', A],
        ['B', B],
      ]);

      applyDomusPortDistribution(data, nodesById);

      // Interior bends remain identical.
      expect(edges[0].points[1]).toEqual({ x: 100, y: 0 });
      expect(edges[0].points[2]).toEqual({ x: 100, y: 100 });
      // Endpoints moved to boundaries (single edge on side → t=0.5, centre).
      expect(edges[0].points[0].x).toBeCloseTo(5);
      expect(edges[0].points[0].y).toBeCloseTo(0);
      expect(edges[0].points[3].x).toBeCloseTo(195);
      expect(edges[0].points[3].y).toBeCloseTo(100);
    });

    it('inserts orthogonal elbow when boundary port is off-axis from the next interior point', () => {
      // R14 / iter-10 — C1 side-effect repair. Two edges leaving A's E side:
      // allocator assigns t=0.2 for the upper neighbour and t=0.8 for the
      // lower. A1's shape walk produced polylines that bend at a column
      // matching A.y (the old centre-y). Off-centre ports alone would leave
      // the first segment diagonal (validator: edge-non-orthogonal). The
      // helper must insert an elbow at (next.x, newStart.y) so both
      // sub-segments are axis-aligned.
      //
      // A is 30 wide and 30 tall so the elbow leg (0.3 × 15 = 4.5) clears
      // the micro-segment guard (< 4 units keeps the centre instead).
      const A: Node = { id: 'A', isGroup: false, x: 0, y: 0, width: 30, height: 30 };
      const B: Node = { id: 'B', isGroup: false, x: 100, y: -50, width: 10, height: 10 };
      const C: Node = { id: 'C', isGroup: false, x: 100, y: 50, width: 10, height: 10 };
      const edges = [
        {
          id: 'eUp',
          start: 'A',
          end: 'B',
          points: [
            { x: 0, y: 0 },
            { x: 50, y: 0 },
            { x: 50, y: -50 },
            { x: 100, y: -50 },
          ],
        },
        {
          id: 'eDown',
          start: 'A',
          end: 'C',
          points: [
            { x: 0, y: 0 },
            { x: 50, y: 0 },
            { x: 50, y: 50 },
            { x: 100, y: 50 },
          ],
        },
      ];
      const data = { nodes: [A, B, C], edges } as unknown as LayoutData;
      const nodesById = new Map<string, Node>([
        ['A', A],
        ['B', B],
        ['C', C],
      ]);

      applyDomusPortDistribution(data, nodesById);

      // A's E side: right=15, top=-15, bottom=15, height=30.
      // t=0.2 → y = -15 + 0.2*30 = -9. t=0.8 → y = -15 + 0.8*30 = 9.
      // eUp: newStart = (15, -9); original points[1] = (50, 0). Segment
      // (15, -9) → (50, 0) is diagonal. Helper inserts elbow at (50, -9) so
      // (15, -9) → (50, -9) is horizontal and (50, -9) → (50, 0) is vertical.
      const upPts = edges[0].points;
      expect(upPts[0]).toEqual({ x: 15, y: -9 });
      expect(upPts[1]).toEqual({ x: 50, y: -9 });
      expect(upPts[2]).toEqual({ x: 50, y: 0 });
      // Original interior bends preserved after the elbow.
      expect(upPts[3]).toEqual({ x: 50, y: -50 });

      // eDown: symmetric — new port at (15, 9), elbow at (50, 9).
      const downPts = edges[1].points;
      expect(downPts[0]).toEqual({ x: 15, y: 9 });
      expect(downPts[1]).toEqual({ x: 50, y: 9 });
      expect(downPts[2]).toEqual({ x: 50, y: 0 });
    });

    it('R14 / iter-11 — chained port-direction stubs clear axis-mismatch from C1', () => {
      // R14 direction-mismatch half. When A1's shape walk produces an interior
      // bend collinear with a future off-centre port (e.g. dummy at the same x
      // as a W/E port column), C1's elbow check sees `dx<eps` on the first
      // segment and skips elbow insertion. The first segment is then
      // axis-aligned but on the WRONG axis for the port side: a W/E port
      // followed by a vertical first segment leaves the port perpendicular
      // to its own side. Validator: edge-port-direction-mismatch.
      //
      // Fix shape (iter-11): chain `applyPortDirectionStubs` after C1. The
      // existing stub helper already handles this case in the cycle-removal
      // path (domusBackend.ts:281). After the chained call, every edge's
      // first/last segment must agree with its boundary side.
      const A: Node = { id: 'A', isGroup: false, x: 0, y: 0, width: 30, height: 30 };
      const B: Node = { id: 'B', isGroup: false, x: 100, y: -50, width: 10, height: 10 };
      const C: Node = { id: 'C', isGroup: false, x: 100, y: 50, width: 10, height: 10 };
      // A1's hypothetical shape walk: each polyline bends at x=15 (A's E
      // column) and then turns toward the target. Two edges leave A's E side
      // → C1 will distribute to t=0.2 / t=0.8 (y = -9 / y = 9). For the
      // top-going edge, points[1]=(15, -50) is collinear with the new port
      // (15, -9) — first segment is vertical even though the port is on E.
      const edges = [
        {
          id: 'eUp',
          start: 'A',
          end: 'B',
          points: [
            { x: 0, y: 0 },
            { x: 15, y: -50 },
            { x: 100, y: -50 },
          ],
        },
        {
          id: 'eDown',
          start: 'A',
          end: 'C',
          points: [
            { x: 0, y: 0 },
            { x: 15, y: 50 },
            { x: 100, y: 50 },
          ],
        },
      ];
      const data = { nodes: [A, B, C], edges } as unknown as LayoutData;
      const nodesById = new Map<string, Node>([
        ['A', A],
        ['B', B],
        ['C', C],
      ]);

      applyDomusPortDistribution(data, nodesById);

      // Sanity: post-C1 the first segment is axis-aligned but on the wrong
      // axis (vertical from an E-side port). This is the symptom we're
      // fixing — capture it explicitly so the test fails fast if C1 ever
      // changes shape.
      const postC1 = validateLayout(data);
      const c1Mismatches = postC1.issues.filter(
        (iss) => iss.type === 'edge-port-direction-mismatch'
      );
      expect(c1Mismatches.length).toBeGreaterThanOrEqual(2);

      const portMismatchEdgeIds = new Set(
        c1Mismatches.map((iss) => String(iss.edgeId)).filter((id) => id !== 'undefined')
      );
      const { changed } = applyPortDirectionStubs(data, portMismatchEdgeIds, 10);
      expect(changed).toBeGreaterThanOrEqual(2);

      const after = validateLayout(data);
      const remaining = after.issues.filter((iss) => iss.type === 'edge-port-direction-mismatch');
      expect(remaining).toEqual([]);
    });

    it('keeps centre when pushing to boundary would create a micro-segment', () => {
      // Neighbour point (1, 0) is already inside A's rect — pushing endpoint
      // to (5, 0) would leave a 4-unit segment, right at the micro threshold.
      // Shifting neighbour to (4.9, 0) puts the resulting segment at 0.1 units
      // — helper must keep the centre.
      const A: Node = { id: 'A', isGroup: false, x: 0, y: 0, width: 10, height: 10 };
      const B: Node = { id: 'B', isGroup: false, x: 200, y: 0, width: 10, height: 10 };
      const edges = [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 0, y: 0 },
            { x: 4.9, y: 0 },
            { x: 4.9, y: 50 },
            { x: 200, y: 50 },
            { x: 200, y: 0 },
          ],
        },
      ];
      const data = { nodes: [A, B], edges } as unknown as LayoutData;
      const nodesById = new Map<string, Node>([
        ['A', A],
        ['B', B],
      ]);

      applyDomusPortDistribution(data, nodesById);

      // Start unchanged because the would-be replacement segment is <4 units.
      expect(edges[0].points[0]).toEqual({ x: 0, y: 0 });
    });
  });

  describe('Phase C2 — Kandinsky bend-or-end: centre-pin reservation for straight-through pairs', () => {
    // Phase C2 of the DOMUS plan: when a node has edges on both sides of an
    // axis (E+W or N+S), pick the most-aligned pair (by orderCoord) and pin
    // both endpoints to t=0.5 — Siebenhaller's Def 2.5 "bend-or-end" rule.
    // Other edges on the same side distribute off-centre in [0.2, 0.45] and
    // [0.55, 0.8], preserving cyclic order and leaving t=0.5 reserved.
    //
    // Paper anchor: Siebenhaller *Constraint-Kandinsky* Def 2.5 + centred-pin
    // rule — "at most one straight-line edge per vertex side ... straight-line
    // edges are centered at the corresponding vertex side (assigned to the
    // κ-th fine grid line)".
    //
    // STATUS (iter-18, reverted): implemented but regressed company-simp
    // `realIssueCount` 4→7. Root cause: A1's shape walk plans polylines
    // before port pinning is decided, so C2-induced t-shifts create
    // arrival-direction mismatches that iter-11's stubs can't reconcile.
    // The two `it.todo` cases below preserve the target spec for a future
    // iteration that redesigns A1 to co-plan with centre pins (candidate
    // new root cause R15 — see plan). The `no-partner` case stays live
    // because it documents the contract that's already satisfied by the
    // default allocator (0.2 / 0.8 distribution).

    // Fixture: A at origin with 1 edge on its W side (incoming from C)
    // and 2 edges on its E side (outgoing to B, D). B is directly east
    // (y=0, matching C's y=0); D is east-south (y=50). Partner of C→A
    // (orderCoord 0) is A→B (orderCoord 0, exact match) — A→B should
    // take the centre pin on A's E side, not A→D.
    //
    // Under default allocator (pre-C2): E-side edges sort by cy ascending:
    //   A→B (cy=0) → t=0.2; A→D (cy=50) → t=0.8. Neither at centre.
    // Under C2: A→B pinned to 0.5 (partner of W's lone edge); A→D shifts
    //   to the above-pinned slot = centre of [0.55, 0.8] = 0.675.
    it('pins the orderCoord-aligned partner when two edges share a side and the opposite side has one', () => {
      const A: Node = { id: 'A', isGroup: false, x: 0, y: 0, width: 10, height: 10 };
      const B: Node = { id: 'B', isGroup: false, x: 100, y: 0, width: 10, height: 10 };
      const C: Node = { id: 'C', isGroup: false, x: -100, y: 0, width: 10, height: 10 };
      const D: Node = { id: 'D', isGroup: false, x: 100, y: 50, width: 10, height: 10 };
      const data = {
        nodes: [A, B, C, D],
        edges: [
          { id: 'AB', start: 'A', end: 'B' },
          { id: 'AD', start: 'A', end: 'D' },
          { id: 'CA', start: 'C', end: 'A' },
        ],
      } as unknown as LayoutData;
      const nodesById = new Map<string, Node>([
        ['A', A],
        ['B', B],
        ['C', C],
        ['D', D],
      ]);

      const { tByEdgeEndpointKey } = createPortTAllocator({ data, nodesById });

      // AB is the straight-through partner of CA on A (orderCoord 0 match).
      // CA's end on A's W side has k=1 so it's at 0.5 anyway.
      expect(tByEdgeEndpointKey.get('AB|start')).toBeCloseTo(0.5);
      expect(tByEdgeEndpointKey.get('CA|end')).toBeCloseTo(0.5);
      // AD is off-centre, on the far side of the pinned edge (orderCoord 50
      // is above 0).
      expect(tByEdgeEndpointKey.get('AD|start')!).toBeGreaterThan(0.5);
      expect(tByEdgeEndpointKey.get('AD|start')!).toBeLessThan(0.8);
    });

    // Fixture: A with 2 edges on its E side (to B, D) and NO edges on its
    // W side. No straight-through partner → centre stays open, all E-side
    // edges distribute off-centre. Equivalent to the pre-C2 behaviour for
    // k=2 with no partner (default allocator gives [0.2, 0.8]).
    it('leaves centre empty when the opposite side has no edges (k=2, no partner)', () => {
      const A: Node = { id: 'A', isGroup: false, x: 0, y: 0, width: 10, height: 10 };
      const B: Node = { id: 'B', isGroup: false, x: 100, y: -50, width: 10, height: 10 };
      const D: Node = { id: 'D', isGroup: false, x: 100, y: 50, width: 10, height: 10 };
      const data = {
        nodes: [A, B, D],
        edges: [
          { id: 'AB', start: 'A', end: 'B' },
          { id: 'AD', start: 'A', end: 'D' },
        ],
      } as unknown as LayoutData;
      const nodesById = new Map<string, Node>([
        ['A', A],
        ['B', B],
        ['D', D],
      ]);

      const { tByEdgeEndpointKey } = createPortTAllocator({ data, nodesById });

      // No partner on W side → no pin. Default allocator gives [0.2, 0.8].
      expect(tByEdgeEndpointKey.get('AB|start')).toBeCloseTo(0.2);
      expect(tByEdgeEndpointKey.get('AD|start')).toBeCloseTo(0.8);
    });

    // Fixture: A with 3 edges on E (B at y=-50, D at y=0, E at y=+50) and
    // 1 edge on W (C at y=0). Partner of CA is AD (orderCoord match at 0).
    // AD pinned at 0.5. AB (below AD in orderCoord) goes to the [0.2, 0.45]
    // range centre = 0.325; AE (above) goes to [0.55, 0.8] centre = 0.675.
    it('distributes k=3-with-pin symmetrically around the centre pin', () => {
      const A: Node = { id: 'A', isGroup: false, x: 0, y: 0, width: 10, height: 10 };
      const B: Node = { id: 'B', isGroup: false, x: 100, y: -50, width: 10, height: 10 };
      const C: Node = { id: 'C', isGroup: false, x: -100, y: 0, width: 10, height: 10 };
      const D: Node = { id: 'D', isGroup: false, x: 100, y: 0, width: 10, height: 10 };
      const E: Node = { id: 'E', isGroup: false, x: 100, y: 50, width: 10, height: 10 };
      const data = {
        nodes: [A, B, C, D, E],
        edges: [
          { id: 'AB', start: 'A', end: 'B' },
          { id: 'AD', start: 'A', end: 'D' },
          { id: 'AE', start: 'A', end: 'E' },
          { id: 'CA', start: 'C', end: 'A' },
        ],
      } as unknown as LayoutData;
      const nodesById = new Map<string, Node>([
        ['A', A],
        ['B', B],
        ['C', C],
        ['D', D],
        ['E', E],
      ]);

      const { tByEdgeEndpointKey } = createPortTAllocator({ data, nodesById });

      // AD is the straight-through partner of CA; both at 0.5.
      expect(tByEdgeEndpointKey.get('AD|start')).toBeCloseTo(0.5);
      expect(tByEdgeEndpointKey.get('CA|end')).toBeCloseTo(0.5);
      // AB (cy=-50, below AD) → centre of [0.2, 0.45] = 0.325.
      expect(tByEdgeEndpointKey.get('AB|start')).toBeCloseTo(0.325);
      // AE (cy=50, above AD) → centre of [0.55, 0.8] = 0.675.
      expect(tByEdgeEndpointKey.get('AE|start')).toBeCloseTo(0.675);
    });
  });

  describe('Phase R15 iter-21 — applyDomusPortDistribution idempotence', () => {
    it('is a no-op when endpoints are already within eps of the allocated port', () => {
      // Simulates iter-21's new flow: A1 already anchored endpoints at port
      // positions. C1 must NOT re-insert elbows or re-move endpoints when
      // there is nothing to do.
      const A: Node = { id: 'A', isGroup: false, x: 0, y: 0, width: 10, height: 10 };
      const B: Node = { id: 'B', isGroup: false, x: 100, y: 0, width: 10, height: 10 };
      // Endpoints placed at the exact E/W ports that the allocator will emit
      // for a single edge on each side (t=0.5): (5, 0) and (95, 0).
      const edges = [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 5, y: 0 },
            { x: 95, y: 0 },
          ],
        },
      ];
      const data = { nodes: [A, B], edges } as unknown as LayoutData;
      const nodesById = new Map<string, Node>([
        ['A', A],
        ['B', B],
      ]);

      const before = [...edges[0].points];
      const stats = applyDomusPortDistribution(data, nodesById);

      // Points unchanged; no elbows inserted.
      expect(edges[0].points).toEqual(before);
      expect(stats.startElbowsInserted).toBe(0);
      expect(stats.endElbowsInserted).toBe(0);
    });
  });

  describe('Phase B iter-19 — portPlan overrides positional side heuristic', () => {
    // DOMUS §3 (source `6784b3d1`): each edge is a sequence of labels
    // λ ∈ {L,R,U,D}; λ denotes the direction the edge leaves/enters a
    // vertex. This makes the shape label authoritative for port side.
    // `assignPortsForEdge`'s `|dx|>=|dy|` fallback is positional — good
    // when no shape exists, wrong when the shape disagrees (e.g. DOMUS
    // routes vertically on a fixture where the placement happens to be
    // slightly wider than tall).

    it('uses portPlan.startSide instead of assignPortsForEdge positional pick', () => {
      // Positionally: A (0,0) to B (100, 10) has dx=100, dy=10 →
      // `assignPortsForEdge` picks E→W. The portPlan overrides to N→S
      // (say, because the DOMUS shape routed vertically via a dummy
      // bend). The allocator must record endpoints on N/S, so port
      // distribution lands on those sides.
      const A: Node = { id: 'A', isGroup: false, x: 0, y: 0, width: 10, height: 10 };
      const B: Node = { id: 'B', isGroup: false, x: 100, y: 10, width: 10, height: 10 };
      const data = {
        nodes: [A, B],
        edges: [{ id: 'e1', start: 'A', end: 'B' }],
      } as unknown as LayoutData;
      const nodesById = new Map<string, Node>([
        ['A', A],
        ['B', B],
      ]);
      const portPlan = new Map([['e1', { startSide: 'N' as const, endSide: 'S' as const }]]);

      const { tByEdgeEndpointKey } = createPortTAllocator({ data, nodesById, portPlan });

      // With a single edge on each side, t = 0.5 (allocator's k=1 rule).
      // The key existing at all proves the allocator used the overridden
      // side (otherwise endpoints would land on E/W and the lookup keys
      // would not be populated on N/S at t=0.5 — verified indirectly by
      // the distribution pass below).
      expect(tByEdgeEndpointKey.get('e1|start')).toBeCloseTo(0.5);
      expect(tByEdgeEndpointKey.get('e1|end')).toBeCloseTo(0.5);
    });

    it('pushes port endpoints onto the portPlan side in applyDomusPortDistribution', () => {
      // With portPlan overriding side N→S, the distribution pass should
      // land pts[0] on A's N side (y=rs.top=-5) and pts[n-1] on B's S
      // side (y=rt.bottom=15). Without portPlan, it would land on
      // A.E/B.W (positional heuristic), so this assertion distinguishes
      // the two paths.
      const A: Node = { id: 'A', isGroup: false, x: 0, y: 0, width: 10, height: 10 };
      const B: Node = { id: 'B', isGroup: false, x: 100, y: 10, width: 10, height: 10 };
      const edges = [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 0, y: 0 },
            { x: 0, y: -50 },
            { x: 100, y: -50 },
            { x: 100, y: 10 },
          ],
        },
      ];
      const data = { nodes: [A, B], edges } as unknown as LayoutData;
      const nodesById = new Map<string, Node>([
        ['A', A],
        ['B', B],
      ]);
      const portPlan = new Map([['e1', { startSide: 'N' as const, endSide: 'S' as const }]]);

      applyDomusPortDistribution(data, nodesById, portPlan);

      const first = edges[0].points[0];
      const last = edges[0].points[edges[0].points.length - 1];
      // A.top = 0 - 5 = -5; N-side at t=0.5 → (A.cx, A.top) = (0, -5).
      expect(first.y).toBeCloseTo(-5);
      // B.bottom = 10 + 5 = 15; S-side at t=0.5 → (B.cx, B.bottom) = (100, 15).
      expect(last.y).toBeCloseTo(15);
    });
  });
});
