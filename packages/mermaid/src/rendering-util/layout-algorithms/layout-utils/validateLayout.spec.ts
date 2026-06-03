import { describe, it, expect } from 'vitest';
import type { LayoutData, Node, Edge } from '../../types.js';
import { validateLayout } from './validateLayout.js';

interface Point {
  x: number;
  y: number;
}

function mkNode(id: string, x: number, y: number, width = 40, height = 40): Node {
  return { id, x, y, width, height, isGroup: false } as any;
}

function mkEdge(
  id: string,
  start: string | undefined,
  end: string | undefined,
  points: Point[]
): Edge {
  return { id, start, end, type: 'arrow', points } as any;
}

function getIssueTypes(layout: LayoutData): string[] {
  const res = validateLayout(layout);
  return res.issues.map((i) => i.type);
}

describe('validateLayout scoring (DDLT unified, 0–1000 fixed cap)', () => {
  it('returns 1000 for a clean tiny graph (no penalties)', () => {
    // Two nodes, one straight 2-point edge: 0 bends, 0 crossings.
    const a = mkNode('A', 0, 0);
    const b = mkNode('B', 100, 0);
    const e = mkEdge('e', 'A', 'B', [
      { x: a.x! + 20, y: a.y! },
      { x: b.x! - 20, y: b.y! },
    ]);
    const layout: LayoutData = { nodes: [a, b], edges: [e], config: {} as any };

    const res = validateLayout(layout);
    expect(res.ok).toBe(true);
    expect(res.score).toBe(1000);
    expect(res.breakdown).toBeDefined();
    expect(res.breakdown.crossings).toBe(0);
    expect(res.breakdown.crossingPenalty).toBe(0);
    expect(res.breakdown.totalBendPenalty).toBe(0);
    expect(res.breakdown.pointsHistogram['2']).toBe(1);
  });

  it('returns 0 when the layout is invalid', () => {
    // Node S at (-100, 0), T at (100, 0), obstacle O directly between them.
    // The edge cuts through O's interior — `edge-intersects-obstacle` fires.
    const s = mkNode('S', -100, 0);
    const t = mkNode('T', 100, 0);
    const o = mkNode('O', 0, 0, 40, 40);
    const e = mkEdge('e', 'S', 'T', [
      { x: s.x! + 20, y: 0 },
      { x: t.x! - 20, y: 0 },
    ]);
    const layout: LayoutData = { nodes: [s, t, o], edges: [e], config: {} as any };

    const res = validateLayout(layout);
    expect(res.ok).toBe(false);
    expect(res.score).toBe(0);
  });

  it('charges 0 for ≤3-point edges, increasing penalty for 4 / 5 / 6 / 7 points', () => {
    function makeLayoutWithEdgePoints(n: number): LayoutData {
      // Pure-edges layout (no nodes) to isolate the bend-penalty curve from
      // node/obstacle checks. Edge `start`/`end` are undefined so endpoint
      // checks are skipped.
      // Build an orthogonal polyline alternating H/V with `n` points.
      const points: Point[] = [];
      let x = 0;
      let y = 0;
      points.push({ x, y });
      for (let i = 0; i < n - 1; i++) {
        if (i % 2 === 0) {
          x += 50;
        } else {
          y += 50;
        }
        points.push({ x, y });
      }
      const e = mkEdge('e', undefined, undefined, points);
      return { nodes: [], edges: [e], config: {} as any };
    }

    const r2 = validateLayout(makeLayoutWithEdgePoints(2));
    const r3 = validateLayout(makeLayoutWithEdgePoints(3));
    const r4 = validateLayout(makeLayoutWithEdgePoints(4));
    const r5 = validateLayout(makeLayoutWithEdgePoints(5));
    const r6 = validateLayout(makeLayoutWithEdgePoints(6));
    const r7 = validateLayout(makeLayoutWithEdgePoints(7));
    const r8 = validateLayout(makeLayoutWithEdgePoints(8));

    // ≤3 points are free.
    expect(r2.breakdown.totalBendPenalty).toBe(0);
    expect(r3.breakdown.totalBendPenalty).toBe(0);

    // Strictly increasing past 3 points.
    expect(r4.breakdown.totalBendPenalty).toBeGreaterThan(0);
    expect(r5.breakdown.totalBendPenalty).toBeGreaterThan(r4.breakdown.totalBendPenalty);
    expect(r6.breakdown.totalBendPenalty).toBeGreaterThan(r5.breakdown.totalBendPenalty);
    expect(r7.breakdown.totalBendPenalty).toBeGreaterThan(r6.breakdown.totalBendPenalty);
    expect(r8.breakdown.totalBendPenalty).toBeGreaterThan(r7.breakdown.totalBendPenalty);

    // Exponential growth past 6 points: the marginal jump from 6→7 is bigger
    // than the marginal jump from 5→6 (and 7→8 is bigger than 6→7).
    const j5to6 = r6.breakdown.totalBendPenalty - r5.breakdown.totalBendPenalty;
    const j6to7 = r7.breakdown.totalBendPenalty - r6.breakdown.totalBendPenalty;
    const j7to8 = r8.breakdown.totalBendPenalty - r7.breakdown.totalBendPenalty;
    expect(j6to7).toBeGreaterThan(j5to6);
    expect(j7to8).toBeGreaterThan(j6to7);
  });

  it('charges crossings less than a single 4-point edge bend', () => {
    // One crossing (two perpendicular straight edges meeting at the origin).
    const e1 = mkEdge('e1', undefined, undefined, [
      { x: -50, y: 0 },
      { x: 50, y: 0 },
    ]);
    const e2 = mkEdge('e2', undefined, undefined, [
      { x: 0, y: -50 },
      { x: 0, y: 50 },
    ]);
    const crossingLayout: LayoutData = { nodes: [], edges: [e1, e2], config: {} as any };
    const crossing = validateLayout(crossingLayout);
    expect(crossing.breakdown.crossings).toBe(1);

    // A clean 4-point-edge layout has no crossings but one bend-tier-4 edge.
    const e4 = mkEdge('e', undefined, undefined, [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 },
      { x: 100, y: 50 },
    ]);
    const fourPt: LayoutData = { nodes: [], edges: [e4], config: {} as any };
    const four = validateLayout(fourPt);
    expect(four.breakdown.totalBendPenalty).toBeGreaterThan(0);

    expect(crossing.breakdown.crossingPenalty).toBeLessThan(four.breakdown.totalBendPenalty);
  });

  it('breakdown.edges entries are sorted descending by per-edge bendPenalty', () => {
    const eShort = mkEdge('eShort', undefined, undefined, [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 },
      { x: 100, y: 50 },
    ]); // 4 pts (small penalty)
    const eLong = mkEdge('eLong', undefined, undefined, [
      { x: 0, y: 200 },
      { x: 50, y: 200 },
      { x: 50, y: 250 },
      { x: 100, y: 250 },
      { x: 100, y: 300 },
      { x: 150, y: 300 },
      { x: 150, y: 350 },
      { x: 200, y: 350 },
    ]); // 8 pts (big penalty)
    const layout: LayoutData = { nodes: [], edges: [eShort, eLong], config: {} as any };

    const res = validateLayout(layout);
    expect(res.breakdown.edges.length).toBe(2);
    expect(res.breakdown.edges[0].bendPenalty).toBeGreaterThanOrEqual(
      res.breakdown.edges[1].bendPenalty
    );
    expect(res.breakdown.edges[0].id).toBe('eLong');
  });
});

describe('validateLayout new hard-validation rules', () => {
  it('flags edge-bend-near-endpoint when the LAST segment is shorter than 10', () => {
    // Use node-free edges so only the new rule fires.
    const e = mkEdge('e', undefined, undefined, [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 105, y: 50 }, // final segment length = 5 (<10)
    ]);
    const layout: LayoutData = { nodes: [], edges: [e], config: {} as any };

    const types = getIssueTypes(layout);
    expect(types).toContain('edge-bend-near-endpoint');
  });

  it('flags edge-bend-near-endpoint for a too-short FIRST segment', () => {
    const e = mkEdge('e', undefined, undefined, [
      { x: 0, y: 0 },
      { x: 5, y: 0 }, // first segment length = 5 (<10)
      { x: 5, y: 50 },
      { x: 100, y: 50 },
    ]);
    const layout: LayoutData = { nodes: [], edges: [e], config: {} as any };

    const types = getIssueTypes(layout);
    expect(types).toContain('edge-bend-near-endpoint');
  });

  it('does NOT flag edge-bend-near-endpoint for 2-point straight edges (no bend)', () => {
    // Even when the entire edge is short (<10), a straight 2-point edge has
    // no bend, so the rule is exempt.
    const e = mkEdge('e', undefined, undefined, [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
    ]);
    const layout: LayoutData = { nodes: [], edges: [e], config: {} as any };

    const types = getIssueTypes(layout);
    expect(types).not.toContain('edge-bend-near-endpoint');
  });

  it('does NOT flag edge-bend-near-endpoint when both first and last segments are ≥10', () => {
    const e = mkEdge('e', undefined, undefined, [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 },
      { x: 100, y: 50 },
    ]);
    const layout: LayoutData = { nodes: [], edges: [e], config: {} as any };

    const types = getIssueTypes(layout);
    expect(types).not.toContain('edge-bend-near-endpoint');
  });

  it('flags edge-bend-near-endpoint when a parallel band sits close to the target side', () => {
    // Mirrors the Company-simp `USCompany --> HongKongCompany` shape after
    // endpoint-stub expansion: the final W-side approach is 20px long, but
    // the previous vertical rail sits only 20px from HongKongCompany.left and
    // overlaps the target's vertical span. Visually this is still a near-end
    // bend/band and should not pass Level 1 validation.
    const usc = mkNode('USCompany', 323.87109375, 220, 111.3671875, 45);
    const hkc = mkNode('HongKongCompany', 323.87109375, 135, 158.0859375, 45);
    const e = mkEdge('L_USCompany_HongKongCompany_0', 'USCompany', 'HongKongCompany', [
      { x: 268.1875, y: 220 },
      { x: 228.1875, y: 220 },
      { x: 228.1875, y: 148.5 },
      { x: 244.828125, y: 148.5 },
    ]);
    const layout: LayoutData = { nodes: [usc, hkc], edges: [e], config: {} as any };

    const types = getIssueTypes(layout);
    expect(types).toContain('edge-bend-near-endpoint');
  });

  it('does NOT flag edge-bend-near-endpoint for a parallel band with full 20px clearance', () => {
    const source = mkNode('Source', 0, 0, 40, 40);
    const target = mkNode('Target', 100, 0, 40, 40);
    const e = mkEdge('e', 'Source', 'Target', [
      { x: 20, y: 0 },
      { x: 60, y: 0 },
      { x: 60, y: 10 },
      { x: 80, y: 10 },
    ]);
    const layout: LayoutData = { nodes: [source, target], edges: [e], config: {} as any };

    const types = getIssueTypes(layout);
    expect(types).not.toContain('edge-bend-near-endpoint');
  });

  it('does NOT flag edge-bend-near-endpoint for start-side parallel bands', () => {
    const source = mkNode('Source', 0, 0, 40, 40);
    const target = mkNode('Target', 100, 0, 40, 40);
    const e = mkEdge('e', 'Source', 'Target', [
      { x: 20, y: 0 },
      { x: 35, y: 0 },
      { x: 35, y: 30 },
      { x: 80, y: 30 },
    ]);
    const layout: LayoutData = { nodes: [source, target], edges: [e], config: {} as any };

    const types = getIssueTypes(layout);
    expect(types).not.toContain('edge-bend-near-endpoint');
  });

  it('flags edge-shared-attachment-point when two edges share an attach point on a node (any direction)', () => {
    // Same-port-departure today only fires when outward directions match.
    // Here e1 leaves N going EAST and e2 ENTERS N at the same boundary point
    // coming FROM east — same attachment point but different roles.
    const n = mkNode('N', 0, 0, 40, 40);
    const a = mkNode('A', 100, 0, 40, 40);
    const b = mkNode('B', 200, 0, 40, 40);
    const e1 = mkEdge('e1', 'N', 'A', [
      { x: 20, y: 0 }, // N's right side
      { x: 80, y: 0 }, // A's left side
    ]);
    const e2 = mkEdge('e2', 'B', 'N', [
      { x: 180, y: 0 }, // B's left side
      { x: 20, y: 0 }, // N's right side — same point as e1's start
    ]);
    const layout: LayoutData = { nodes: [n, a, b], edges: [e1, e2], config: {} as any };

    const types = getIssueTypes(layout);
    expect(types).toContain('edge-shared-attachment-point');
  });

  it('does NOT flag edge-shared-attachment-point for distinct ports on the same node', () => {
    const n = mkNode('N', 0, 0, 40, 40);
    const a = mkNode('A', 100, 0, 40, 40);
    const b = mkNode('B', 0, 100, 40, 40);
    // e1 leaves N at right (20, 0). e2 leaves N at south (0, 20). Different ports.
    const e1 = mkEdge('e1', 'N', 'A', [
      { x: 20, y: 0 },
      { x: 80, y: 0 },
    ]);
    const e2 = mkEdge('e2', 'N', 'B', [
      { x: 0, y: 20 },
      { x: 0, y: 80 },
    ]);
    const layout: LayoutData = { nodes: [n, a, b], edges: [e1, e2], config: {} as any };

    const types = getIssueTypes(layout);
    expect(types).not.toContain('edge-shared-attachment-point');
  });

  it('flags edge-shared-projected-port when a detached out-edge stub projects to an in-edge port', () => {
    // The intake-review-complete decision-diamond defect in miniature: an
    // in-edge attaches on N's right boundary, and an out-edge is nudged 20px
    // OFF the node (a detached stub) at the same height to dodge the raw
    // `edge-shared-attachment-point` check — yet both resolve to the same
    // right-side port once projected back onto N.
    const n = mkNode('N', 0, 0, 40, 40); // rect [-20,20] x [-20,20]
    const a = mkNode('A', 100, 0, 40, 40);
    const b = mkNode('B', 40, -100, 40, 40);
    const eIn = mkEdge('eIn', 'A', 'N', [
      { x: 80, y: 0 }, // A's left side
      { x: 20, y: 0 }, // N's right side — on the boundary
    ]);
    const eOut = mkEdge('eOut', 'N', 'B', [
      { x: 40, y: 0 }, // 20px RIGHT of N's right side — detached stub, same y as eIn
      { x: 40, y: -60 },
    ]);
    const layout: LayoutData = { nodes: [n, a, b], edges: [eIn, eOut], config: {} as any };

    const types = getIssueTypes(layout);
    // Raw points are 20px apart, so the existing point check stays silent…
    expect(types).not.toContain('edge-shared-attachment-point');
    // …but both project onto N's right side at (20,0): the port is shared.
    expect(types).toContain('edge-shared-projected-port');
  });

  it('does NOT flag edge-shared-projected-port when a detached stub projects to a distinct port', () => {
    const n = mkNode('N', 0, 0, 40, 40); // rect [-20,20] x [-20,20]
    const a = mkNode('A', 100, 0, 40, 40);
    const b = mkNode('B', 0, 100, 40, 40);
    const eIn = mkEdge('eIn', 'A', 'N', [
      { x: 80, y: 0 }, // A's left side
      { x: 20, y: 0 }, // N's right side
    ]);
    const eOut = mkEdge('eOut', 'N', 'B', [
      { x: 0, y: 40 }, // 20px BELOW N's bottom — detached stub projecting to bottom-center
      { x: 0, y: 80 },
    ]);
    const layout: LayoutData = { nodes: [n, a, b], edges: [eIn, eOut], config: {} as any };

    const types = getIssueTypes(layout);
    // eIn projects to (20,0) right side; eOut projects to (0,20) bottom side — distinct.
    expect(types).not.toContain('edge-shared-projected-port');
  });
});

describe('validateLayout new geometric issues', () => {
  it('flags edge-intersects-obstacle when an edge passes through a leaf node interior', () => {
    const s = mkNode('S', -100, 0);
    const t = mkNode('T', 100, 0);
    const o = mkNode('O', 0, 0, 40, 40);
    const e = mkEdge('e', 'S', 'T', [
      { x: s.x!, y: s.y! },
      { x: t.x!, y: t.y! },
    ]);
    const layout: LayoutData = { nodes: [s, t, o], edges: [e], config: {} as any };

    const res = validateLayout(layout);
    expect(res.ok).toBe(false);
    expect(getIssueTypes(layout)).toContain('edge-intersects-obstacle');
  });

  it('flags edge-intersects-obstacle when an edge loops back through its OWN src node interior', () => {
    // User-reported case (real SVG from a swimlane fixture): the D→H edge
    // exits D's right-top at (96.45, 97.5), extends 20u east, drops 20u
    // down to D's center y=117.5, then runs WEST through D's interior
    // from (116.45, 117.5) to (65.39, 117.5), re-entering D at its right
    // boundary and crossing through to a point 11u inside D (D's left is
    // 54.33 and right is 96.45). The final segment then drops vertically
    // from (65.39, 117.5) to (65.39, 190), passing through D's bottom.
    //
    // Before this check was tightened, validateLayout blanket-skipped the
    // edge's own src/dst nodes from `edge-intersects-obstacle`, so this
    // clearly-invalid loop-back went unflagged.
    const d = mkNode('D', 75.38671875, 117.5, 42.1171875, 45);
    const h = mkNode('H', 65.38671875, 212.5, 42.1171875, 45);
    const e = mkEdge('L_D_H_0', 'D', 'H', [
      { x: 96.4453125, y: 97.5 },
      { x: 116.4453125, y: 97.5 },
      { x: 116.4453125, y: 117.5 },
      { x: 65.38671875, y: 117.5 },
      { x: 65.38671875, y: 190 },
    ]);
    const layout: LayoutData = { nodes: [d, h], edges: [e], config: {} as any };

    const res = validateLayout(layout);
    expect(res.ok).toBe(false);
    const intersectObstacle = res.issues.filter((i) => i.type === 'edge-intersects-obstacle');
    const offendingOnD = intersectObstacle.filter(
      (i) => Array.isArray(i.nodeIds) && i.nodeIds.includes('D')
    );
    expect(offendingOnD.length).toBeGreaterThan(0);
  });

  it('does NOT flag edge-intersects-obstacle for a normal outward first segment', () => {
    // Regression guard: removing the blanket src/dst exclusion should
    // NOT false-positive on the common case where the first segment is
    // an anchor extension going straight out from the src node's side
    // center. Here the edge exits A's right edge at (20, 0), extends 20u
    // east to the anchor (40, 0), then crosses to B's left edge at
    // (80, 0). The first segment touches A's boundary at one point but
    // never enters A's interior.
    const a = mkNode('A', 0, 0, 40, 40);
    const b = mkNode('B', 100, 0, 40, 40);
    const e = mkEdge('e', 'A', 'B', [
      { x: 20, y: 0 },
      { x: 40, y: 0 },
      { x: 80, y: 0 },
    ]);
    const layout: LayoutData = { nodes: [a, b], edges: [e], config: {} as any };

    const intersectObstacle = validateLayout(layout).issues.filter(
      (i) => i.type === 'edge-intersects-obstacle'
    );
    expect(intersectObstacle).toEqual([]);
  });

  it('flags edge-same-port-departure when two edges depart very close with same direction', () => {
    const c = mkNode('C', 0, 0, 40, 40);
    const b = mkNode('B', 100, 0, 40, 40);
    const d = mkNode('D', 100, 50, 40, 40);
    const e1 = mkEdge('e1', 'C', 'B', [
      { x: 20, y: 0 },
      { x: 60, y: 0 },
      { x: b.x!, y: b.y! },
    ]);
    const e2 = mkEdge('e2', 'C', 'D', [
      { x: 21, y: 0 },
      { x: 60, y: 0 },
      { x: d.x!, y: d.y! },
    ]);
    const layout: LayoutData = { nodes: [c, b, d], edges: [e1, e2], config: {} as any };

    const types = getIssueTypes(layout);
    expect(types).toContain('edge-same-port-departure');
  });

  it('flags edge-corner-connection when an edge endpoint attaches near a node corner', () => {
    const n = mkNode('N', 0, 0, 40, 40);
    const a = mkNode('A', -60, -20, 40, 40);
    const corner = { x: -20, y: -20 };
    const e = mkEdge('e', 'A', 'N', [{ x: a.x!, y: a.y! }, corner]);
    const layout: LayoutData = { nodes: [n, a], edges: [e], config: {} as any };

    const types = getIssueTypes(layout);
    expect(types).toContain('edge-corner-connection');
  });

  it('flags edge-shared-subpath when two edges share a long collinear segment', () => {
    // Two edges that share a middle segment but have different endpoints
    // Edge 1: goes from (0, 0) down to (0, 10), then right to (100, 10), then up to (100, 0)
    // Edge 2: goes from (10, 50) down to (10, 10), then right to (80, 10), then up to (80, 50)
    // The shared subpath is on y=10 from x=10 to x=80 (length 70 > L_MIN_SHARED=8)
    const e1 = mkEdge('e1', undefined, undefined, [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 100, y: 10 },
      { x: 100, y: 0 },
    ]);
    const e2 = mkEdge('e2', undefined, undefined, [
      { x: 10, y: 50 },
      { x: 10, y: 10 },
      { x: 80, y: 10 },
      { x: 80, y: 50 },
    ]);
    const layout: LayoutData = { nodes: [], edges: [e1, e2], config: {} as any };

    const types = getIssueTypes(layout);
    expect(types).toContain('edge-shared-subpath');
  });

  it('flags edge-border-hugging when an edge runs near a node border for a long distance', () => {
    // Node N is at (0, 0) with size 40x40, so rect is {left: -20, right: 20, top: -20, bottom: 20}
    // Edge runs OUTSIDE the node but very close to the top border (y=-20)
    // Edge at y=-22 (2 units above top border) from x=-30 to x=30 (length 60)
    // This is OUTSIDE the rect but within EPS_BORDER=2 of the top border
    const n = mkNode('N', 0, 0, 40, 40);
    const e = mkEdge('e', undefined, undefined, [
      { x: -30, y: -22 },
      { x: 30, y: -22 },
    ]);
    const layout: LayoutData = { nodes: [n], edges: [e], config: {} as any };

    const types = getIssueTypes(layout);
    expect(types).toContain('edge-border-hugging');
  });

  it('flags edge-border-hugging when an edge hugs the border of its target node (not just intermediate nodes)', () => {
    // Edge goes from source S to target T, but a segment hugs the LEFT border of T
    // Source S at (-100, 0), Target T at (100, 0), T is 60x80 so rect is {left: 70, right: 130, top: -40, bottom: 40}
    // Edge path: S -> goes to x=68 (2 units outside T's left=70), up to y=-60, down to y=20, enters T
    // Vertical segment from (68, -60) to (68, 20) runs alongside T's left border
    // Overlap in Y: segment y range is [-60, 20], T's y range is [-40, 40]
    // Overlap = min(20, 40) - max(-60, -40) = 20 - (-40) = 60 > L_MIN_BORDER=12
    const s = mkNode('S', -100, 0, 40, 40);
    const t = mkNode('T', 100, 0, 60, 80);
    // Simple path: approach, go up, go down alongside T's left border, enter T
    const e = mkEdge('e', 'S', 'T', [
      { x: -80, y: 0 },
      { x: 68, y: 0 },
      { x: 68, y: -60 },
      { x: 68, y: 20 },
      { x: 70, y: 20 },
    ]);
    const layout: LayoutData = { nodes: [s, t], edges: [e], config: {} as any };

    const types = getIssueTypes(layout);
    expect(types).toContain('edge-border-hugging');
  });

  it('flags edge-label-off-edge when a labelled edge polyline does not cross its own label node', () => {
    // Label-as-waypoint model: the labelled edge's polyline must pass
    // through the label node's rectangle. Here the edge runs along y=0 but
    // the label sits at y=200 — the label would visually float below the
    // edge, which is invalid.
    const a = mkNode('A', 0, 0);
    const b = mkNode('B', 200, 0);
    const label: Node = {
      id: 'edge-label-A-B-e1',
      x: 100,
      y: 200,
      width: 30,
      height: 20,
      isGroup: false,
      isEdgeLabel: true,
    } as any;
    const e = {
      id: 'e1',
      start: 'A',
      end: 'B',
      type: 'arrow',
      labelNodeId: 'edge-label-A-B-e1',
      points: [
        { x: a.x! + 20, y: 0 },
        { x: b.x! - 20, y: 0 },
      ],
    } as unknown as Edge;
    const layout: LayoutData = { nodes: [a, b, label], edges: [e], config: {} as any };

    const types = getIssueTypes(layout);
    expect(types).toContain('edge-label-off-edge');
  });

  it('does NOT flag edge-label-off-edge when the polyline threads through the label node', () => {
    const a = mkNode('A', 0, 0);
    const b = mkNode('B', 200, 0);
    const label: Node = {
      id: 'edge-label-A-B-e1',
      x: 100,
      y: 0,
      width: 30,
      height: 20,
      isGroup: false,
      isEdgeLabel: true,
    } as any;
    const e = {
      id: 'e1',
      start: 'A',
      end: 'B',
      type: 'arrow',
      labelNodeId: 'edge-label-A-B-e1',
      points: [
        { x: a.x! + 20, y: 0 },
        { x: 100, y: 0 },
        { x: b.x! - 20, y: 0 },
      ],
    } as unknown as Edge;
    const layout: LayoutData = { nodes: [a, b, label], edges: [e], config: {} as any };

    const types = getIssueTypes(layout);
    expect(types).not.toContain('edge-label-off-edge');
  });

  it('flags edge-endpoint-inside-node when an edge endpoint sits inside a non-endpoint node', () => {
    // Edge from S to T, but its end point lands inside an unrelated obstacle
    // node O rather than on T's boundary.
    const s = mkNode('S', -100, 0);
    const t = mkNode('T', 100, 0);
    const o = mkNode('O', 50, 0, 60, 60);
    const e = mkEdge('e', 'S', 'T', [
      { x: s.x! + 20, y: 0 },
      { x: 50, y: 0 }, // strictly inside O's rect
    ]);
    const layout: LayoutData = { nodes: [s, t, o], edges: [e], config: {} as any };

    const types = getIssueTypes(layout);
    expect(types).toContain('edge-endpoint-inside-node');
  });

  it('flags edge-endpoint-inside-node when an edge endpoint is buried inside its own attached node', () => {
    // Ports must attach AT the boundary, not at the node center.
    const a = mkNode('A', 0, 0);
    const b = mkNode('B', 200, 0);
    const e = mkEdge('e', 'A', 'B', [
      { x: 0, y: 0 }, // A's center — strictly inside A
      { x: b.x! - 20, y: 0 },
    ]);
    const layout: LayoutData = { nodes: [a, b], edges: [e], config: {} as any };

    const types = getIssueTypes(layout);
    expect(types).toContain('edge-endpoint-inside-node');
  });

  it('does NOT flag edge-endpoint-inside-node when endpoints sit on node boundaries', () => {
    const a = mkNode('A', 0, 0);
    const b = mkNode('B', 200, 0);
    const e = mkEdge('e', 'A', 'B', [
      { x: a.x! + 20, y: 0 },
      { x: b.x! - 20, y: 0 },
    ]);
    const layout: LayoutData = { nodes: [a, b], edges: [e], config: {} as any };

    const types = getIssueTypes(layout);
    expect(types).not.toContain('edge-endpoint-inside-node');
  });

  it('flags edge-label-overlaps-foreign-edge when another edge crosses a label node', () => {
    // Edge e1 owns label L. Edge e2 runs horizontally at y=0 and crosses L's rect.
    const a = mkNode('A', -200, 0);
    const b = mkNode('B', 200, 0);
    const c = mkNode('C', -200, 100);
    const d = mkNode('D', 200, 100);
    // L is owned by e1 (via labelNodeId); it sits at (0, 0) so any horizontal
    // edge along y=0 between x=-10 and x=10 will cross its rect.
    const label: Node = {
      id: 'edge-label-C-D-e1',
      x: 0,
      y: 0,
      width: 30,
      height: 20,
      isGroup: false,
      isEdgeLabel: true,
    } as any;
    // e1 (the owning edge) threads through its own label — no issue for e1.
    const e1 = {
      id: 'e1',
      start: 'C',
      end: 'D',
      type: 'arrow',
      labelNodeId: 'edge-label-C-D-e1',
      points: [
        { x: c.x! + 20, y: 100 },
        { x: 0, y: 100 },
        { x: 0, y: 0 }, // through label center
        { x: 0, y: 100 },
        { x: d.x! - 20, y: 100 },
      ],
    } as unknown as Edge;
    // e2 is an unrelated edge running straight through the label's row.
    const e2 = mkEdge('e2', 'A', 'B', [
      { x: a.x! + 20, y: 0 },
      { x: b.x! - 20, y: 0 },
    ]);
    const layout: LayoutData = {
      nodes: [a, b, c, d, label],
      edges: [e1, e2],
      config: {} as any,
    };

    const res = validateLayout(layout);
    const types = res.issues.map((i) => i.type);
    expect(types).toContain('edge-label-overlaps-foreign-edge');
    // The issue must point to e2 (the foreign edge), not e1 (the owner).
    const foreign = res.issues.find((i) => i.type === 'edge-label-overlaps-foreign-edge');
    expect(foreign?.edgeId).toBe('e2');
    expect(foreign?.nodeIds).toEqual(['edge-label-C-D-e1']);
  });

  it('does NOT flag edge-label-overlaps-foreign-edge when the only crossing edge is the label owner', () => {
    const c = mkNode('C', 0, -100);
    const d = mkNode('D', 0, 100);
    const label: Node = {
      id: 'edge-label-C-D-e1',
      x: 0,
      y: 0,
      width: 30,
      height: 20,
      isGroup: false,
      isEdgeLabel: true,
    } as any;
    const e1 = {
      id: 'e1',
      start: 'C',
      end: 'D',
      type: 'arrow',
      labelNodeId: 'edge-label-C-D-e1',
      points: [
        { x: 0, y: c.y! + 20 },
        { x: 0, y: 0 }, // through label
        { x: 0, y: d.y! - 20 },
      ],
    } as unknown as Edge;
    const layout: LayoutData = { nodes: [c, d, label], edges: [e1], config: {} as any };

    const types = getIssueTypes(layout);
    expect(types).not.toContain('edge-label-overlaps-foreign-edge');
  });
});
