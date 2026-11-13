// cspell:ignore Hegemann Kandinsky Wybrow
/**
 * DDLT spec for the swimlanes layout of 5-car-fun-sales-wide-tb.mmd.
 *
 * Parses the real `.mmd` file via `Diagram.fromText` so the LayoutData the
 * pipeline sees matches what the browser produces, then applies pre-captured
 * node/label sizes from the fixture:
 *   cypress/platform/dev-diagrams/layout-tests/swimlanes/5-car-fun-sales-wide-tb.sizes.json
 *
 * The fixture is a 16-node TD flowchart across 5 subgraphs (Car, Sales, Constr,
 * Legal, Fun) with two labeled edges (I→J "Yes but with a long label…",
 * I→K "No"). Same topology as `7-car-sales-constr.mmd` but with a very wide
 * I→J label (200×42) and a much taller J node (232×150). Exists to exercise
 * the swimlane pipeline on a label-wrapping-dominated layout where the
 * wide edge label forces the Legal lane to be much wider than in other
 * fixtures.
 *
 * Structure mirrors query-process.ddlt.spec.ts — the canonical DDLT pattern.
 */
import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../types.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { loadDdltFixture } from '../ddlt/loadDdltFixture.js';

const FIXTURE_ID = 'swimlanes/5-car-fun-sales-wide-tb';
const DEBUG = process.env.SWIMLANE_DDLT_DEBUG === '1';

async function runSwimlanes(): Promise<LayoutData> {
  return await loadDdltFixture(FIXTURE_ID, { backendId: 'swimlanes' });
}

describe('Swimlanes DDLT — 5-car-fun-sales-wide-tb.mmd', () => {
  it('Level 1: validateLayout — produces a valid orthogonal layout', async () => {
    const layout = await runSwimlanes();
    const result = validateLayout(layout);
    if (!result.ok) {
      console.log(
        '[5_CAR_FUN_WIDE_DDLT] validateLayout issues:',
        JSON.stringify(result.issues, null, 2)
      );
    }
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('Level 1: L_D_E_0 does not attach at the same port as L_E_F_0 on E', async () => {
    // Iteration 9 regression pin — bend-or-end global feasibility rule
    // (Hegemann-Wolff src d30cdbe1): two edges claiming the same node face
    // must be globally feasibility-checked as a set, not sequentially.
    //
    // Before iter 9, `simplifyDetouredEdges` in postProcessing.ts rewrote
    // L_D_E_0 from a 4-bend raykov detour (around H which sits on the
    // same row between D and E) to a 2-bend L-shape using (D.top, E.top),
    // but it didn't check whether E.top was already claimed by another
    // edge. L_E_F_0 (the E→F edge that sits directly above E in the Fun
    // lane) was already routed as a straight vertical from E's top-face
    // center to F's bottom-face center. The rewrite collided L_D_E_0's
    // endpoint with L_E_F_0's start at exactly (687.58, 405.79).
    //
    // With the attach-claim collision check in simplifyDetouredEdges,
    // the (D.top, E.top) candidate is rejected and L_D_E_0 stays with
    // its raykov-produced detour (4 bends instead of 2 — Level-2 cost
    // worth paying for Level-1 correctness).
    const layout = await runSwimlanes();
    const lde = (layout.edges ?? []).find((e) => e.id === 'L_D_E_0');
    const lef = (layout.edges ?? []).find((e) => e.id === 'L_E_F_0');
    expect(lde).toBeDefined();
    expect(lef).toBeDefined();
    const ldePts = (lde as { points?: { x: number; y: number }[] }).points ?? [];
    const lefPts = (lef as { points?: { x: number; y: number }[] }).points ?? [];
    expect(ldePts.length).toBeGreaterThanOrEqual(2);
    expect(lefPts.length).toBeGreaterThanOrEqual(2);
    const ldeEndOnE = ldePts[ldePts.length - 1];
    const lefStartOnE = lefPts[0];
    const EPS = 1e-3;
    const collides =
      Math.abs(ldeEndOnE.x - lefStartOnE.x) < EPS && Math.abs(ldeEndOnE.y - lefStartOnE.y) < EPS;
    if (collides) {
      console.log(
        '[5_CAR_FUN_WIDE_DDLT] L_D_E_0 and L_E_F_0 share E attach:',
        JSON.stringify({ ldeEndOnE, lefStartOnE })
      );
    }
    expect(collides).toBe(false);
  });

  it('Level 1: L_D_E_0 detours WEST of H, not east (no crossing with L_H_I_0)', async () => {
    // Iteration 11 regression pin — cross-lane-first routing order.
    //
    // 5-car-fun-sales-wide-tb has a 90° crossing (L_D_E_0 × L_H_I_0) caused
    // by sequential A* routing: when `L_D_E_0` (intra-lane Constr, D→E with
    // H sitting in the same column between them) routes before `L_H_I_0`
    // (cross-lane Constr→Legal, straight horizontal at y=212.5 = H's row),
    // the CROSSING_PENALTY is blind to the not-yet-routed L_H_I_0, so A*
    // picks the shorter east detour (~371px) over the longer west one
    // (~478px, partially blocked by L_D_H_0's attach box). L_H_I_0 then
    // routes later and has no escape — it accepts the crossing.
    //
    // Iter 11 flips `routingOrder` at raykov.ts:481 so cross-lane edges
    // route first. L_H_I_0 now claims the straight y=212.5 row first; when
    // L_D_E_0 routes afterward, A* sees the +1000 crossing penalty against
    // the already-placed east path, which easily beats the ~107px length
    // advantage, so the west detour wins and the crossing is eliminated.
    //
    // Paper backing: Walk on the Wild Side (LIPIcs.GD.2025.35) — 90°
    // crossings are empirically tolerable (Huang et al. "Effects of
    // crossing angles") but avoidable here; Wybrow et al. Orthogonal
    // Connector Routing — backward-looking crossing penalty is the right
    // mechanism, first-committed edge matters.
    //
    // This pin locks the FIX SHAPE — future iterations re-tuning raykov
    // must not silently re-introduce the east detour.
    const layout = await runSwimlanes();
    const lde = (layout.edges ?? []).find((e) => e.id === 'L_D_E_0');
    expect(lde).toBeDefined();
    const pts = (lde as { points?: { x: number; y: number }[] }).points ?? [];
    expect(pts.length).toBeGreaterThanOrEqual(2);

    // H is in the same column as D/E at x ≈ 122.95 on row y ≈ 212.5.
    // Find any vertical segment of L_D_E_0 that crosses H's row.
    const hNode = (layout.nodes ?? []).find((n) => n.id === 'H');
    expect(hNode).toBeDefined();
    const hX = (hNode as { x: number }).x;
    const hY = (hNode as { y: number }).y;

    let detourLegX: number | null = null;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      if (Math.abs(a.x - b.x) < 1e-6) {
        // vertical segment
        const y0 = Math.min(a.y, b.y);
        const y1 = Math.max(a.y, b.y);
        if (y0 <= hY && hY <= y1) {
          detourLegX = a.x;
          break;
        }
      }
    }

    if (detourLegX === null || detourLegX >= hX) {
      console.log('[5_CAR_FUN_WIDE_DDLT] L_D_E_0 detour leg:', {
        detourLegX,
        hX,
        hY,
        points: pts,
      });
    }
    expect(detourLegX).not.toBeNull();
    // Must be WEST of H center — east detour reintroduces the L_H_I_0 crossing.
    expect(detourLegX!).toBeLessThan(hX);
  });

  it('Level 1: L_D_H_0 is a 2-point straight vertical near D.x (collinear with D and H)', async () => {
    // Iteration 12 regression pin — co-route sibling straight-line rescue.
    //
    // D and H sit at x≈122.95 with H directly south of D and nothing
    // between them on that column. The geometrically obvious route for
    // L_D_H_0 is a 2-point vertical from D.bottom-center to H.top-center.
    //
    // Iter 10's simplifyDetouredEdges correctly produces this straight
    // line in the sister fixture 7-car-sales-constr (where L_E_F_0 uses
    // E.right, freeing E.left for L_D_E_0's rewrite, which in turn frees
    // D.bottom for L_D_H_0's straight). In 5-car, L_E_F_0 uses E.left
    // (Fun lane sits WEST of Constr per the subgraph order), blocking
    // L_D_E_0's rewrite and leaving L_D_H_0 stranded on D.left as a
    // 4-point west U-detour around H — visually obvious as a bug.
    //
    // Iter 12 fix: straightenCollinearSiblingDetours, a
    // post-simplifyDetouredEdges pass that detects "V-H-V/H-V-H detour
    // around a collinear-blocker where the straight line is
    // geometrically clear" and rewrites to 2 points, port-shifting
    // along the shared face by MIN_PORT_SPACING/2 so the new straight
    // coexists with the still-claimed primary sibling on the same face.
    //
    // Paper backing: Hegemann & Wolff "On the smoothing of orthogonal
    // connector layouts" (NotebookLM src b65b3d45) §4.2 / Fig. 11 —
    // joint-feasibility via port distribution rather than face
    // exclusion. Mermaid-specific narrowing: we only rescue the
    // exact 4-point-U-around-nothing shape, to minimize blast radius.
    const layout = await runSwimlanes();
    const ldh = (layout.edges ?? []).find((e) => e.id === 'L_D_H_0');
    expect(ldh).toBeDefined();
    const pts = (ldh as { points?: { x: number; y: number }[] }).points ?? [];
    expect(pts.length).toBe(2);
    // Must be a vertical segment (two points sharing x within EPS).
    expect(Math.abs(pts[0].x - pts[1].x)).toBeLessThan(1);
    // Must be near D.x within MIN_PORT_SPACING tolerance (port offset).
    const dNode = (layout.nodes ?? []).find((n) => n.id === 'D');
    expect(dNode).toBeDefined();
    const dX = (dNode as { x: number }).x;
    expect(Math.abs(pts[0].x - dX)).toBeLessThanOrEqual(8);
    // Must terminate near H.top (y strictly less than H center).
    const hNode = (layout.nodes ?? []).find((n) => n.id === 'H');
    expect(hNode).toBeDefined();
    const hY = (hNode as { y: number }).y;
    expect(pts[1].y).toBeLessThan(hY);
  });

  it('Level 2: validateLayout — quality breakdown is within reasonable thresholds', async () => {
    const layout = await runSwimlanes();
    const { breakdown } = validateLayout(layout);
    const totalBends = breakdown.edges.reduce((acc, e) => acc + Math.max(0, e.points - 2), 0);
    const avgBendsPerEdge = breakdown.edgeCount > 0 ? totalBends / breakdown.edgeCount : 0;

    if (DEBUG) {
      console.log('[5_CAR_FUN_WIDE_DDLT] breakdown:', JSON.stringify(breakdown, null, 2));
    }
    // Soft-assert so all baseline regressions surface in a single run.
    expect.soft(breakdown.crossings).toBe(0);
    expect.soft(avgBendsPerEdge).toBeLessThan(5);
    // Generous initial bend budget; will be tightened as iterations improve it.
    expect.soft(totalBends).toBeLessThanOrEqual(30);
  });
});
