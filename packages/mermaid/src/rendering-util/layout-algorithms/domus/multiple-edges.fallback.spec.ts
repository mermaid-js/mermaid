/**
 * Regression spec for the cyclic-path placement-failure fallback in
 * `pipeline/domusBackend.ts`.
 *
 * Background:
 * The `multiple-edges.mmd` fixture (4 nodes a/b/c/d, 7 edges including
 * anti-parallel a↔b plus 3 parallel a→b multi-edges plus the 3-cycle
 * a→b→c→a) produces a DOMUS placement-only `success: false` (UNSAT). The
 * runner returns early before `updateNodePositions`, leaving every leaf
 * node with `y === undefined`. Downstream nudgers and the routing-graph
 * fallback then run on a layout where every routed segment collapses to
 * y ≈ 0, producing intersect/share-subpath/port-direction violations.
 *
 * This spec pins the fix: when DOMUS placement fails on the cyclic path,
 * a deterministic fallback (BFS-rank y, lexicographic x within rank) is
 * applied so every leaf node ends with finite x AND y before the routing
 * stage takes over.
 *
 * Single-prefix log filter: `MULTI_FALLBACK_DBG`.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import {
  discoverLayoutTestFixtures,
  parseApplySizesAndLayout,
  type LayoutTestFixture,
} from '../ddlt/index.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { setLogLevel, log } from '../../../logger.js';

describe('Cyclic-path placement-failure fallback (multiple-edges)', () => {
  let fixture: LayoutTestFixture;

  beforeAll(() => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');
    addDiagrams();
    const fx = discoverLayoutTestFixtures().find((f) => f.id === 'multiple-edges');
    if (!fx) {
      throw new Error('multiple-edges fixture not found in DDLT manifest');
    }
    fixture = fx;
  });

  it('every leaf node has a finite y after DOMUS UNSAT on the cyclic path', async () => {
    const layout = await parseApplySizesAndLayout(
      fixture.mmdPath,
      fixture.sizes,
      'domus-orthogonal'
    );

    const undefinedY = (layout.nodes ?? [])
      .filter((n: any) => !n?.isGroup && !n?.isEdgeLabel)
      .filter((n: any) => !Number.isFinite(n.y))
      .map((n: any) => ({ id: n.id, y: n.y, x: n.x }));

    log.debug(
      'MULTI_FALLBACK_DBG: leaf y',
      (layout.nodes ?? [])
        .filter((n: any) => !n?.isGroup && !n?.isEdgeLabel)
        .map((n: any) => ({ id: n.id, x: n.x, y: n.y }))
    );

    expect(
      undefinedY,
      `expected every leaf node to have a finite y, but ${undefinedY.length} did not`
    ).toEqual([]);
  });

  it('every leaf node has a finite x after DOMUS UNSAT on the cyclic path', async () => {
    const layout = await parseApplySizesAndLayout(
      fixture.mmdPath,
      fixture.sizes,
      'domus-orthogonal'
    );

    const undefinedX = (layout.nodes ?? [])
      .filter((n: any) => !n?.isGroup && !n?.isEdgeLabel)
      .filter((n: any) => !Number.isFinite(n.x))
      .map((n: any) => ({ id: n.id, x: n.x, y: n.y }));

    expect(undefinedX).toEqual([]);
  });

  it('keeps all 7 input edges intact through the fallback', async () => {
    const layout = await parseApplySizesAndLayout(
      fixture.mmdPath,
      fixture.sizes,
      'domus-orthogonal'
    );
    const result = validateLayout(layout);
    expect(result.breakdown.edgeCount).toBe(7);
  });
});
