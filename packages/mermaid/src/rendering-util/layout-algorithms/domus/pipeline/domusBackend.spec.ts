/**
 * Unit tests for `partitionDomusValidationIssues` (iter-13 R13 helper).
 *
 * iter-46 refinement: the partition's `edge-intersects-obstacle` suppression
 * was too broad — it silenced ANY segment whose obstacle matched the edge's
 * start/end, regardless of segment index. validateLayout's internal
 * `withinAttachCorridor` guard (L_ATTACH=8) already skips segments whose both
 * endpoints are within 8 units of an attach point, so any edge-intersects-obstacle
 * that reaches the partition is already NOT a tangential first/last
 * artefact. The partition should therefore only suppress the issue when the
 * segment is first (index 0) or last (index points.length-2). Middle-segment
 * crossings — even of the edge's own endpoint nodes — are real routing
 * failures (Siebenhaller edge/vertex disjointness, DOMUS §2 segment-interior
 * invariant).
 */
import { describe, it, expect } from 'vitest';
import type { Issue } from '../../layout-utils/validateLayout.js';
import type { LayoutData } from '../../../types.js';
import { partitionDomusValidationIssues } from './domusBackend.js';

function makeLayout(): LayoutData {
  // life-choices n8→nk polyline snapshot — four points, all x=416.98:
  //   pt[0] = (x, 836.5)  n8.top   (startAttach)
  //   pt[1] = (x, 826.5)  10u above n8
  //   pt[2] = (x, 976.5)  10u below nk
  //   pt[3] = (x, 966.5)  nk.bottom (endAttach)
  // Middle segment (index 1) runs from (x, 826.5) → (x, 976.5), 150u long,
  // passing through n8 (y ∈ [836.5, 881.5]) and nk (y ∈ [921.5, 966.5])
  // interiors.
  return {
    nodes: [
      { id: 'n8', x: 416.98, y: 859, width: 152, height: 45, shape: 'stadium' } as never,
      { id: 'nk', x: 416.98, y: 944, width: 102, height: 45, shape: 'stadium' } as never,
    ],
    edges: [
      {
        id: 'L_n8_nk_0',
        start: 'n8',
        end: 'nk',
        points: [
          { x: 416.98, y: 836.5 },
          { x: 416.98, y: 826.5 },
          { x: 416.98, y: 976.5 },
          { x: 416.98, y: 966.5 },
        ],
      } as never,
    ],
  } as unknown as LayoutData;
}

describe('partitionDomusValidationIssues — iter-46 middle-segment guard', () => {
  it("iter-46: middle-segment edge-intersects-obstacle is REAL even when obstacle is the edge's own endpoint", () => {
    const layout = makeLayout();
    const issues: Issue[] = [
      {
        type: 'edge-intersects-obstacle',
        message: 'L_n8_nk_0 intersects n8',
        edgeId: 'L_n8_nk_0',
        nodeIds: ['n8'],
        details: {
          segmentIndex: 1,
          a: { x: 416.98, y: 826.5 },
          b: { x: 416.98, y: 976.5 },
        },
      } as Issue,
      {
        type: 'edge-intersects-obstacle',
        message: 'L_n8_nk_0 intersects nk',
        edgeId: 'L_n8_nk_0',
        nodeIds: ['nk'],
        details: {
          segmentIndex: 1,
          a: { x: 416.98, y: 826.5 },
          b: { x: 416.98, y: 976.5 },
        },
      } as Issue,
    ];

    const { real, conventional } = partitionDomusValidationIssues(issues, layout);

    // iter-46 target: middle-segment crossings (segmentIndex > 0 and !== last)
    // MUST appear in `real`. Pre-iter-46 partition placed both in
    // `conventional`, silencing a real routing bug.
    expect(real).toHaveLength(2);
    expect(conventional).toHaveLength(0);
    expect(real.map((i) => i.nodeIds?.[0]).sort()).toEqual(['n8', 'nk']);
  });

  it('first-segment edge-intersects-obstacle against own start stays CONVENTIONAL (paint-clip artefact)', () => {
    const layout = makeLayout();
    const issues: Issue[] = [
      {
        type: 'edge-intersects-obstacle',
        message: 'L_n8_nk_0 intersects n8 (first-segment tangential)',
        edgeId: 'L_n8_nk_0',
        nodeIds: ['n8'],
        details: {
          segmentIndex: 0, // first segment
          a: { x: 416.98, y: 836.5 },
          b: { x: 416.98, y: 826.5 },
        },
      } as Issue,
    ];

    const { real, conventional } = partitionDomusValidationIssues(issues, layout);
    expect(conventional).toHaveLength(1);
    expect(real).toHaveLength(0);
  });

  it('last-segment edge-intersects-obstacle against own end stays CONVENTIONAL (paint-clip artefact)', () => {
    const layout = makeLayout();
    const issues: Issue[] = [
      {
        type: 'edge-intersects-obstacle',
        message: 'L_n8_nk_0 intersects nk (last-segment tangential)',
        edgeId: 'L_n8_nk_0',
        nodeIds: ['nk'],
        details: {
          segmentIndex: 2, // last segment (points.length - 2 = 4 - 2)
          a: { x: 416.98, y: 976.5 },
          b: { x: 416.98, y: 966.5 },
        },
      } as Issue,
    ];

    const { real, conventional } = partitionDomusValidationIssues(issues, layout);
    expect(conventional).toHaveLength(1);
    expect(real).toHaveLength(0);
  });

  it('edge-endpoint-inside-node behaviour is unchanged by iter-46 (no segmentIndex on that issue type)', () => {
    const layout = makeLayout();
    const issues: Issue[] = [
      {
        type: 'edge-endpoint-inside-node',
        message: 'L_n8_nk_0 endpoint inside n8',
        edgeId: 'L_n8_nk_0',
        nodeIds: ['n8'],
      } as Issue,
    ];
    const { real, conventional } = partitionDomusValidationIssues(issues, layout);
    expect(conventional).toHaveLength(1);
    expect(real).toHaveLength(0);
  });

  it('middle-segment obstacle that is NOT an endpoint still classified REAL (unchanged)', () => {
    const layout = makeLayout();
    const issues: Issue[] = [
      {
        type: 'edge-intersects-obstacle',
        message: 'L_n8_nk_0 intersects third-party nq',
        edgeId: 'L_n8_nk_0',
        nodeIds: ['nq'],
        details: {
          segmentIndex: 1,
          a: { x: 416.98, y: 826.5 },
          b: { x: 416.98, y: 976.5 },
        },
      } as Issue,
    ];
    const { real, conventional } = partitionDomusValidationIssues(issues, layout);
    expect(real).toHaveLength(1);
    expect(conventional).toHaveLength(0);
  });
});
