import { describe, expect, it } from 'vitest';
import type { Edge, LayoutData, Node } from '../../types.js';
import { loadDdltFixture } from '../ddlt/loadDdltFixture.js';
import { validateLayout } from '../layout-utils/validateLayout.js';

interface Point {
  x: number;
  y: number;
}

const EXPECTED_BROWSER_DATA_POINTS = {
  L_A1_G1_0: [
    { x: 36, y: 22.5 },
    { x: 36, y: 246.1875 },
    { x: 476.1734066979359, y: 246.1875 },
  ],
  L_G1_G3_0: [
    { x: 596.1030941979359, y: 246.1875 },
    { x: 877.3300602799754, y: 246.1875 },
  ],
  L_A2_G2_0: [
    { x: 1489.406689530712, y: 22.5 },
    { x: 1489.406689530712, y: 236.1875 },
    { x: 2534.8794586698887, y: 236.1875 },
  ],
  L_G2_G3_0: [
    { x: 2534.8794586698887, y: 246.1875 },
    { x: 1059.1113102799754, y: 246.1875 },
  ],
  L_G3_C1_0: [
    { x: 1059.1113102799754, y: 256.1875 },
    { x: 1111.8705462439584, y: 256.1875 },
    { x: 1111.8705462439584, y: 517.875 },
    { x: 1408.609814530712, y: 517.875 },
  ],
  L_C1_C3_0: [
    { x: 1489.406689530712, y: 550.875 },
    { x: 1489.406689530712, y: 634.27734375 },
    { x: 1962.6485093973452, y: 634.27734375 },
  ],
  L_C3_G2_0: [
    { x: 2078.648509397345, y: 600.77734375 },
    { x: 2078.648509397345, y: 256.1875 },
    { x: 2534.8794586698887, y: 256.1875 },
  ],
  L_G3_C2_0: [
    { x: 968.2206852799754, y: 279.1875 },
    { x: 968.2206852799754, y: 750.07421875 },
    { x: 1388.004345780712, y: 750.07421875 },
  ],
  L_C2_C3_0: [
    { x: 1489.406689530712, y: 717.07421875 },
    { x: 1489.406689530712, y: 654.27734375 },
    { x: 1962.6485093973452, y: 654.27734375 },
  ],
  L_R1_R2_0: [
    { x: 121.25390625, y: 1368.73046875 },
    { x: 467.6109066979359, y: 1368.73046875 },
  ],
  L_R2_G3_0: [
    { x: 536.1382504479359, y: 1346.23046875 },
    { x: 536.1382504479359, y: 357.078125 },
    { x: 961.2206852799754, y: 357.078125 },
    { x: 961.2206852799754, y: 279.1875 },
  ],
} satisfies Record<string, Point[]>;

function rectIntersect(node: Node, point: Point): Point {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const dx = point.x - x;
  const dy = point.y - y;
  let w = (node.width ?? 0) / 2;
  let h = (node.height ?? 0) / 2;

  if (Math.abs(dy) * w > Math.abs(dx) * h) {
    if (dy < 0) {
      h = -h;
    }
    return { x: x + (dy === 0 ? 0 : (h * dx) / dy), y: y + h };
  }

  if (dx < 0) {
    w = -w;
  }
  return { x: x + w, y: y + (dx === 0 ? 0 : (w * dy) / dx) };
}

function isDuplicatePoint(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5;
}

function browserDataPointsForEdge(layout: LayoutData, edge: Edge): Point[] {
  const points = edge.points ?? [];
  const startNode = layout.nodes.find((node) => node.id === edge.start);
  const endNode = layout.nodes.find((node) => node.id === edge.end);

  if (!startNode || !endNode || points.length < 2) {
    return points;
  }

  if (points.length === 2) {
    return [rectIntersect(startNode, points[0]), rectIntersect(endNode, points[1])];
  }

  const innerPoints = points.slice(1, -1);
  const firstInner = innerPoints[0];
  const lastInner = innerPoints[innerPoints.length - 1];
  const first = rectIntersect(startNode, firstInner);
  const last = rectIntersect(endNode, lastInner);

  return [
    ...(isDuplicatePoint(first, firstInner) ? [] : [first]),
    ...innerPoints,
    ...(isDuplicatePoint(last, lastInner) ? [] : [last]),
  ];
}

function expectPointsClose(actual: Point[], expected: Point[], edgeId: string): void {
  expect(actual, `${edgeId}: ${JSON.stringify(actual)}`).toHaveLength(expected.length);
  for (const [i, element] of expected.entries()) {
    expect(actual[i].x).toBeCloseTo(element.x, 6);
    expect(actual[i].y).toBeCloseTo(element.y, 6);
  }
}

function sameAxisOverlap(a1: Point, a2: Point, b1: Point, b2: Point): number {
  const aHorizontal = Math.abs(a1.y - a2.y) < 0.5;
  const bHorizontal = Math.abs(b1.y - b2.y) < 0.5;
  const aVertical = Math.abs(a1.x - a2.x) < 0.5;
  const bVertical = Math.abs(b1.x - b2.x) < 0.5;

  if (aHorizontal && bHorizontal && Math.abs(a1.y - b1.y) < 0.5) {
    return Math.max(
      0,
      Math.min(Math.max(a1.x, a2.x), Math.max(b1.x, b2.x)) -
        Math.max(Math.min(a1.x, a2.x), Math.min(b1.x, b2.x))
    );
  }

  if (aVertical && bVertical && Math.abs(a1.x - b1.x) < 0.5) {
    return Math.max(
      0,
      Math.min(Math.max(a1.y, a2.y), Math.max(b1.y, b2.y)) -
        Math.max(Math.min(a1.y, a2.y), Math.min(b1.y, b2.y))
    );
  }

  return 0;
}

function maxSameAxisOverlap(first: Point[], second: Point[]): number {
  let maxOverlap = 0;
  for (let i = 0; i < first.length - 1; i++) {
    for (let j = 0; j < second.length - 1; j++) {
      maxOverlap = Math.max(
        maxOverlap,
        sameAxisOverlap(first[i], first[i + 1], second[j], second[j + 1])
      );
    }
  }
  return maxOverlap;
}

function isHorizontal(a: Point, b: Point): boolean {
  return Math.abs(a.y - b.y) < 0.5 && Math.abs(a.x - b.x) >= 0.5;
}

function isVertical(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) >= 0.5;
}

function maxBacktrackLength(points: Point[]): number {
  let maxLength = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const mid = points[i];
    const next = points[i + 1];
    if (isHorizontal(prev, mid) && isHorizontal(mid, next)) {
      const firstDx = mid.x - prev.x;
      const secondDx = next.x - mid.x;
      if (firstDx * secondDx < 0) {
        maxLength = Math.max(maxLength, Math.abs(secondDx));
      }
    }
    if (isVertical(prev, mid) && isVertical(mid, next)) {
      const firstDy = mid.y - prev.y;
      const secondDy = next.y - mid.y;
      if (firstDy * secondDy < 0) {
        maxLength = Math.max(maxLength, Math.abs(secondDy));
      }
    }
  }
  return maxLength;
}

function maxRectangularHairpinLength(points: Point[]): number {
  let maxLength = 0;
  for (let i = 0; i < points.length - 5; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const p2 = points[i + 2];
    const p3 = points[i + 3];
    const p4 = points[i + 4];
    const p5 = points[i + 5];

    if (
      isVertical(p0, p1) &&
      isHorizontal(p1, p2) &&
      isVertical(p2, p3) &&
      isHorizontal(p3, p4) &&
      isVertical(p4, p5) &&
      Math.abs(p0.x - p4.x) < 0.5 &&
      Math.abs(p0.x - p5.x) < 0.5 &&
      Math.abs(p2.x - p3.x) < 0.5 &&
      (p2.x - p1.x) * (p4.x - p3.x) < 0
    ) {
      maxLength = Math.max(maxLength, Math.abs(p2.x - p1.x), Math.abs(p4.x - p3.x));
    }

    if (
      isHorizontal(p0, p1) &&
      isVertical(p1, p2) &&
      isHorizontal(p2, p3) &&
      isVertical(p3, p4) &&
      isHorizontal(p4, p5) &&
      Math.abs(p0.y - p4.y) < 0.5 &&
      Math.abs(p0.y - p5.y) < 0.5 &&
      Math.abs(p2.y - p3.y) < 0.5 &&
      (p2.y - p1.y) * (p4.y - p3.y) < 0
    ) {
      maxLength = Math.max(maxLength, Math.abs(p2.y - p1.y), Math.abs(p4.y - p3.y));
    }
  }
  return maxLength;
}

describe('DDLT swimlanes — mermaid-work browser parity', () => {
  it('matches the browser-rendered data-points for every visible edge', async () => {
    const layout = await loadDdltFixture('swimlanes/mermaid-work', { backendId: 'swimlanes' });

    for (const [edgeId, expected] of Object.entries(EXPECTED_BROWSER_DATA_POINTS)) {
      const edge = layout.edges.find((candidate) => candidate.id === edgeId);
      expect(edge, `edge ${edgeId}`).toBeDefined();
      expectPointsClose(browserDataPointsForEdge(layout, edge!), expected, edgeId);
    }
  });

  it('keeps G3→C2 and R2→G3 on separate rendered lanes', async () => {
    const layout = await loadDdltFixture('swimlanes/mermaid-work', { backendId: 'swimlanes' });
    const g3ToC2 = layout.edges.find((candidate) => candidate.id === 'L_G3_C2_0');
    const r2ToG3 = layout.edges.find((candidate) => candidate.id === 'L_R2_G3_0');

    expect(g3ToC2).toBeDefined();
    expect(r2ToG3).toBeDefined();
    expect(
      maxSameAxisOverlap(
        browserDataPointsForEdge(layout, g3ToC2!),
        browserDataPointsForEdge(layout, r2ToG3!)
      )
    ).toBeLessThan(0.5);
  });

  it('keeps the separated G3 terminal routes free of rendered spikes and hairpins', async () => {
    const layout = await loadDdltFixture('swimlanes/mermaid-work', { backendId: 'swimlanes' });
    const g3ToC2 = layout.edges.find((candidate) => candidate.id === 'L_G3_C2_0');
    const r2ToG3 = layout.edges.find((candidate) => candidate.id === 'L_R2_G3_0');

    expect(g3ToC2).toBeDefined();
    expect(r2ToG3).toBeDefined();

    const g3ToC2Points = browserDataPointsForEdge(layout, g3ToC2!);
    const r2ToG3Points = browserDataPointsForEdge(layout, r2ToG3!);

    expect(maxBacktrackLength(r2ToG3Points)).toBeLessThan(0.5);
    expect(maxRectangularHairpinLength(g3ToC2Points)).toBeLessThan(0.5);
  });

  it('records the valid validateLayout baseline', async () => {
    const layout = await loadDdltFixture('swimlanes/mermaid-work', { backendId: 'swimlanes' });
    const result = validateLayout(layout);

    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.score).toBe(990);
    expect(result.breakdown.crossings).toBe(0);
    expect(result.breakdown.totalPoints).toBe(32);
    expect(result.breakdown.totalBendPenalty).toBe(10);
    expect(result.breakdown.crossingPenalty).toBe(0);
  });
});
