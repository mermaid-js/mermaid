import { describe, expect, it } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { postProcessSwimlaneLayout } from '../postProcessing.js';

interface PointLite {
  x: number;
  y: number;
}

interface RectLite {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const node = (
  id: string,
  x: number,
  y: number,
  width = 40,
  height = 40,
  extra: Record<string, unknown> = {}
): any => ({ id, x, y, width, height, isGroup: false, ...extra });

const edge = (
  id: string,
  start: string | undefined,
  end: string | undefined,
  points: PointLite[],
  extra: Record<string, unknown> = {}
): any => ({ id, start, end, type: 'arrow', points, ...extra });

const rectFor = (n: any): RectLite => ({
  left: n.x - n.width / 2,
  right: n.x + n.width / 2,
  top: n.y - n.height / 2,
  bottom: n.y + n.height / 2,
});

const segmentHitsRectInterior = (a: PointLite, b: PointLite, r: RectLite): boolean => {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  return maxX > r.left + 1 && minX < r.right - 1 && maxY > r.top + 1 && minY < r.bottom - 1;
};

const edgeHitsNode = (points: PointLite[], n: any): boolean => {
  const rect = rectFor(n);
  for (let i = 0; i < points.length - 1; i++) {
    if (segmentHitsRectInterior(points[i], points[i + 1], rect)) {
      return true;
    }
  }
  return false;
};

const sameAxisOverlapLength = (a: PointLite, b: PointLite, c: PointLite, d: PointLite): number => {
  if (Math.abs(a.x - b.x) < 1e-3 && Math.abs(c.x - d.x) < 1e-3 && Math.abs(a.x - c.x) < 1e-3) {
    return Math.max(
      0,
      Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y)) -
        Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y))
    );
  }
  if (Math.abs(a.y - b.y) < 1e-3 && Math.abs(c.y - d.y) < 1e-3 && Math.abs(a.y - c.y) < 1e-3) {
    return Math.max(
      0,
      Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) -
        Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x))
    );
  }
  return 0;
};

describe('postProcessSwimlaneLayout', () => {
  // Skipped: this covered the generic obstacle-nudging reroute pass
  // (direction/obstacleNudging.ts), removed in the swimlane size-reduction
  // refactor. The remaining post-passes + the router handle real diagrams
  // (validated by the swimlanes DDLT sweep). Restore if obstacle-nudging
  // is reintroduced.
  it.skip('continues reroute scanning against current edge points after each fix', () => {
    const blockerA = node('X', 100, 0);
    const blockerB = node('Y', 200, 0);
    const layout: LayoutData = {
      nodes: [node('A', 0, 0), node('B', 300, 0), blockerA, blockerB],
      edges: [
        edge('A_B', 'A', 'B', [
          { x: 20, y: 0 },
          { x: 280, y: 0 },
        ]),
      ],
      config: {} as any,
    };

    postProcessSwimlaneLayout(layout, 'TB');

    const points = (layout.edges[0] as any).points as PointLite[];
    expect(edgeHitsNode(points, blockerA)).toBe(false);
    expect(edgeHitsNode(points, blockerB)).toBe(false);
  });

  it('can nudge a labelled edge off a shared interior track and re-anchor its label', () => {
    const layout: LayoutData = {
      nodes: [
        { id: 'lane', x: 50, y: 50, width: 220, height: 180, isGroup: true } as any,
        node('A', 0, 0),
        node('B', 100, 100),
        node('edge-label-A-B', 0, 0, 70, 10, { isEdgeLabel: true }),
      ],
      edges: [
        edge(
          'A_B',
          'A',
          'B',
          [
            { x: 20, y: 0 },
            { x: 50, y: 0 },
            { x: 50, y: 100 },
            { x: 80, y: 100 },
          ],
          { labelNodeId: 'edge-label-A-B' }
        ),
        edge('foreign', undefined, undefined, [
          { x: 50, y: 0 },
          { x: 50, y: 100 },
        ]),
      ],
      config: {} as any,
    };

    postProcessSwimlaneLayout(layout, 'TB');

    const labelled = layout.edges.find((e) => e.id === 'A_B') as any;
    const foreign = layout.edges.find((e) => e.id === 'foreign') as any;
    const label = layout.nodes.find((n) => n.id === 'edge-label-A-B') as any;
    const labelledInterior = labelled.points.find(
      (_point: PointLite, index: number, points: PointLite[]) =>
        index > 0 &&
        index < points.length - 1 &&
        Math.abs(points[index].x - points[index + 1]?.x) < 1e-3
    );

    let maxOverlap = 0;
    for (let i = 0; i < labelled.points.length - 1; i++) {
      for (let j = 0; j < foreign.points.length - 1; j++) {
        maxOverlap = Math.max(
          maxOverlap,
          sameAxisOverlapLength(
            labelled.points[i],
            labelled.points[i + 1],
            foreign.points[j],
            foreign.points[j + 1]
          )
        );
      }
    }

    expect(maxOverlap).toBeLessThan(8);
    expect(labelledInterior).toBeDefined();
    expect(label.x).toBeCloseTo(labelledInterior.x, 6);
  });
});
