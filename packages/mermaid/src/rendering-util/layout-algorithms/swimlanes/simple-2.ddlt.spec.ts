// cspell:ignore Wybrow Helmers
/**
 * DDLT spec for the swimlanes layout of simple-2.mmd.
 *
 * The fixture is a minimal 5-node TD flowchart with 2 labeled edges
 * (A-to-B "AB", E-to-B "EB") — deliberately exercising the sibling-inbound
 * label class where two edges enter the same node (B), both carrying labels.
 * Exists to expose tightly-packed inbound ports and label / foreign-edge
 * overlap. See `cypress/platform/dev-diagrams/layout-tests/swimlanes/simple-2.mmd`
 * for the actual Mermaid source.
 *
 * Structure mirrors `query-process.ddlt.spec.ts` — canonical DDLT pattern.
 */
import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../types.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { loadDdltFixture } from '../ddlt/loadDdltFixture.js';

const FIXTURE_ID = 'swimlanes/simple-2';
const DEBUG = process.env.SWIMLANE_DDLT_DEBUG === '1';

async function runSwimlanes(): Promise<LayoutData> {
  return await loadDdltFixture(FIXTURE_ID, { backendId: 'swimlanes' });
}

describe('Swimlanes DDLT — simple-2.mmd', () => {
  it('Level 1: validateLayout — produces a valid orthogonal layout', async () => {
    const layout = await runSwimlanes();
    const result = validateLayout(layout);
    if (!result.ok) {
      console.log('[SIMPLE_2_DDLT] validateLayout issues:', JSON.stringify(result.issues, null, 2));
    }
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('Level 1: inbound-to-B labels do not cross-overlap (semantic unambiguity)', async () => {
    // Iteration 14 regression pin — mutual label/foreign-edge overlap.
    //
    // A→B carries the "AB" label and E→B carries the "EB" label; both edges
    // terminate at node B. Before iter 14, `anchorLabelsToPolyline` picked
    // each label's segment/midpoint purely by fit+orientation+length,
    // landing both labels directly on each other's edges:
    //   - "AB" at (-17.06, 153), rect [-26.4,-7.72]×[142.5,163.5] crosses
    //     L_E_B_0's horizontal at y=160
    //   - "EB" at (-14.17, 210.5), rect [-23.5,-4.83]×[200,221] crosses
    //     L_A_B_0's vertical at x=-17.06
    // This is a semantic ambiguity bug — the reader cannot tell which
    // label belongs to which edge.
    //
    // The fix in postProcessing.ts's `anchorLabelsToPolyline`: (a) rank
    // candidate segments by non-collision first (Wybrow-Marriott alley-
    // midpoint analogue `e8804c93`), (b) remove MAX_ATTEMPTS=3 cap, and
    // (c) when the segment's midpoint collides, try parametric positions
    // t ∈ [0.5, 0.25, 0.75, 0.15, 0.85] along the segment before moving
    // on. Helmers diss.pdf §118 (src `21f7ca55`) specifies "one of e's
    // middle segments" without mandating midpoint — along-segment shift
    // stays within the paper's framing.
    const layout = await runSwimlanes();
    const result = validateLayout(layout);
    const labelForeignOverlaps = result.issues.filter(
      (issue) =>
        issue.type === 'edge-label-overlaps-foreign-edge' &&
        Array.isArray(issue.nodeIds) &&
        issue.nodeIds.some(
          (id) => id === 'edge-label-A-B-L_A_B_0' || id === 'edge-label-E-B-L_E_B_0'
        )
    );
    const edgeHitsLabel = result.issues.filter(
      (issue) =>
        issue.type === 'edge-intersects-obstacle' &&
        typeof issue.edgeId === 'string' &&
        (issue.edgeId === 'L_A_B_0' || issue.edgeId === 'L_E_B_0') &&
        Array.isArray(issue.nodeIds) &&
        issue.nodeIds.some((id) => id.startsWith('edge-label-'))
    );
    if (labelForeignOverlaps.length > 0 || edgeHitsLabel.length > 0) {
      console.log(
        '[SIMPLE_2_DDLT] label / edge cross-overlap:',
        JSON.stringify([...labelForeignOverlaps, ...edgeHitsLabel], null, 2)
      );
    }
    expect(labelForeignOverlaps).toEqual([]);
    expect(edgeHitsLabel).toEqual([]);
  });

  it('Level 1: L_A_B_0 is a centered straight vertical at A.x (Kandinsky centering)', async () => {
    // Iteration 15 regression pin — Kandinsky centered straight-line invariant.
    //
    // A and B both live in lane1 with A directly above B (A.x === B.x); the
    // canonical routing is a 2-point vertical from A.bottom-center to
    // B.top-center. Cross-lane sibling L_E_B_0 also arrives at B.top from
    // the east, which raykov's port-distribution (iter 6 δ_s side-split)
    // correctly places OFF center on the east half of B.top (post-transform
    // at x ≈ -14.17). L_A_B_0's pre-transform V-H-V has its dst port
    // OFFSET west of B.cx (at x ≈ -27.95) to make room for L_E_B_0; iter
    // 12's `straightenCollinearSiblingDetours` rescues this to a 2-point
    // straight but originally only tried ±PORT_SHIFT (MIN_PORT_SPACING/2),
    // so it landed L_A_B_0 at x=-17.06 — 3.94 east of A.cx and only 2.89
    // units from L_E_B_0. Visually "A→B is not centered and very close to
    // E→B" (user report, 2026-04-16).
    //
    // Siebenhaller dissertation §2.3.2.1 (NotebookLM src 0fb2d84f):
    // *"We always demand from a valid drawing that straight-line edges
    // are centered at the corresponding vertex side (assigned to the
    // κ-th fine grid line)"* — this is a Kandinsky validity condition,
    // not an optimization. For an edge whose src and dst centers are
    // collinear AND the centered straight line is obstacle-free and
    // does not collide with any sibling's axis, the center port is
    // required, never an offset.
    //
    // Iter 15 fix prepends 0 to the deltas array in
    // straightenCollinearSiblingDetours and extends the crossing check to
    // reject 0-shift only when it would overlap another edge's segment
    // along a shared axis (preserving iter 12's 5-car L_D_H_0 fallback
    // behavior where L_D_E_0's centered-straight at D.cx rules out the
    // center for L_D_H_0).
    const layout = await runSwimlanes();
    const aNode = (layout.nodes ?? []).find((n) => n.id === 'A');
    const bNode = (layout.nodes ?? []).find((n) => n.id === 'B');
    expect(aNode).toBeDefined();
    expect(bNode).toBeDefined();
    const ax = (aNode as { x: number }).x;
    const bx = (bNode as { x: number }).x;
    // Precondition: A and B are in the same column (simple-2 geometry).
    expect(Math.abs(ax - bx)).toBeLessThan(0.1);
    const edge = (layout.edges ?? []).find((e) => e.id === 'L_A_B_0');
    expect(edge).toBeDefined();
    const pts = (edge as { points?: { x: number; y: number }[] }).points ?? [];
    // After simplify the polyline must be a 2-point straight vertical.
    expect(pts.length).toBe(2);
    expect(Math.abs(pts[0].x - pts[1].x)).toBeLessThan(0.1);
    // The vertical must sit at A's center x — Kandinsky centering.
    expect(Math.abs(pts[0].x - ax)).toBeLessThan(1);
  });

  it('Level 2: validateLayout — quality breakdown is within reasonable thresholds', async () => {
    const layout = await runSwimlanes();
    const { breakdown } = validateLayout(layout);
    const totalBends = breakdown.edges.reduce((acc, e) => acc + Math.max(0, e.points - 2), 0);
    const avgBendsPerEdge = breakdown.edgeCount > 0 ? totalBends / breakdown.edgeCount : 0;

    if (DEBUG) {
      console.log('[SIMPLE_2_DDLT] breakdown:', JSON.stringify(breakdown, null, 2));
    }
    expect.soft(breakdown.crossings).toBe(0);
    expect.soft(avgBendsPerEdge).toBeLessThan(5);
    expect.soft(totalBends).toBeLessThanOrEqual(20);
  });
});
