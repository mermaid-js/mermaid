// cspell:ignore Eiglsperger Kandinsky
/**
 * DDLT spec for the swimlanes layout of hexagons.mmd.
 *
 * The fixture is a `swimlane LR` chain `A → Sys1 → B → C → … → I` that
 * zig-zags across three lanes (X1/X2/X3). Node B (a `{{…}}` hexagon) lives in
 * lane X1, while BOTH its predecessor Sys1 (lane X3) and its successor C
 * (lane X2) sit below it — so the router's natural side choice puts the
 * INCOMING edge (Sys1→B) and the OUTGOING edge (B→C) on the same side
 * (B.bottom).
 *
 * Before the fix, the router's port distribution grouped ports by
 * (node, side, ROLE), so the incoming and outgoing groups each independently
 * centered on B.bottom → both edges landed at the face center (1.17px apart,
 * tripping `edge-shared-attachment-point`) and B→C then jogged sideways
 * hugging B's bottom border to dodge Sys1→B's final approach
 * (`edge-border-hugging`).
 *
 * Fix: extend the Step 6.2b "bimodal in/out de-collision" pass — which
 * relocates a contested out-edge to a free adjacent side — from diamond-only
 * to also cover degree-(1,1) pass-through vertices of any shape (exactly one
 * in-edge and one out-edge sharing a side, like B). Higher-degree non-diamond
 * nodes stay excluded so the relocation cannot disturb a sibling edge's ports.
 * Paper backing (NotebookLM `Papers`, Eiglsperger "Orthogonal Graph Drawing
 * with Constraints", diss.pdf src `0fb2d84f`): §3.1 BIMODAL constraint —
 * incoming/outgoing edges occupy separate consecutive intervals, "in practice
 * … placed on opposite sides"; and the bend count — relocating to a free
 * adjacent side adds ≤1 bend (Lemma 5.3 "no pin left issue") vs. 2 bends for an
 * off-center same-side pin (Lemma 5.2 "straight-line edge assignment issue").
 *
 * Structure mirrors `simple-2.ddlt.spec.ts` — canonical DDLT pattern.
 */
import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../types.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { loadDdltFixture } from '../ddlt/loadDdltFixture.js';

const FIXTURE_ID = 'swimlanes/hexagons';

async function runSwimlanes(): Promise<LayoutData> {
  return await loadDdltFixture(FIXTURE_ID, { backendId: 'swimlanes' });
}

describe('Swimlanes DDLT — hexagons.mmd', () => {
  it('Level 1: validateLayout — produces a valid orthogonal layout', async () => {
    const layout = await runSwimlanes();
    const result = validateLayout(layout);
    if (!result.ok) {
      console.log('[HEXAGONS_DDLT] validateLayout issues:', JSON.stringify(result.issues, null, 2));
    }
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('Level 1: B does not share an attachment point between its in- and out-edge (BIMODAL)', async () => {
    // Eiglsperger BIMODAL constraint (diss.pdf §3.1, src 0fb2d84f): a vertex's
    // incoming and outgoing edges must occupy separate consecutive intervals.
    // Sys1→B (incoming) and B→C (outgoing) both want B.bottom; without the
    // bimodal de-collision they collapse to the same center pin.
    const layout = await runSwimlanes();
    const result = validateLayout(layout);
    const sharedAtB = result.issues.filter(
      (issue) =>
        issue.type === 'edge-shared-attachment-point' &&
        Array.isArray(issue.nodeIds) &&
        issue.nodeIds.includes('B')
    );
    if (sharedAtB.length > 0) {
      console.log('[HEXAGONS_DDLT] shared attachment on B:', JSON.stringify(sharedAtB, null, 2));
    }
    expect(sharedAtB).toEqual([]);
  });

  it("Level 1: B→C does not hug B's border (no off-center detour notch)", async () => {
    // The border-hug is the downstream symptom of the shared center pin: B→C
    // jogs left along B.bottom to clear Sys1→B's approach. Relocating B→C to a
    // free adjacent side removes the contention and the hug.
    const layout = await runSwimlanes();
    const result = validateLayout(layout);
    const hugOnB = result.issues.filter(
      (issue) =>
        issue.type === 'edge-border-hugging' &&
        (issue.edgeId === 'L_B_C_0' ||
          (Array.isArray(issue.nodeIds) && issue.nodeIds.includes('B')))
    );
    if (hugOnB.length > 0) {
      console.log('[HEXAGONS_DDLT] border-hug on B:', JSON.stringify(hugOnB, null, 2));
    }
    expect(hugOnB).toEqual([]);
  });
});
