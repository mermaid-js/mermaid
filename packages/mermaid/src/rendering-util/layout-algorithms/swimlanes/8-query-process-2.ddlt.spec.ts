// cspell:ignore Wybrow Helmers Siebenhaller Eiglsperger agnostically Hegemann Fößmeier
/**
 * DDLT spec for the swimlanes layout of 8-query-process-2.mmd.
 *
 * The fixture is an LR flowchart with three swimlanes (StatusSeeker, Head
 * of Engineering, Tech Lead) and 8 edges including the branching
 * `E --No--> G --> F` two-hop and the cross-lane returns A2→B, A2→E, B→E.
 * Created to pin down the E→G "final-stretch-too-close-to-G" visual
 * artifact (user report, 2026-04-16): E→G's last vertical bend into G
 * lands so close to G that the arrowhead's final short horizontal section
 * is clipped / overlaps G.
 *
 * Structure mirrors `simple-2.ddlt.spec.ts` / `query-process.ddlt.spec.ts`.
 */
import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../types.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { loadDdltFixture } from '../ddlt/loadDdltFixture.js';

const FIXTURE_ID = 'swimlanes/8-query-process-2';
const DEBUG = process.env.SWIMLANE_DDLT_DEBUG === '1';

function dedupeConsecutive(pts: { x: number; y: number }[]): { x: number; y: number }[] {
  const EPS = 1e-6;
  const result: { x: number; y: number }[] = [];
  for (const p of pts) {
    const last = result.length > 0 ? result[result.length - 1] : undefined;
    if (!last || Math.abs(p.x - last.x) > EPS || Math.abs(p.y - last.y) > EPS) {
      result.push(p);
    }
  }
  return result;
}

async function runSwimlanes(): Promise<LayoutData> {
  return await loadDdltFixture(FIXTURE_ID, { backendId: 'swimlanes' });
}

describe('Swimlanes DDLT — 8-query-process-2.mmd', () => {
  it('Level 1: validateLayout — produces a valid orthogonal layout', async () => {
    const layout = await runSwimlanes();
    const result = validateLayout(layout);
    if (!result.ok) {
      console.log(
        '[8_QUERY_PROCESS_2_DDLT] validateLayout issues:',
        JSON.stringify(result.issues, null, 2)
      );
    }
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('Level 1: L_E_G_0 last segment — arrowhead-base clearance (specific pin for iter 16)', async () => {
    // Iteration 16 regression pin — the user-reported visual artifact on
    // edge E→G: "the final stretch of the edge is at least, it looks like
    // it in the graph, vertical going upwards. It is so close to G that
    // when it tries to bend to the right to go into it, that actual
    // section is invisible."
    //
    // Pre-iter-16 baseline (the symptom): L_E_G_0 was a 5-bend path ending
    //   ... → (1191.89, 331.79) → (1191.89, 240.54) → (1197.41, 240.54)=G.left
    // The last horizontal stub from (1191.89, 240.54) to (1197.41, 240.54)
    // was only **5.52 units** long — shorter than the edge arrowhead's
    // marker length (~10u). The arrow tip lands at G.left but the base of
    // the marker overlaps the previous vertical segment; the stub itself
    // is visually obscured by the arrowhead.
    //
    // Paper backing: Siebenhaller's Kandinsky dissertation
    // (NotebookLM src `21f7ca55`) describes a **bend-stretching**
    // post-pass that replaces tail-shape patterns with straighter ones
    // subject to the invariant "the first and last direction of a shape
    // is never changed" (citing Eiglsperger et al. [67]). Sliding the
    // penultimate vertical from x=1191.89 to x=G.left=1197.41 preserves
    // the last direction (still vertical upward) and absorbs the 5.52u
    // stub — iter 16's `collapseShortTerminalStub` pass in postProcessing.ts.
    //
    // Pin: the last segment of L_E_G_0 must be at least MIN_TERMINAL_STUB
    // units long (10u — arrowhead base length). This is axis-agnostic:
    // the last segment might be horizontal (hit from west/east) or
    // vertical (hit from south/north); either way, length >= 10u.
    const MIN_TERMINAL_STUB = 10;
    const layout = await runSwimlanes();
    const edge = (layout.edges ?? []).find((e) => e.id === 'L_E_G_0');
    expect(edge).toBeDefined();
    const rawPts = (edge as { points?: { x: number; y: number }[] }).points ?? [];
    // Dedupe consecutive equal points (raykov produces duplicate port-handle
    // terminals) so we measure the last *real* segment, not a zero-length
    // duplicate.
    const pts = dedupeConsecutive(rawPts);
    expect(pts.length).toBeGreaterThanOrEqual(2);
    const a = pts[pts.length - 2];
    const b = pts[pts.length - 1];
    const lastLen = Math.hypot(b.x - a.x, b.y - a.y);
    if (lastLen < MIN_TERMINAL_STUB) {
      console.log(
        `[8_QUERY_PROCESS_2_DDLT] L_E_G_0 short-stub: lastLen=${lastLen.toFixed(2)}, ` +
          `a=(${a.x.toFixed(2)},${a.y.toFixed(2)}), b=(${b.x.toFixed(2)},${b.y.toFixed(2)})`
      );
    }
    expect(lastLen).toBeGreaterThanOrEqual(MIN_TERMINAL_STUB);
  });

  it("Level 1: every edge's last segment >= arrowhead-base length (generic rule)", async () => {
    // Generic companion to the L_E_G_0 pin. The arrowhead marker in
    // mermaid has a base length ≈ 10 units; any edge whose final segment
    // is shorter than that will have the arrow marker overlap the
    // penultimate segment. Applies axis-agnostically.
    //
    // At present this is only exercised on 8-query-process-2 — other
    // fixtures may have edges with legitimately short finals (e.g. 2-
    // point straight lines where src and dst are very close). If so,
    // the `collapseShortTerminalStub` pass should handle them or the
    // rule should be relaxed. The threshold (10) is conservative and
    // matches the mermaid arrowhead marker-length used in rendering.
    const MIN_TERMINAL_STUB = 10;
    const layout = await runSwimlanes();
    const offenders: { id: string; lastLen: number }[] = [];
    for (const edge of layout.edges ?? []) {
      if ((edge as { isLayoutOnly?: boolean }).isLayoutOnly) {
        continue;
      }
      const rawPts = (edge as { points?: { x: number; y: number }[] }).points ?? [];
      const pts = dedupeConsecutive(rawPts);
      if (pts.length < 2) {
        continue;
      }
      // Skip 2-point straight edges — their "last segment" is their full
      // length; those are not the stub class we care about.
      if (pts.length === 2) {
        continue;
      }
      const a = pts[pts.length - 2];
      const b = pts[pts.length - 1];
      const lastLen = Math.hypot(b.x - a.x, b.y - a.y);
      if (lastLen < MIN_TERMINAL_STUB) {
        offenders.push({ id: String(edge.id ?? ''), lastLen });
      }
    }
    if (offenders.length > 0) {
      console.log(
        '[8_QUERY_PROCESS_2_DDLT] short-terminal-stub offenders:',
        JSON.stringify(offenders)
      );
    }
    expect(offenders).toEqual([]);
  });

  it('Level 1: L_A2_E_0 exits A2 on a perpendicular face (iter 17 port-swap pin)', async () => {
    // Iteration 17 pin (2026-04-16) — user report: "A2 → E currently leaves
    // A2 on the east port. It would clearly be prettier on a (perpendicular)
    // port, and would reduce the number of bends with one."
    //
    // Current (pre-iter-17) polyline, deduped:
    //   (A2.east=355.2, 0) → (gutter=402.3, 0) → (402.3, 213.4) → (E.west=844.1, 213.4)
    // 4 points → 2 interior bends. The first segment exits A2 on its east
    // face, parallel to the incoming A→A2 edge (a "straight-through" port
    // choice), forcing two orthogonal bends to reach E which is in a
    // different lane.
    //
    // Target: the edge exits A2 on the face perpendicular to the A→A2
    // incoming direction (i.e. the face that points toward E's lane).
    // A is west of A2, so A→A2 is horizontal; therefore A2 → E's first
    // segment must be VERTICAL — the first two deduped points share X.
    // Combined with the ≤ 1 interior bend target below, this expresses
    // the Kandinsky port-distribution preference: decision-diamond
    // outgoing edges use perpendicular faces, one per target direction.
    //
    // Paper backing: Siebenhaller dissertation §3.3 "Port Assignment"
    // (local port-swap if bends strictly decrease and Kandinsky
    // invariants hold) + Hegemann–Wolff §4.2 joint-feasibility guard
    // (paper src b65b3d45). Distinct from bend-stretching
    // (Eiglsperger et al. "first/last direction unchanged"), which does
    // not apply because we are CHANGING the first direction.
    const layout = await runSwimlanes();
    const edge = (layout.edges ?? []).find((e) => e.id === 'L_A2_E_0');
    expect(edge).toBeDefined();
    const rawPts = (edge as { points?: { x: number; y: number }[] }).points ?? [];
    const pts = dedupeConsecutive(rawPts);
    expect(pts.length).toBeGreaterThanOrEqual(2);
    // ≤ 1 interior bend == ≤ 3 deduped points.
    expect(pts.length).toBeLessThanOrEqual(3);
    // First segment perpendicular to incoming A→A2. A→A2 is horizontal
    // (A.cx < A2.cx, same row), so A2→E's first segment must be vertical.
    const EPS = 1e-3;
    const firstIsVertical = Math.abs(pts[0].x - pts[1].x) < EPS;
    if (!firstIsVertical) {
      console.log(
        `[8_QUERY_PROCESS_2_DDLT] L_A2_E_0 first-segment-not-vertical: ` +
          `p0=(${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}), ` +
          `p1=(${pts[1].x.toFixed(2)},${pts[1].y.toFixed(2)}), ` +
          `dedupedCount=${pts.length}`
      );
    }
    expect(firstIsVertical).toBe(true);

    // Kandinsky δ_s port-separation invariant
    // (Fößmeier–Kaufmann 1995; Siebenhaller §6.1.2.2). When iter 17
    // places A2→E on the same face as A2→B (both south in this
    // fixture), the two source ports must be ≥ δ_s apart to avoid the
    // "cramped siblings" visual artifact the user flagged in iter 17
    // review: "the distance between the ports is fairly small."
    const MIN_PORT_SPACING = 8;
    const edgeToB = (layout.edges ?? []).find((e) => e.id === 'L_A2_B_0');
    const rawBPts = (edgeToB as { points?: { x: number; y: number }[] }).points ?? [];
    const bPts = dedupeConsecutive(rawBPts);
    // Face direction, not just axis — two vertical first segments going
    // in OPPOSITE directions (one N, one S) are on distinct faces, so
    // the Kandinsky δ_s rule doesn't apply.
    type FaceDir = 'N' | 'S' | 'E' | 'W' | 'none';
    const firstFaceDir = (pp: { x: number; y: number }[]): FaceDir => {
      for (let i = 0; i + 1 < pp.length; i++) {
        const dx = pp[i + 1].x - pp[i].x;
        const dy = pp[i + 1].y - pp[i].y;
        if (Math.abs(dx) < EPS && Math.abs(dy) < EPS) {
          continue;
        }
        if (Math.abs(dx) < EPS) {
          return dy > 0 ? 'S' : 'N';
        }
        return dx > 0 ? 'E' : 'W';
      }
      return 'none';
    };
    const eDir = firstFaceDir(pts);
    const bDir = firstFaceDir(bPts);
    if (eDir === bDir && eDir !== 'none') {
      const isVerticalFace = eDir === 'N' || eDir === 'S';
      const sep = isVerticalFace ? Math.abs(pts[0].x - bPts[0].x) : Math.abs(pts[0].y - bPts[0].y);
      expect(sep).toBeGreaterThanOrEqual(MIN_PORT_SPACING - EPS);
    }
  });

  it('Level 2: validateLayout — quality breakdown is within reasonable thresholds', async () => {
    const layout = await runSwimlanes();
    const { breakdown } = validateLayout(layout);
    const totalBends = breakdown.edges.reduce((acc, e) => acc + Math.max(0, e.points - 2), 0);
    const avgBendsPerEdge = breakdown.edgeCount > 0 ? totalBends / breakdown.edgeCount : 0;

    if (DEBUG) {
      console.log('[8_QUERY_PROCESS_2_DDLT] breakdown:', JSON.stringify(breakdown, null, 2));
    }
    expect.soft(breakdown.crossings).toBeLessThanOrEqual(1);
    expect.soft(avgBendsPerEdge).toBeLessThan(5);
    expect.soft(totalBends).toBeLessThanOrEqual(30);
  });
});
