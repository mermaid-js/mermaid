/**
 * DDLT spec for R4/A4 — SAT position constraints enforce flowchart direction.
 *
 * Exercises the DOMUS-native placement path (`runRP1OrthogonalPipeline` with
 * `useExistingPositions: false`) — the same path the browser uses via
 * `domus/index.ts:renderPreAdjustLayout` — and asserts that for a
 * `flowchart TD`, children are below parents after DOMUS places them.
 *
 * The fail-first failure mode (iter-3 baseline): DOMUS's `preferVertical: true`
 * is a soft bias only (hard clauses at `satEncoding.ts:348-359` are commented
 * out). The SAT solver is free to pick any orientation, so the resulting
 * layout can easily violate TB. The production path (`domus/index.ts:192-239`)
 * compensates via post-hoc `mirrorLeafNodes` or BFS fallback — but that's R4:
 * a band-aid, not a paper-backed shape-phase constraint.
 *
 * Fix (A4): for `direction='TB'`, emit `above(from, to)` in
 * `DomusConstraints.positionConstraints` for the FAS-reduced acyclic subset
 * of edges (edges that do NOT belong to any non-trivial SCC). Siebenhaller
 * `21f7ca55` §planarization; DOMUS `6784b3d1` §5.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import type { LayoutData, Node, NonClusterNode } from '../../types.js';
import { Diagram } from '../../../Diagram.js';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { preprocessDiagram } from '../../../preprocess.js';
import { runRP1OrthogonalPipeline } from './rp1Pipeline.js';
import { setLogLevel } from '../../../logger.js';
import { buildDirectionPositionConstraints } from './pipeline/directionConstraints.js';

// Fixed node sizes (avoid DOM measurement). Small square boxes keep the test
// deterministic and independent of label rendering.
const NODE_WIDTH = 60;
const NODE_HEIGHT = 40;

async function parseAndSize(diagramText: string): Promise<LayoutData> {
  const { code } = preprocessDiagram(diagramText);
  const diagram = await Diagram.fromText(code);
  const layout = (diagram.db as { getData: () => LayoutData }).getData();
  layout.layoutAlgorithm = 'domus';
  // Propagate direction into LayoutData the same way the production renderer
  // does (flowRenderer-v3-unified.ts:40,49). A4's constraint builder reads
  // this field; tests that bypass the flowRenderer must reproduce the
  // enrichment themselves.
  const dirFromDb = (diagram.db as { getDirection?: () => string }).getDirection?.();
  if (dirFromDb) {
    (layout as { direction?: string }).direction = String(dirFromDb).trim();
  }
  for (const node of layout.nodes ?? []) {
    if (node.isGroup) {
      continue;
    }
    node.width = NODE_WIDTH;
    node.height = NODE_HEIGHT;
  }
  return layout;
}

function nonLabelEdges(layout: LayoutData) {
  return (layout.edges ?? []).filter((e) => {
    const s = String(e.start ?? '');
    const t = String(e.end ?? '');
    return !s.startsWith('edge-label-') && !t.startsWith('edge-label-');
  });
}

function nodeById(layout: LayoutData): Map<string, Node> {
  const m = new Map<string, Node>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null) {
      m.set(String(n.id), n);
    }
  }
  return m;
}

describe('Domus DDLT — A4: SAT position constraints enforce flowchart direction', () => {
  beforeAll(() => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');
    addDiagrams();
  });

  it('direction is propagated into LayoutData by the production renderer pattern', async () => {
    // Note: FlowDB.getData() does not include direction (see flowDb.ts).
    // The production flowRenderer (flowRenderer-v3-unified.ts:40,49) reads
    // diag.db.getDirection() and sets data4Layout.direction. This spec's
    // parseAndSize helper reproduces that enrichment. A2 (direction in
    // getData() return) was considered but reverted in iter-3 because it
    // changed the `preferAxisForVerticalFlow` default for existing callers
    // like company-simp.ddlt.spec.ts and caused a USCompany overlap
    // regression.
    const layout = await parseAndSize('flowchart TD\n  A --> B\n');
    expect((layout as { direction?: string }).direction).toBe('TB');
  });

  it('A4: directionConstraints respects the source/target distinctness quota for TD', async () => {
    const layout = await parseAndSize('flowchart TD\n  A --> B\n  B --> C\n  C --> D\n  B --> E\n');
    const constraints = buildDirectionPositionConstraints(layout);
    // B has 2 outgoing edges (B->C, B->E); DOMUS vertex-label-distinctness
    // forbids both from sharing a label, so only the first (B->C) gets a
    // direction constraint. B->E is left unconstrained.
    expect(constraints.length).toBe(3);
    // Note: TB maps to `below` (source is below target in the encoder's
    // inverted semantic), not `above`. See directionConstraints.relationFor().
    expect(constraints.every((c) => c.relation === 'below')).toBe(true);
    expect(new Set(constraints.map((c) => `${c.from}->${c.to}`))).toEqual(
      new Set(['A->B', 'B->C', 'C->D'])
    );
  });

  it(
    'A4: for flowchart TD, DOMUS-native placement preserves parent-above-child on the backbone',
    { timeout: 30_000 },
    async () => {
      // 4-node chain A->B->C->D: every vertex has out-degree ≤ 1, so every
      // edge fits the vertex-label-distinctness quota and all constraints
      // apply. This is the iter-3 R4 regression gate — the case the plan
      // calls out when it says "for flowchart direction='TB', emit
      // above(from, to) in positionConstraints for every layering edge".
      const diagramText = 'flowchart TD\n  A --> B\n  B --> C\n  C --> D\n';
      const layout = await parseAndSize(diagramText);
      expect((layout as { direction?: string }).direction).toBe('TB');

      runRP1OrthogonalPipeline(layout, {
        spacing: 10,
        routingBackend: 'domus',
        useExistingPositions: false,
        // A4 is opt-in (default off, paper-faithful). These specs explicitly
        // assert direction-respecting placement and must enable it.
        respectFlowDirection: true,
      });

      const byId = nodeById(layout);
      const edges = nonLabelEdges(layout);

      const coords = [...byId.values()]
        .filter((n) => !n.isGroup)
        .map((n) => `${n.id}=(${n.x},${n.y})`)
        .join(' ');
      const violations: string[] = [];
      for (const e of edges) {
        const s = byId.get(String(e.start));
        const t = byId.get(String(e.end));
        if (!s || !t) {
          continue;
        }
        const sy = s.y ?? 0;
        const ty = t.y ?? 0;
        if (!(sy < ty)) {
          violations.push(`${String(e.start)}.y=${sy} should be < ${String(e.end)}.y=${ty}`);
        }
      }
      expect(violations, `coords: ${coords}`).toEqual([]);
    }
  );

  it(
    'A4: for flowchart TD with a 3-cycle, back-edge is not over-constrained (does not cause UNSAT)',
    { timeout: 30_000 },
    async () => {
      // A→B→C→A is a 3-cycle. Back-edge (C→A or whichever DFS picks) must
      // NOT have an `above` constraint or the SAT becomes UNSAT. The FAS
      // filter in directionConstraints should exclude all 3 edges (all are
      // in the non-trivial SCC {A,B,C}).
      const diagramText = 'flowchart TD\n  A --> B\n  B --> C\n  C --> A\n  B --> D\n';
      const layout = await parseAndSize(diagramText);

      // Must not throw / must not hang. Only assert the pipeline ran and
      // produced *some* non-degenerate placement.
      runRP1OrthogonalPipeline(layout, {
        spacing: 10,
        routingBackend: 'domus',
        useExistingPositions: false,
        // A4 is opt-in (default off, paper-faithful). These specs explicitly
        // assert direction-respecting placement and must enable it.
        respectFlowDirection: true,
      });

      const byId = nodeById(layout);
      const nonGroup = [...byId.values()].filter((n) => !n.isGroup);
      expect(nonGroup.length).toBeGreaterThan(0);
      const first = nonGroup[0];
      const allAtSamePos = nonGroup.every((n) => n.x === first.x && n.y === first.y);
      expect(allAtSamePos).toBe(false);

      // Acyclic edge B→D must still respect TB (D is NOT in the SCC).
      const B = byId.get('B');
      const D = byId.get('D');
      expect(B).toBeTruthy();
      expect(D).toBeTruthy();
      expect((B!.y ?? 0) < (D!.y ?? 0)).toBe(true);
    }
  );
});
