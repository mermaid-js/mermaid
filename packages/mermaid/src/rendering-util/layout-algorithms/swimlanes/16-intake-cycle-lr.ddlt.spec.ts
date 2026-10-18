/**
 * DDLT spec for the swimlanes layout of 16-intake-cycle-lr.mmd.
 *
 * Provenance: copied from e2e/platform/dev-diagrams/tmp-v12.0.0-faulty-diags/swimlanes-intake.mmd
 * (v12.0.0 faulty-diagram triage). Two lanes (Intake, Review), LR direction,
 * one feedback cycle: task → decision → fix → task. Uses look=handDrawn,
 * htmlLabels=false and flowchart.minNodeWidth=200, so every content node is
 * ~225–263u wide.
 *
 * Observed in the browser (2026-09-07): SWIMLANE_VALIDATE edge-node-overlap,
 * segment 1 passes through node "fix" — the start → task edge runs straight
 * through the `fix` node, which is placed between `start` and `task` in the
 * Intake lane.
 *
 * Sizes fixture: e2e/platform/dev-diagrams/layout-tests/swimlanes/16-intake-cycle-lr.sizes.json
 */
import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../types.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { loadDdltFixture } from '../ddlt/loadDdltFixture.js';

const FIXTURE_ID = 'swimlanes/16-intake-cycle-lr';

async function runIntakeCycleSwimlanes(): Promise<LayoutData> {
  return await loadDdltFixture(FIXTURE_ID, { backendId: 'swimlanes' });
}

describe('Swimlanes DDLT — 16-intake-cycle-lr.mmd', () => {
  it('Level 1: validateLayout — produces a valid orthogonal layout', async () => {
    const layout = await runIntakeCycleSwimlanes();
    const result = validateLayout(layout);
    if (!result.ok) {
      console.log(
        '[INTAKE_CYCLE_DDLT] validateLayout issues:',
        JSON.stringify(result.issues, null, 2)
      );
    }
    console.log(
      '[INTAKE_CYCLE_DDLT] score:',
      result.score,
      JSON.stringify(
        { crossings: result.breakdown.crossings, edges: result.breakdown.edges },
        null,
        0
      )
    );
    console.log(
      '[INTAKE_CYCLE_DDLT] nodes:',
      JSON.stringify(
        layout.nodes.map((n) => ({ id: n.id, x: n.x, y: n.y, w: n.width, h: n.height })),
        null,
        0
      )
    );
    console.log(
      '[INTAKE_CYCLE_DDLT] edges:',
      JSON.stringify(
        (layout.edges ?? []).map((e) => ({ id: e.id, points: (e as { points?: unknown }).points })),
        null,
        0
      )
    );
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('Level 1: the start → task edge does not pass through node "fix"', async () => {
    // Regression pin for the browser-observed symptom: with the cycle
    // task → decision → fix → task, `fix` ended up placed between `start`
    // and `task` in the Intake lane and the straight start → task edge
    // ran through its interior.
    const layout = await runIntakeCycleSwimlanes();
    const result = validateLayout(layout);
    const fixOverlaps = result.issues.filter(
      (issue) =>
        issue.type === 'edge-intersects-obstacle' &&
        Array.isArray(issue.nodeIds) &&
        issue.nodeIds.includes('fix')
    );
    if (fixOverlaps.length > 0) {
      console.log('[INTAKE_CYCLE_DDLT] fix overlaps:', JSON.stringify(fixOverlaps, null, 2));
    }
    expect(fixOverlaps).toEqual([]);
  });
});
