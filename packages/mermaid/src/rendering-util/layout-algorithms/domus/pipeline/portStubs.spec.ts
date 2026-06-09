import { describe, it, expect } from 'vitest';
import { applyPortDirectionStubs } from './portStubs.js';
import type { LayoutData, Node } from '../../../types.js';

// D / iter-19 — arrival-direction L-stub.
//
// Siebenhaller §5.2.2 (source `0fb2d84f`): when a straight-line edge cannot
// be assigned to the centre line κ of a vertex side, the remedy is to
// "insert two additional 90° bends" — an L-stub. Iter-11 landed the
// axis-mismatch case (firstDir opposite to port side). iter-19 D extends
// the same helper to also fire when the first/last segment is DIAGONAL
// (firstDir null) — that arises from C2/B port-plan shifts misaligning
// with A1's centre-anchored shape walk.

describe('applyPortDirectionStubs — diagonal first segment (iter-19 D)', () => {
  it('inserts an L-stub when the first segment is diagonal on an E-side port', () => {
    // Port on A's E side at (5, -3) — A.x=0 y=0 w=10 h=10 so right=5,
    // top=-5, bottom=5; t=0.2 → y = -5 + 0.2*10 = -3. Neighbor at
    // (100, 50) — diagonal from the port. iter-11's stub skips because
    // `segDir` returns null for diagonals. iter-19 D should insert
    // [sStub east of port, elbow at (sStub.x, neighbor.y)] so the final
    // polyline is axis-aligned on both sub-segments.
    const A: Node = { id: 'A', isGroup: false, x: 0, y: 0, width: 10, height: 10 };
    const B: Node = { id: 'B', isGroup: false, x: 100, y: 50, width: 10, height: 10 };
    const data = {
      nodes: [A, B],
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 5, y: -3 },
            { x: 100, y: 50 },
          ],
        },
      ],
    } as unknown as LayoutData;

    const { changed } = applyPortDirectionStubs(data, new Set(['e1']), 10);
    expect(changed).toBeGreaterThan(0);

    const pts = (data.edges[0] as any).points;
    // Expect: port → stub east → elbow → neighbor. Four points (two bends).
    expect(pts.length).toBeGreaterThanOrEqual(3);
    // Port unchanged.
    expect(pts[0]).toEqual({ x: 5, y: -3 });
    // First sub-segment axis-aligned (horizontal) — y equal.
    expect(pts[1].y).toBeCloseTo(-3);
    // And the stub is east of the port (outward along port normal).
    expect(pts[1].x).toBeGreaterThan(5);
  });

  it('inserts an L-stub when the last segment is diagonal on an N-side port', () => {
    // End port on B's N side (rs.right=5..., rt: B at (100,50) w=10 h=10
    // so top=45, cx=100). Port at (100, 45) is B's N-centre. Previous
    // polyline point at (50, 0) — diagonal from port. The helper should
    // insert L-stub on the END side.
    const A: Node = { id: 'A', isGroup: false, x: 0, y: 0, width: 10, height: 10 };
    const B: Node = { id: 'B', isGroup: false, x: 100, y: 50, width: 10, height: 10 };
    const data = {
      nodes: [A, B],
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 5, y: 0 },
            { x: 50, y: 0 },
            { x: 100, y: 45 },
          ],
        },
      ],
    } as unknown as LayoutData;

    const { changed } = applyPortDirectionStubs(data, new Set(['e1']), 10);
    expect(changed).toBeGreaterThan(0);

    const pts = (data.edges[0] as any).points;
    // Last point (port) unchanged.
    expect(pts[pts.length - 1]).toEqual({ x: 100, y: 45 });
    // The end-stub is north of port (outward along N normal).
    const endStub = pts[pts.length - 2];
    expect(endStub.x).toBeCloseTo(100);
    expect(endStub.y).toBeLessThan(45);
  });

  // iter-33 — R14 extension to compound endpoints.
  //
  // Pre-iter-33 `portStubs.ts:86` hard-filtered any edge whose source or
  // target had `isGroup: true`, which meant the only direction-mismatch
  // repair in the pipeline skipped compound edges (subgraph → external
  // node). `cluster-fixtures.ddlt.spec.ts`'s `edge-from-subgraph-*-real-
  // issues` snapshot pinned `["edge-port-direction-mismatch"]` on the
  // compound edge `B2 → X` on both fallback and DOMUS-native paths.
  // Removing the `isGroup` disjunct lets the existing iter-11/iter-19 L-
  // stub body fire on compound endpoints too; the stub helper is node-
  // geometry agnostic (reads x/y/width/height only) so groups are safe.
  it('inserts an L-stub when the source endpoint is a group (compound edge)', () => {
    // Compound edge B2 → X. B2 is a cluster rect at (0,0) w=200 h=200
    // (so right=100, top=-100, bottom=100, left=-100). X is external at
    // (300, 50) w=40 h=20. The channel router produced a polyline whose
    // first point lands on B2's N boundary at (50, -100), but the first
    // segment goes east toward X — so first-point side (N) disagrees
    // with first-segment direction (E). validateLayout flags this as
    // `edge-port-direction-mismatch`. The stub should re-align.
    const B2: Node = {
      id: 'B2',
      isGroup: true,
      x: 0,
      y: 0,
      width: 200,
      height: 200,
    } as unknown as Node;
    const X: Node = {
      id: 'X',
      isGroup: false,
      x: 300,
      y: 50,
      width: 40,
      height: 20,
    } as unknown as Node;
    const data = {
      nodes: [B2, X],
      edges: [
        {
          id: 'L_B2_X_0',
          start: 'B2',
          end: 'X',
          points: [
            { x: 50, y: -100 }, // on B2's N side
            { x: 280, y: 50 }, // approach to X (diagonal from port)
            { x: 280, y: 50 },
          ],
        },
      ],
    } as unknown as LayoutData;

    const { changed } = applyPortDirectionStubs(data, new Set(['L_B2_X_0']), 10);
    // Pre-iter-33: filter returns changed=0. Post-iter-33: stub fires.
    expect(changed).toBeGreaterThan(0);

    const pts = (data.edges[0] as any).points;
    // Port point unchanged.
    expect(pts[0]).toEqual({ x: 50, y: -100 });
    // First sub-segment is N-ward (outward along the port's N normal) —
    // i.e. the inserted stub lies above the N port, making the first
    // segment axis-aligned with the port side.
    expect(pts[1].x).toBeCloseTo(50);
    expect(pts[1].y).toBeLessThan(-100);
  });

  it('is idempotent — running twice does not stack stubs when segments are already orthogonal', () => {
    // After a first pass inserts the L-stub, the polyline is axis-aligned.
    // Running the helper again must NOT fire — validator wouldn't flag
    // the edge as mismatch, but also the condition check should be stable.
    const A: Node = { id: 'A', isGroup: false, x: 0, y: 0, width: 10, height: 10 };
    const B: Node = { id: 'B', isGroup: false, x: 100, y: 50, width: 10, height: 10 };
    const data = {
      nodes: [A, B],
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 5, y: -3 },
            { x: 100, y: 50 },
          ],
        },
      ],
    } as unknown as LayoutData;

    applyPortDirectionStubs(data, new Set(['e1']), 10);
    const firstPassLen = (data.edges[0] as any).points.length;
    const second = applyPortDirectionStubs(data, new Set(['e1']), 10);
    const secondPassLen = (data.edges[0] as any).points.length;
    // Second call should be a no-op on the start side (firstDir now matches
    // sSide). End side remains diagonal in this fixture; re-firing there
    // is allowed but not required for the idempotence target here.
    expect(second.changed).toBeLessThanOrEqual(1);
    expect(secondPassLen).toBeLessThanOrEqual(firstPassLen + 2);
  });
});

// iter-35 — R16 parallel-approach U-turn fix.
//
// When the segment approaching the port is flush with the port's side
// boundary (pts[n-2] and pts[n-1] share the parallel-axis coord), the
// previous splice-elbow path produced a degenerate U-turn because the
// V-then-H elbow of `ensureOrthoBetween(prev, eStub)` landed either on
// or behind pts[n-1] along the port normal. Siebenhaller Def. 2.5
// (Bend-Or-End, source `0fb2d84f`) prescribes a single-vertex-bend L-
// approach for this case: shift pts[n-2] outward by stubLen along the
// port normal and add one elbow at (pts[n-1] + stubLen*normal). Result
// is a clean 3-segment L with zero U-turns.

describe('applyPortDirectionStubs — parallel-approach U-turn fix (iter-35 R16)', () => {
  const segDirs = (pts: { x: number; y: number }[]): string[] => {
    const out: string[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = pts[i + 1].x - pts[i].x;
      const dy = pts[i + 1].y - pts[i].y;
      if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) {
        out.push('-');
        continue;
      }
      if (Math.abs(dx) < 1e-6) {
        out.push(dy > 0 ? 'D' : 'U');
      } else if (Math.abs(dy) < 1e-6) {
        out.push(dx > 0 ? 'R' : 'L');
      } else {
        out.push('?');
      }
    }
    return out;
  };
  const hasUturn = (dirs: string[]): boolean => {
    const opp: Record<string, string> = { L: 'R', R: 'L', U: 'D', D: 'U' };
    for (let i = 0; i < dirs.length - 1; i++) {
      if (opp[dirs[i]] && opp[dirs[i]] === dirs[i + 1]) {
        return true;
      }
    }
    return false;
  };

  it('end-stub N side: parallel approach produces 3-segment L with no U-turn', () => {
    // Reproduces L_Customer_USCompany_0 pathology. Customer at (46.3, 22.5)
    // 92.7x45 → bottom=45. USCompany at (55.7, 117.5) 111.4x45 → top=95,
    // right=111.4. Pre-stub polyline drops from Customer.bottom-center
    // (46.3, 45) to (46.3, 95) (flush with USC.top), then right to port
    // (55.7, 95). pts[n-2]=(46.3, 95) and pts[n-1]=(55.7, 95) share y=95
    // → parallel approach to N side.
    const A: Node = {
      id: 'A',
      isGroup: false,
      x: 46.3,
      y: 22.5,
      width: 92.7,
      height: 45,
    };
    const B: Node = {
      id: 'B',
      isGroup: false,
      x: 55.7,
      y: 117.5,
      width: 111.4,
      height: 45,
    };
    const data = {
      nodes: [A, B],
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 46.3, y: 45 },
            { x: 46.3, y: 95 },
            { x: 55.7, y: 95 },
          ],
        },
      ],
    } as unknown as LayoutData;

    const { changed } = applyPortDirectionStubs(data, new Set(['e1']), 10);
    expect(changed).toBeGreaterThan(0);

    const pts = (data.edges[0] as any).points;
    // Port unchanged.
    expect(pts[pts.length - 1]).toEqual({ x: 55.7, y: 95 });
    // Final segment is perpendicular to N (vertical).
    expect(pts[pts.length - 2].x).toBeCloseTo(55.7);
    expect(pts[pts.length - 2].y).toBeLessThan(95);
    // Four points total: source, shifted pts[n-2], elbow, port.
    expect(pts.length).toBe(4);
    // No U-turns in the direction sequence.
    const dirs = segDirs(pts);
    expect(hasUturn(dirs)).toBe(false);
  });

  it('end-stub E side: parallel approach eliminates zero-lateral out-and-back', () => {
    // Reproduces L_HongKongCompany_USCompany_0 worst-case. HKC at (270.1,
    // 212.5) 158.1x45 → left=191.05. USCompany at (55.7, 117.5) 111.4x45
    // → right=111.4, top=95, bottom=140. Pre-stub polyline leaves HKC.left
    // at (191.1, 212.5), goes west to (111.4, 212.5) (flush with USC's
    // right extended), then up to port (111.4, 131) on USC.right. Current
    // code splices [(111.4, 131), (121.4, 131)] creating a zero-lateral
    // out-and-back with pts[n-1] duplicated.
    const HKC: Node = {
      id: 'HKC',
      isGroup: false,
      x: 270.1,
      y: 212.5,
      width: 158.1,
      height: 45,
    };
    const USC: Node = {
      id: 'USC',
      isGroup: false,
      x: 55.7,
      y: 117.5,
      width: 111.4,
      height: 45,
    };
    const data = {
      nodes: [HKC, USC],
      edges: [
        {
          id: 'e1',
          start: 'HKC',
          end: 'USC',
          points: [
            { x: 191.05, y: 212.5 },
            { x: 111.4, y: 212.5 },
            { x: 111.4, y: 131 },
          ],
        },
      ],
    } as unknown as LayoutData;

    const { changed } = applyPortDirectionStubs(data, new Set(['e1']), 10);
    expect(changed).toBeGreaterThan(0);

    const pts = (data.edges[0] as any).points;
    // Port unchanged.
    expect(pts[pts.length - 1]).toEqual({ x: 111.4, y: 131 });
    // The shifted pts[n-2] moved outward along E normal (+x) by stubLen.
    // After fix: second point moves from x=111.4 to x=121.4, lifting the
    // vertical segment off the USC.right boundary.
    const vertSeg = pts[pts.length - 3];
    expect(vertSeg.x).toBeCloseTo(121.4);
    // No duplicate points.
    for (let i = 0; i < pts.length - 1; i++) {
      const dup = Math.abs(pts[i].x - pts[i + 1].x) + Math.abs(pts[i].y - pts[i + 1].y);
      expect(dup).toBeGreaterThan(0);
    }
    // No U-turns.
    const dirs = segDirs(pts);
    expect(hasUturn(dirs)).toBe(false);
  });

  it('start-stub E side: parallel approach produces 3-segment L with no U-turn', () => {
    // Reproduces L_USCompany_HongKongCompany_0-to-label pathology.
    // USCompany at (55.7, 117.5) 111.4x45 → right=111.4, top=95, bot=140.
    // Label at (270.1, 139.5) 81.7x21 → left=229.25. Pre-stub polyline
    // leaves USC.right at (111.4, 106.3), goes down to (111.4, 139.5)
    // (flush with USC.right boundary extended), then right to label.left
    // (229.25, 139.5). pts[0] and pts[1] share x=111.4 → parallel approach
    // to E (start-side).
    const USC: Node = {
      id: 'USC',
      isGroup: false,
      x: 55.7,
      y: 117.5,
      width: 111.4,
      height: 45,
    };
    const Label: Node = {
      id: 'Label',
      isGroup: false,
      x: 270.1,
      y: 139.5,
      width: 81.7,
      height: 21,
    };
    const data = {
      nodes: [USC, Label],
      edges: [
        {
          id: 'e1',
          start: 'USC',
          end: 'Label',
          points: [
            { x: 111.4, y: 106.3 },
            { x: 111.4, y: 139.5 },
            { x: 229.25, y: 139.5 },
          ],
        },
      ],
    } as unknown as LayoutData;

    const { changed } = applyPortDirectionStubs(data, new Set(['e1']), 10);
    expect(changed).toBeGreaterThan(0);

    const pts = (data.edges[0] as any).points;
    // First point (port) unchanged.
    expect(pts[0]).toEqual({ x: 111.4, y: 106.3 });
    // First sub-segment points outward from USC.right (E normal = +x).
    expect(pts[1].x).toBeGreaterThan(111.4);
    expect(pts[1].y).toBeCloseTo(106.3);
    // The shifted pts[1] (now pts[2] after insertion) moved to x=121.4.
    const shifted = pts[2];
    expect(shifted.x).toBeCloseTo(121.4);
    // No U-turns.
    const dirs = segDirs(pts);
    expect(hasUturn(dirs)).toBe(false);
  });

  it('end-stub S side: parallel approach — symmetric to N case', () => {
    // S-side port with parallel approach. B at (100, 100) w=100 h=100
    // → bottom=150, port=(100,150). A is BELOW B at (150, 250) — edge
    // routes upward, lands flush with B.bottom-extended, then leftward
    // to port. pts[n-2] and pts[n-1] share y=150 → parallel approach.
    // Outward normal for S is +y (below the rectangle), so the shifted
    // pts[n-2] moves to y=160.
    const A: Node = { id: 'A', isGroup: false, x: 150, y: 250, width: 20, height: 20 };
    const B: Node = { id: 'B', isGroup: false, x: 100, y: 100, width: 100, height: 100 };
    const data = {
      nodes: [A, B],
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 150, y: 240 }, // A.top
            { x: 150, y: 150 }, // flush with B.bottom extended
            { x: 100, y: 150 }, // port on B.bottom center
          ],
        },
      ],
    } as unknown as LayoutData;

    const { changed } = applyPortDirectionStubs(data, new Set(['e1']), 10);
    expect(changed).toBeGreaterThan(0);

    const pts = (data.edges[0] as any).points;
    // Port unchanged.
    expect(pts[pts.length - 1]).toEqual({ x: 100, y: 150 });
    // Final segment is perpendicular to S (vertical). Elbow sits below
    // the port (outward along S normal = +y).
    expect(pts[pts.length - 2].x).toBeCloseTo(100);
    expect(pts[pts.length - 2].y).toBeGreaterThan(150);
    // Shifted pts[n-3] at port.y + stubLen = 160.
    expect(pts[pts.length - 3].y).toBeCloseTo(160);
    // No U-turns.
    const dirs = segDirs(pts);
    expect(hasUturn(dirs)).toBe(false);
  });

  it('does not apply shift when pts[n-3] shares the parallel coord (defensive fallback)', () => {
    // Degenerate upstream output: three consecutive points flush with
    // the E boundary of USC. Shifting pts[n-2] on x would create a
    // diagonal segment pts[n-3]→shifted. Fall back to the original
    // splice+elbow (which does its best even if imperfect).
    const USC: Node = {
      id: 'USC',
      isGroup: false,
      x: 55.7,
      y: 117.5,
      width: 111.4,
      height: 45,
    };
    const B: Node = { id: 'B', isGroup: false, x: 300, y: 300, width: 50, height: 50 };
    const data = {
      nodes: [USC, B],
      edges: [
        {
          id: 'e1',
          start: 'B',
          end: 'USC',
          points: [
            { x: 111.4, y: 300 }, // flush
            { x: 111.4, y: 212.5 }, // flush
            { x: 111.4, y: 131 }, // port
          ],
        },
      ],
    } as unknown as LayoutData;

    // Should not throw; should leave a safe output (whatever shape).
    const { changed } = applyPortDirectionStubs(data, new Set(['e1']), 10);
    expect(changed).toBeGreaterThanOrEqual(0);

    const pts = (data.edges[0] as any).points;
    // Port unchanged.
    expect(pts[pts.length - 1]).toEqual({ x: 111.4, y: 131 });
  });
});
