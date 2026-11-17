// cspell:ignore Wybrow Helmers Siebenhaller Hegemann Gladisch raykov
/**
 * DDLT spec for the swimlanes layout of 6-legal-constr-sales.mmd.
 *
 * This fixture exercises routing around a very large obstacle node (J)
 * while a sibling edge from the same source (I) must escape past J to reach K
 * and onward to L/M/N in neighbour lanes. See
 * `cypress/platform/dev-diagrams/layout-tests/swimlanes/6-legal-constr-sales.mmd`.
 *
 * Iteration 17 symptom (user, 2026-04-16): edge I→K runs "almost hugging"
 * node J before turning away — aesthetic only, not an L1 violation.
 *
 * Structure mirrors `simple-2.ddlt.spec.ts` — canonical DDLT pattern.
 */
import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../types.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { loadDdltFixture } from '../ddlt/loadDdltFixture.js';

const FIXTURE_ID = 'swimlanes/6-legal-constr-sales';
const DEBUG = process.env.SWIMLANE_DDLT_DEBUG === '1';

async function runSwimlanes(): Promise<LayoutData> {
  return await loadDdltFixture(FIXTURE_ID, { backendId: 'swimlanes' });
}

describe('Swimlanes DDLT — 6-legal-constr-sales.mmd', () => {
  it('Level 1: validateLayout — produces a valid orthogonal layout', async () => {
    const layout = await runSwimlanes();
    const result = validateLayout(layout);
    if (!result.ok) {
      console.log(
        '[LEGAL_CONSTR_DDLT] validateLayout issues:',
        JSON.stringify(result.issues, null, 2)
      );
    }
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('Level 1: L_I_K_0 does not hug J while routing toward K', async () => {
    // Iter 17 regression pin — Wybrow §Nudging applied as a post-route
    // single-segment nudge (NotebookLM src e8804c93-74b7-4e06-94d0-7e5cf95fe7e3).
    //
    // Baseline geometry:
    //   J: left=571.58, top=590.34, bottom=740.34  (232×150 obstacle)
    //   L_I_K_0 polyline descends at x=566.43, i.e. 5.15u LEFT of J.left.
    //   The vertical segment at x=566.43 runs from y=703.29 to y=804.34,
    //   paralleling J.left (571.58) at only 5.15u over ~37u of J's face.
    //
    // Wybrow: interior segments should sit toward the alley mid-line under
    // ordering + non-crossing constraints. Hegemann & Wolff (b65b3d45)
    // prescribe the same target via channel-centre at construction time.
    // Gladisch (32fe421c) formalises clearance as μ (minimum) + δ (safety).
    //
    // If the route has an interior vertical segment that passes J's y-span,
    // it must keep ≥20u clearance. The refreshed fixture can route without
    // such a pass-by segment; that is also acceptable because it avoids the
    // original near-hugging symptom entirely.
    const layout = await runSwimlanes();
    const edge = (layout.edges ?? []).find((e) => e.id === 'L_I_K_0');
    expect(edge).toBeDefined();
    const pts = (edge as { points?: { x: number; y: number }[] }).points ?? [];
    expect(pts.length).toBeGreaterThanOrEqual(4);
    // J's extent
    const jNode = (layout.nodes ?? []).find((n) => n.id === 'J');
    expect(jNode).toBeDefined();
    const jx = (jNode as { x: number }).x;
    const jy = (jNode as { y: number }).y;
    const jw = (jNode as { width: number }).width;
    const jh = (jNode as { height: number }).height;
    const jLeft = jx - jw / 2;
    const jRight = jx + jw / 2;
    const jTop = jy - jh / 2;
    const jBottom = jy + jh / 2;
    // Find axis-aligned vertical segments that span any part of J's y-range.
    const verticals: { x: number; yMin: number; yMax: number; idx: number }[] = [];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const dx = Math.abs(a.x - b.x);
      const dy = Math.abs(a.y - b.y);
      if (dx < 0.01 && dy > 0.5) {
        verticals.push({
          x: a.x,
          yMin: Math.min(a.y, b.y),
          yMax: Math.max(a.y, b.y),
          idx: i - 1,
        });
      }
    }
    const overlappingJ = verticals.filter((v) => v.yMin < jBottom && v.yMax > jTop);
    // Every such vertical must be ≥ MIN_CLEARANCE_BUFFER (20u) from J on whichever
    // side it sits (left or right). Interior segment only — skip if it coincides
    // with an endpoint stub (which anchors at I.right/K.left port geometry).
    const MIN_CLEARANCE = 20;
    const offenders = overlappingJ
      .filter((v) => v.x < jLeft || v.x > jRight) // outside J rect
      .map((v) => ({
        ...v,
        gapLeft: jLeft - v.x, // positive if to the LEFT of J
        gapRight: v.x - jRight, // positive if to the RIGHT of J
      }))
      .filter((v) => {
        const signedGap = v.x < jLeft ? v.gapLeft : v.gapRight;
        return signedGap < MIN_CLEARANCE;
      });
    if (offenders.length > 0) {
      console.log('[LEGAL_CONSTR_DDLT] L_I_K_0 hug offenders:', JSON.stringify(offenders, null, 2));
    }
    expect(offenders).toEqual([]);
  });

  it('Level 2: validateLayout — quality breakdown baseline', async () => {
    const layout = await runSwimlanes();
    const { breakdown } = validateLayout(layout);
    const totalBends = breakdown.edges.reduce((acc, e) => acc + Math.max(0, e.points - 2), 0);
    const avgBendsPerEdge = breakdown.edgeCount > 0 ? totalBends / breakdown.edgeCount : 0;

    if (DEBUG) {
      console.log('[LEGAL_CONSTR_DDLT] breakdown:', JSON.stringify(breakdown, null, 2));
    }
    expect.soft(breakdown.crossings).toBeLessThanOrEqual(2);
    expect.soft(avgBendsPerEdge).toBeLessThan(5);
    expect.soft(totalBends).toBeLessThanOrEqual(40);
  });
});
