/**
 * DDLT spec for the DOMUS layout of life-choices.mmd — iter-45 baseline.
 *
 * Fixture: flat (no-cluster) TB decision tree with 22 nodes, 24 edges, no
 * clusters or self-loops, one convergence node (`ne`) at the bottom.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import type { LayoutData } from '../../types.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { partitionDomusValidationIssues } from './pipeline/validationIssuePartition.js';
import { loadDdltFixture } from '../ddlt/loadDdltFixture.js';

const FIXTURE_NAME = 'life-choices';

describe(`Domus DDLT — ${FIXTURE_NAME}.mmd`, () => {
  let layout: LayoutData;

  beforeAll(async () => {
    layout = await loadDdltFixture(FIXTURE_NAME);
  });

  it('Level 1: validateLayout — produces a valid orthogonal layout', { timeout: 30_000 }, () => {
    const result = validateLayout(layout);
    // iter-13 partition: DOMUS uses center-endpoint polyline convention; paint-time
    // intersectRect clips to node boundary. validateLayout runs pre-paint and
    // flags center-endpoint segments crossing the edge's own start/end as
    // "conventional" (not real routing defects). Assert against REAL issues only.
    const partitioned = partitionDomusValidationIssues(result.issues, layout);
    // eslint-disable-next-line no-console
    console.log(
      '[LIFE_CHOICES_BASELINE]',
      'real=',
      JSON.stringify(partitioned.real),
      'conventional_count=',
      partitioned.conventional.length
    );
    expect(partitioned.real).toEqual([]);
  });

  // iter-46: explicit canary for the n8→nk middle-segment bug. DOMUS emits a
  // polyline that exits n8's top (N) and enters nk's bottom (S) even though
  // n8 is above nk on screen — the middle segment then runs 150u straight
  // down through both endpoint-node interiors. validateLayout catches both
  // crossings as `edge-intersects-obstacle` at segmentIndex 1, but the pre-
  // iter-46 partition silenced them because the obstacle IDs match the
  // edge's own start/end. iter-46 tightens the partition to require the
  // segment be first or last (index 0 or len-2) for that suppression to
  // apply. Middle-segment crossings of own-endpoint nodes now surface.
  it(
    'Level 1 (iter-46 canary): no middle-segment crosses through own-endpoint nodes',
    { timeout: 30_000 },
    () => {
      const result = validateLayout(layout);
      const partitioned = partitionDomusValidationIssues(result.issues, layout);
      const middleSelfCrossings = partitioned.real.filter(
        (iss) =>
          iss.type === 'edge-intersects-obstacle' &&
          iss.details?.segmentIndex != null &&
          (iss.details.segmentIndex as number) > 0 &&
          iss.edgeId != null &&
          Array.isArray(iss.nodeIds) &&
          iss.nodeIds.some((nid) => {
            const edge = layout.edges.find((e) => String(e.id) === String(iss.edgeId));
            const lastIdx = (edge?.points?.length ?? 0) - 2;
            return (
              iss.details?.segmentIndex !== lastIdx &&
              (String(edge?.start) === nid || String(edge?.end) === nid)
            );
          })
      );
      expect(middleSelfCrossings).toEqual([]);
    }
  );

  // iter-47: the DOMUS-native drawability phase places vertical-chain nodes
  // (nl, n4, no, n6, ne — all connected by D-labeled edges) in one shared
  // Gx equivalence class at x=667.406, paper-faithful per DOMUS §3 Theorem 2.
  // The post-gate nudger chain (minGap=50 nudgeConnectedPairsForMinGap)
  // then shifts n4 5u LEFT to open a gap with sibling `nr` (at x=908), and
  // similarly shifts `np` and `n5` within the left-column chain. The 5u
  // offset produces visible horizontal jogs in the rendered edges.
  // This canary asserts same-column stacks are actually aligned.
  it(
    'Level 1 (iter-47 canary): vertical-chain siblings share one x-coord',
    { timeout: 30_000 },
    () => {
      const byId = new Map<string, { x: number; y: number }>();
      for (const n of layout.nodes ?? []) {
        if (
          !(n as { isGroup?: boolean }).isGroup &&
          !(n as { isEdgeLabel?: boolean }).isEdgeLabel
        ) {
          byId.set(String(n.id), { x: (n as { x: number }).x, y: (n as { y: number }).y });
        }
      }
      const rightChain = ['nl', 'n4', 'no', 'n6', 'ne'].map((id) => byId.get(id)!.x);
      const rightSpread = Math.max(...rightChain) - Math.min(...rightChain);
      const centerChain = ['nv', 'np'].map((id) => byId.get(id)!.x);
      const centerSpread = Math.max(...centerChain) - Math.min(...centerChain);
      expect(rightSpread).toBeLessThanOrEqual(1.0);
      expect(centerSpread).toBeLessThanOrEqual(1.0);
    }
  );

  it('Level 1: no micro-segments (min segment length >= 4)', { timeout: 30_000 }, () => {
    let minSegLen = Infinity;
    for (const edge of layout.edges ?? []) {
      const pts = edge.points;
      if (!pts || pts.length < 2) {
        continue;
      }
      for (let i = 0; i < pts.length - 1; i++) {
        const len = Math.abs(pts[i].x - pts[i + 1].x) + Math.abs(pts[i].y - pts[i + 1].y);
        if (len > 0 && len < minSegLen) {
          minSegLen = len;
        }
      }
    }
    expect(Number.isFinite(minSegLen) ? minSegLen : 0).toBeGreaterThanOrEqual(4);
  });

  it('Level 2: validateLayout — baseline breakdown', { timeout: 30_000 }, () => {
    const { breakdown } = validateLayout(layout);
    const totalBends = breakdown.edges.reduce((acc, e) => acc + Math.max(0, e.points - 2), 0);
    // eslint-disable-next-line no-console
    console.log('[LIFE_CHOICES_BASELINE]', 'breakdown=', JSON.stringify(breakdown));
    expect(breakdown).toBeDefined();
    expect.soft(totalBends).toBeLessThanOrEqual(24);
    expect.soft(breakdown.crossings).toBeLessThanOrEqual(1);
  });
});
