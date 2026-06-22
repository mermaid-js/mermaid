// cspell:ignore Fößmeier
/**
 * DDLT spec for the swimlanes layout of query-process.mmd.
 *
 * Parses the real `.mmd` file via `Diagram.fromText` so the LayoutData the
 * pipeline sees matches what the browser produces, then applies pre-captured
 * node/label sizes from the fixture:
 *   cypress/platform/dev-diagrams/layout-tests/swimlanes/query-process.sizes.json
 *
 * The test runs the swimlanes layout pipeline (createEdgeLabelNodes → sugiyama →
 * orthogonal routing → direction transform) and validates with the unified
 * `validateLayout` layout-utils harness (validity + 0–1000 score breakdown).
 *
 * This spec is the canonical pattern for DDLT specs: never hand-construct
 * LayoutData — parse the `.mmd`.
 */
import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../types.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { loadDdltFixture } from '../ddlt/loadDdltFixture.js';

const FIXTURE_ID = 'swimlanes/query-process';

async function runQueryProcessSwimlanes(): Promise<LayoutData> {
  return await loadDdltFixture(FIXTURE_ID, { backendId: 'swimlanes' });
}

describe('Swimlanes DDLT — query-process.mmd', () => {
  it('Level 1: validateLayout — produces a valid orthogonal layout', async () => {
    const layout = await runQueryProcessSwimlanes();
    const result = validateLayout(layout);
    if (!result.ok) {
      console.log(
        '[QUERY_PROCESS_DDLT] validateLayout issues:',
        JSON.stringify(result.issues, null, 2)
      );
    }
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('Level 1: no sibling edge routes through a foreign edge-label', async () => {
    // Regression pin for the label-as-dummy-node sibling-collision class.
    // Node E has two outgoing edges (E→F, E→G); E→F has an edge-label. The
    // bug was that intra-lane exclusions removed the E→F label from the
    // obstacle set while routing E→G, so E→G cut straight through it. With
    // the fix, only an edge's own label is excluded; foreign labels remain
    // obstacles and the router detours around them.
    const layout = await runQueryProcessSwimlanes();
    const result = validateLayout(layout);
    const foreignLabelIssues = result.issues.filter(
      (issue) =>
        issue.type === 'edge-label-overlaps-foreign-edge' ||
        (issue.type === 'edge-intersects-obstacle' &&
          typeof issue.message === 'string' &&
          issue.message.includes('edge-label-'))
    );
    if (foreignLabelIssues.length > 0) {
      console.log(
        '[QUERY_PROCESS_DDLT] foreign-label issues:',
        JSON.stringify(foreignLabelIssues, null, 2)
      );
    }
    expect(foreignLabelIssues).toEqual([]);
  });

  it('Level 1: no two edges depart from the same port on node A2', async () => {
    // Regression pin for the port-allocation bug on labeled outgoing edges.
    // Node A2 has two labeled outgoing edges (A2→B and A2→E). Both are
    // decomposed into synthetic to-label / from-label pairs, and the port-
    // grouping pass was skipping every to-label edge because its destination
    // is an edge-label node. Result: A2's south-side port group was empty,
    // no offsets were distributed, and both edges departed at the same
    // center attach point and ran collinear for 142.3 units.
    const layout = await runQueryProcessSwimlanes();
    const result = validateLayout(layout);
    const a2DepartureIssues = result.issues.filter(
      (issue) =>
        issue.type === 'edge-same-port-departure' &&
        Array.isArray(issue.nodeIds) &&
        issue.nodeIds.includes('A2')
    );
    const a2SharedSubpath = result.issues.filter(
      (issue) =>
        issue.type === 'edge-shared-subpath' &&
        typeof issue.message === 'string' &&
        issue.message.includes('L_A2_B_0') &&
        issue.message.includes('L_A2_E_0')
    );
    if (a2DepartureIssues.length > 0 || a2SharedSubpath.length > 0) {
      console.log(
        '[QUERY_PROCESS_DDLT] A2 port issues:',
        JSON.stringify([...a2DepartureIssues, ...a2SharedSubpath], null, 2)
      );
    }
    expect(a2DepartureIssues).toEqual([]);
    expect(a2SharedSubpath).toEqual([]);
  });

  it('Level 2: edge polylines have no spikes or collinear intermediates', async () => {
    // Post-routing simplification pass guarantee. Every emitted polyline
    // should satisfy two structural invariants:
    //   (a) Spike: no triple (prev, cur, next) where prev === next (zero-area
    //       out-and-back). The bend-minimization theorem in src
    //       e3a78a6f rules these out as strictly sub-optimal.
    //   (b) Collinear intermediate: no triple (prev, cur, next) where all
    //       three lie on the same axis AND cur is strictly between prev
    //       and next. The middle point is redundant.
    const layout = await runQueryProcessSwimlanes();
    const EPS = 1e-6;
    interface Offender {
      edgeId: string;
      index: number;
      kind: 'spike' | 'collinear';
    }
    const offenders: Offender[] = [];
    for (const edge of layout.edges ?? []) {
      const pts = (edge as { points?: { x: number; y: number }[] }).points ?? [];
      for (let i = 1; i < pts.length - 1; i++) {
        const prev = pts[i - 1];
        const cur = pts[i];
        const next = pts[i + 1];
        if (Math.abs(prev.x - next.x) < EPS && Math.abs(prev.y - next.y) < EPS) {
          offenders.push({ edgeId: edge.id ?? '<unnamed>', index: i, kind: 'spike' });
          continue;
        }
        const allSameX = Math.abs(prev.x - cur.x) < EPS && Math.abs(cur.x - next.x) < EPS;
        const allSameY = Math.abs(prev.y - cur.y) < EPS && Math.abs(cur.y - next.y) < EPS;
        if (allSameX) {
          const lo = Math.min(prev.y, next.y);
          const hi = Math.max(prev.y, next.y);
          if (cur.y > lo + EPS && cur.y < hi - EPS) {
            offenders.push({ edgeId: edge.id ?? '<unnamed>', index: i, kind: 'collinear' });
          }
        } else if (allSameY) {
          const lo = Math.min(prev.x, next.x);
          const hi = Math.max(prev.x, next.x);
          if (cur.x > lo + EPS && cur.x < hi - EPS) {
            offenders.push({ edgeId: edge.id ?? '<unnamed>', index: i, kind: 'collinear' });
          }
        }
      }
    }
    if (offenders.length > 0) {
      console.log('[QUERY_PROCESS_DDLT] polyline offenders:', JSON.stringify(offenders, null, 2));
    }
    expect(offenders).toEqual([]);
  });

  it('Level 1: no edge hugs the border of a foreign edge-label', async () => {
    // Regression pin for the border-hugging bug introduced by iteration 2's
    // port distribution. L_E_G_0 was routing horizontally at y=251.965 —
    // only 0.925u below the E-F label's visual bottom (y=251.04) — for
    // 22.84u. Inflating edge-label obstacles in the router's internal view
    // pushes any valid route clear of the label's visual border.
    const layout = await runQueryProcessSwimlanes();
    const result = validateLayout(layout);
    const labelHugIssues = result.issues.filter(
      (issue) =>
        issue.type === 'edge-border-hugging' &&
        Array.isArray(issue.nodeIds) &&
        issue.nodeIds.some((id) => id.startsWith('edge-label-'))
    );
    if (labelHugIssues.length > 0) {
      console.log(
        '[QUERY_PROCESS_DDLT] label hug issues:',
        JSON.stringify(labelHugIssues, null, 2)
      );
    }
    expect(labelHugIssues).toEqual([]);
  });

  it('Level 2: validateLayout — quality breakdown is within reasonable thresholds', async () => {
    const layout = await runQueryProcessSwimlanes();
    const { breakdown } = validateLayout(layout);
    const totalBends = breakdown.edges.reduce((acc, e) => acc + Math.max(0, e.points - 2), 0);
    const avgBendsPerEdge = breakdown.edgeCount > 0 ? totalBends / breakdown.edgeCount : 0;

    // Use soft assertions so all baseline regressions surface in a single run
    // instead of stopping at the first failure.
    // Pure orthogonal routing should not produce any segment crossings here.
    expect.soft(breakdown.crossings).toBe(0);
    // Bend budget per edge is generous to allow lane handoffs.
    expect.soft(avgBendsPerEdge).toBeLessThan(5);
    // Total bend budget for the whole diagram. ~5 bends is achievable by hand;
    // 12 leaves headroom for lane handoffs but flags pathological over-bending.
    expect.soft(totalBends).toBeLessThanOrEqual(12);
  });

  it('Level 2: every labelled edge has its label center on a polyline segment', async () => {
    // Strategy 1 (late insertion / diss.pdf §118) invariant: labels are
    // placed onto an existing segment of their edge's routed polyline, so
    // each label's center lies by construction ON some segment of its
    // owning edge. This replaces the label-as-waypoint model where labels
    // floated at Sugiyama-assigned y-coordinates independent of the
    // routed geometry.
    //
    // The test tolerates a small epsilon off-axis and treats "on a segment"
    // as "within EPS of the axis-aligned infinite line of the segment, and
    // strictly inside the segment's extent". Zero-length segments are
    // ignored.
    const layout = await runQueryProcessSwimlanes();
    const EPS = 1;
    const nodeById = new Map<string, { x?: number; y?: number }>();
    for (const n of layout.nodes) {
      nodeById.set(n.id, n);
    }

    interface LabelOffender {
      edgeId: string;
      labelId: string;
      labelCenter: { x: number; y: number };
      nearestDist: number;
    }
    const offenders: LabelOffender[] = [];

    for (const edge of layout.edges ?? []) {
      const labelId = (edge as { labelNodeId?: string }).labelNodeId;
      if (!labelId) {
        continue;
      }
      const labelNode = nodeById.get(labelId);
      if (!labelNode) {
        continue;
      }
      const pts = (edge as { points?: { x: number; y: number }[] }).points;
      if (!pts || pts.length < 2) {
        continue;
      }
      const lcx = labelNode.x ?? 0;
      const lcy = labelNode.y ?? 0;
      let minDist = Infinity;
      let onSegment = false;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const sameX = Math.abs(a.x - b.x) < 1e-6;
        const sameY = Math.abs(a.y - b.y) < 1e-6;
        if (sameX && sameY) {
          continue;
        }
        if (sameY) {
          // Horizontal segment at y = a.y, x in [min, max]
          const minX = Math.min(a.x, b.x);
          const maxX = Math.max(a.x, b.x);
          const dy = Math.abs(lcy - a.y);
          const dx = lcx < minX ? minX - lcx : lcx > maxX ? lcx - maxX : 0;
          const d = dy + dx;
          if (d < minDist) {
            minDist = d;
          }
          if (dy < EPS && lcx >= minX - EPS && lcx <= maxX + EPS) {
            onSegment = true;
            break;
          }
        } else if (sameX) {
          const minY = Math.min(a.y, b.y);
          const maxY = Math.max(a.y, b.y);
          const dx = Math.abs(lcx - a.x);
          const dy = lcy < minY ? minY - lcy : lcy > maxY ? lcy - maxY : 0;
          const d = dx + dy;
          if (d < minDist) {
            minDist = d;
          }
          if (dx < EPS && lcy >= minY - EPS && lcy <= maxY + EPS) {
            onSegment = true;
            break;
          }
        }
      }
      if (!onSegment) {
        offenders.push({
          edgeId: edge.id ?? '<unnamed>',
          labelId,
          labelCenter: { x: lcx, y: lcy },
          nearestDist: minDist,
        });
      }
    }

    if (offenders.length > 0) {
      console.log(
        '[QUERY_PROCESS_DDLT] label-off-polyline offenders:',
        JSON.stringify(offenders, null, 2)
      );
    }
    expect(offenders).toEqual([]);
  });

  it('Level 2: strategy 1 bend budget — totalBends ≤ 6', async () => {
    // Progression:
    //   iter 4: 36 bends (after label-aware routing + port distribution)
    //   iter 5: 14 bends (Strategy 1 full pivot)
    //   iter 6:  8 bends (sibling port-side splitting — δ_s load balance)
    //   iter 7:  6 bends (stale-port-offset Z-edge straightener, paper-
    //           backed by Hegemann-Wolff b65b3d45 Fig. 11b discussion;
    //           collapses a short H-V-H jog at the end of L_G_F_0 that
    //           was a stale port offset from a sibling group dissolved
    //           by iter-5's simplifyDetouredEdges)
    // cspell:ignore Hegemann
    const layout = await runQueryProcessSwimlanes();
    const { breakdown } = validateLayout(layout);
    const totalBends = breakdown.edges.reduce((acc, e) => acc + Math.max(0, e.points - 2), 0);
    expect(totalBends).toBeLessThanOrEqual(6);
  });

  it('Level 1: G→F edge is a straight horizontal line', async () => {
    // Iteration 7 regression pin for the stale port-offset Z-edge
    // straightener. Before iter 7, the G→F edge had a 4-point H-V-H
    // polyline with a 10u vertical jog at F's west port — an artefact
    // of port distribution computed at raykov time when L_E_F_0 was
    // assumed to also enter F's west, before iter-5's
    // `simplifyDetouredEdges` rewrote L_E_F_0 to use E.top → F.top.
    // With the stale-offset cleanup pass, the edge collapses to a
    // straight horizontal line from G.east to F.west at y=240 (the
    // shared center, continuing L_E_G_0's flow line).
    //
    // The query-process.mmd fixture was updated (mid-session 2026-04-16)
    // to use F2 as a separate node for the G→F2 branch, so the edge id
    // is now `L_G_F2_0`. Check both in case the fixture swaps back.
    const layout = await runQueryProcessSwimlanes();
    const gfEdge =
      (layout.edges ?? []).find((e) => e.id === 'L_G_F2_0') ??
      (layout.edges ?? []).find((e) => e.id === 'L_G_F_0');
    expect(gfEdge).toBeDefined();
    const pts = (gfEdge as { points?: { x: number; y: number }[] }).points ?? [];
    expect(pts.length).toBeGreaterThanOrEqual(2);
    const EPS = 1e-3;
    const firstY = pts[0].y;
    const allSameY = pts.every((p) => Math.abs(p.y - firstY) < EPS);
    if (!allSameY) {
      console.log('[QUERY_PROCESS_DDLT] G→F edge not straight:', JSON.stringify(pts, null, 2));
    }
    expect(allSameY).toBe(true);
  });

  it('Level 1: A2 outgoing siblings respect Kandinsky port distribution', async () => {
    // Originally iteration 6 regression pin for the sibling
    // side-splitting pass (diss.pdf §6.1.2.2 δ_s load balancing rule):
    // "A2's two outgoing edges must exit on DIFFERENT sides".
    //
    // Relaxed in iter 17 (2026-04-16): the paper-correct Kandinsky
    // invariant (Fößmeier–Kaufmann 1995; Siebenhaller §2.3) is
    // "sibling ports on the same face are separated by at least δ_s";
    // distinct-faces is one sufficient solution, but NOT a necessary
    // one. Iter 17's `portSwapToLShape` pass can legitimately place
    // both A2 outgoings on the same face when that saves a bend, as
    // long as the two ports are ≥ δ_s apart. The stricter distinct-
    // faces formulation was a proxy that over-rejected a class of
    // bend-reducing port swaps (user report on 8-query-process-2:
    // A2→E was exiting on east — parallel to the incoming A→A2 —
    // costing one unnecessary bend; swap to south shares the face
    // with A2→B but saves the bend and respects δ_s).
    //
    // The relaxed invariant: EITHER the two outgoings exit on
    // different faces (one horizontal first-segment, one vertical)
    // OR they share a face with port centers ≥ δ_s apart.
    const MIN_PORT_SPACING = 8;
    const layout = await runQueryProcessSwimlanes();
    const a2ToE = (layout.edges ?? []).find((e) => e.id === 'L_A2_E_0');
    const a2ToB = (layout.edges ?? []).find((e) => e.id === 'L_A2_B_0');
    expect(a2ToE).toBeDefined();
    expect(a2ToB).toBeDefined();
    const ePts = (a2ToE as { points?: { x: number; y: number }[] }).points ?? [];
    const bPts = (a2ToB as { points?: { x: number; y: number }[] }).points ?? [];
    expect(ePts.length).toBeGreaterThanOrEqual(2);
    expect(bPts.length).toBeGreaterThanOrEqual(2);
    const ESP = 1e-3;
    // Face direction (N/S/E/W), not just axis, decides "same face".
    // Two edges can both have vertical first segments but go in
    // OPPOSITE directions (one N, one S) — that's distinct faces.
    type FaceDir = 'N' | 'S' | 'E' | 'W' | 'none';
    const firstRealPort = (pts: { x: number; y: number }[]): { x: number; y: number } => {
      for (let i = 0; i + 1 < pts.length; i++) {
        const dx = pts[i + 1].x - pts[i].x;
        const dy = pts[i + 1].y - pts[i].y;
        if (Math.abs(dx) < ESP && Math.abs(dy) < ESP) {
          continue;
        }
        return pts[i];
      }
      return pts[0];
    };
    const firstFaceDir = (pts: { x: number; y: number }[]): FaceDir => {
      for (let i = 0; i + 1 < pts.length; i++) {
        const dx = pts[i + 1].x - pts[i].x;
        const dy = pts[i + 1].y - pts[i].y;
        if (Math.abs(dx) < ESP && Math.abs(dy) < ESP) {
          continue;
        }
        if (Math.abs(dx) < ESP) {
          return dy > 0 ? 'S' : 'N';
        }
        return dx > 0 ? 'E' : 'W';
      }
      return 'none';
    };
    const eDir = firstFaceDir(ePts);
    const bDir = firstFaceDir(bPts);
    if (eDir === bDir && eDir !== 'none') {
      // Same face — check port separation ≥ δ_s along the perpendicular
      // axis (N/S face → separation on X; E/W face → separation on Y).
      const ePort = firstRealPort(ePts);
      const bPort = firstRealPort(bPts);
      const isVerticalFace = eDir === 'N' || eDir === 'S';
      const separation = isVerticalFace ? Math.abs(ePort.x - bPort.x) : Math.abs(ePort.y - bPort.y);
      expect(separation).toBeGreaterThanOrEqual(MIN_PORT_SPACING - ESP);
    }
    // If the faces differ, the Kandinsky port-distribution rule is
    // trivially satisfied (one edge per face) and no further assertion
    // is needed.
  });
});
