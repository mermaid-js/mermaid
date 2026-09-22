import { describe, it, expect } from 'vitest';
import { routeEdgesOrthogonal } from '../router.js';
import type { LayoutData } from '../../../../types.js';

const DEBUG = process.env.RAYKOV_DEBUG === 'true';
const debugLog = (...args: unknown[]) => {
  if (DEBUG) {
    console.log(...args);
  }
};

interface Point {
  x: number;
  y: number;
}

interface RectNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

function rectIntersect(node: RectNode, outside: Point): Point | null {
  const cx = node.x;
  const cy = node.y;
  const hw = node.width / 2;
  const hh = node.height / 2;
  const dx = outside.x - cx;
  const dy = outside.y - cy;
  if (dx === 0 && dy === 0) {
    return null;
  }
  const sx = hw > 0 ? Math.abs(dx) / hw : Infinity;
  const sy = hh > 0 ? Math.abs(dy) / hh : Infinity;
  const m = Math.max(sx, sy);
  if (!Number.isFinite(m) || m === 0) {
    return null;
  }
  return { x: cx + dx / m, y: cy + dy / m };
}

interface TestNode extends RectNode {
  id: string;
  isGroup: boolean;
  parentId?: string;
  intersect?: (p: Point) => Point | null;
}

interface TestEdge {
  id: string;
  start: string;
  end: string;
  type: 'normal';
  points?: Point[];
}

interface TestLayout {
  nodes: TestNode[];
  edges: TestEdge[];
  config: Record<string, unknown>;
}

function mkNode(id: string, x: number, y: number, opts?: Partial<TestNode>): TestNode {
  const width = opts?.width ?? 42.11;
  const height = opts?.height ?? 45;
  const base: TestNode = {
    id,
    isGroup: false,
    x,
    y,
    width,
    height,
    intersect: (p: Point) => rectIntersect({ x, y, width, height }, p),
  };
  return { ...base, ...opts };
}

function mkEdge(id: string, start: string, end: string): TestEdge {
  return { id, start, end, type: 'normal' };
}

const EPS = 1e-6;

const iterSegments = (pts: Point[]): [Point, Point][] => {
  const segments: [Point, Point][] = [];
  for (let i = 1; i < pts.length; i++) {
    segments.push([pts[i - 1], pts[i]]);
  }
  return segments;
};

const isVertical = (a: Point, b: Point) => Math.abs(a.x - b.x) < EPS;
const isHorizontal = (a: Point, b: Point) => Math.abs(a.y - b.y) < EPS;

/**
 * Check if a segment passes through a rectangle (not just touches edges)
 */
const segmentIntersectsRect = (
  p1: Point,
  p2: Point,
  rect: { minX: number; minY: number; maxX: number; maxY: number }
): boolean => {
  const margin = 2; // Small tolerance
  const minX = rect.minX + margin;
  const maxX = rect.maxX - margin;
  const minY = rect.minY + margin;
  const maxY = rect.maxY - margin;

  if (isVertical(p1, p2)) {
    // Vertical segment at x = p1.x
    const x = p1.x;
    const yMin = Math.min(p1.y, p2.y);
    const yMax = Math.max(p1.y, p2.y);

    // Check if x is inside rect and segment's y range overlaps rect's y range
    if (x > minX && x < maxX) {
      if (yMin < maxY && yMax > minY) {
        return true;
      }
    }
  } else if (isHorizontal(p1, p2)) {
    // Horizontal segment at y = p1.y
    const y = p1.y;
    const xMin = Math.min(p1.x, p2.x);
    const xMax = Math.max(p1.x, p2.x);

    // Check if y is inside rect and segment's x range overlaps rect's x range
    if (y > minY && y < maxY) {
      if (xMin < maxX && xMax > minX) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Check if any segment of a polyline passes through a node's interior
 */
const polylinePassesThroughNode = (pts: Point[], node: TestNode): boolean => {
  const hw = node.width / 2;
  const hh = node.height / 2;
  const rect = {
    minX: node.x - hw,
    maxX: node.x + hw,
    minY: node.y - hh,
    maxY: node.y + hh,
  };

  for (const [p1, p2] of iterSegments(pts)) {
    if (segmentIntersectsRect(p1, p2, rect)) {
      return true;
    }
  }
  return false;
};

/**
 * Check if the last point of a polyline is on the boundary of the target node
 */
const lastPointOnNodeBoundary = (pts: Point[], node: TestNode, tolerance = 1): boolean => {
  if (pts.length === 0) return false;
  const last = pts[pts.length - 1];
  const hw = node.width / 2;
  const hh = node.height / 2;

  // Check if point is on one of the four sides of the rectangle
  const onLeft =
    Math.abs(last.x - (node.x - hw)) < tolerance &&
    last.y >= node.y - hh - tolerance &&
    last.y <= node.y + hh + tolerance;
  const onRight =
    Math.abs(last.x - (node.x + hw)) < tolerance &&
    last.y >= node.y - hh - tolerance &&
    last.y <= node.y + hh + tolerance;
  const onTop =
    Math.abs(last.y - (node.y - hh)) < tolerance &&
    last.x >= node.x - hw - tolerance &&
    last.x <= node.x + hw + tolerance;
  const onBottom =
    Math.abs(last.y - (node.y + hh)) < tolerance &&
    last.x >= node.x - hw - tolerance &&
    last.x <= node.x + hw + tolerance;

  return onLeft || onRight || onTop || onBottom;
};

describe('Raykov orthogonal router - wide node routing', () => {
  const LOG_PREFIX = '[wide_node_test]';

  const runLayout = (nodes: TestNode[], edges: TestEdge[]) => {
    const data: TestLayout = {
      nodes,
      edges,
      config: {},
    };
    routeEdgesOrthogonal(data as unknown as LayoutData);
    return data;
  };

  it('should route I->K around wide node J (not through it)', () => {
    // This reproduces the issue from knsv3.html
    // J has a very wide label that spans ~300px
    // Layout is TD (top-down), so nodes are arranged vertically
    // I is at the top, J and K are below I
    // I->K should route around J, not through it

    const nodeHeight = 90; // Nodes have some height
    const rowGap = 120; // Gap between rows

    // I at top
    const I = mkNode('I', 150, 0, { width: 50, height: nodeHeight });

    // J below I, but VERY WIDE (simulating long label)
    const J = mkNode('J', 150, rowGap, { width: 300, height: nodeHeight });

    // K below J
    const K = mkNode('K', 150, rowGap * 2, { width: 50, height: nodeHeight });

    const eIJ = mkEdge('eIJ', 'I', 'J');
    const eIK = mkEdge('eIK', 'I', 'K');

    runLayout([I, J, K], [eIJ, eIK]);

    debugLog(LOG_PREFIX, 'I->J points:', JSON.stringify(eIJ.points, null, 2));
    debugLog(LOG_PREFIX, 'I->K points:', JSON.stringify(eIK.points, null, 2));
    debugLog(LOG_PREFIX, 'J node bounds:', {
      x: J.x,
      y: J.y,
      width: J.width,
      height: J.height,
      minX: J.x - J.width / 2,
      maxX: J.x + J.width / 2,
      minY: J.y - J.height / 2,
      maxY: J.y + J.height / 2,
    });

    // I->K should NOT pass through J's interior
    const IKPassesThroughJ = polylinePassesThroughNode(eIK.points!, J);
    expect(IKPassesThroughJ).toBe(false);
  });

  it("should have I->J end point hit J's boundary correctly", () => {
    const nodeHeight = 90;
    const rowGap = 120;

    const I = mkNode('I', 150, 0, { width: 50, height: nodeHeight });
    const J = mkNode('J', 150, rowGap, { width: 300, height: nodeHeight });

    const eIJ = mkEdge('eIJ', 'I', 'J');

    runLayout([I, J], [eIJ]);

    debugLog(LOG_PREFIX, 'I->J points:', JSON.stringify(eIJ.points, null, 2));
    debugLog(LOG_PREFIX, 'J node:', { x: J.x, y: J.y, width: J.width, height: J.height });

    // The last point should be on J's boundary
    const lastOnBoundary = lastPointOnNodeBoundary(eIJ.points!, J);
    expect(lastOnBoundary).toBe(true);
  });

  it('should route edge around wide obstacle in the middle (explicit obstacle)', () => {
    // A simpler test: A at top, B (wide) in middle, C at bottom
    // Edge A->C should route around B

    const A = mkNode('A', 100, 0, { width: 50, height: 50 });
    const B = mkNode('B', 100, 100, { width: 250, height: 50 }); // Wide obstacle
    const C = mkNode('C', 100, 200, { width: 50, height: 50 });

    // Only edge A->C, B is just an obstacle
    const eAC = mkEdge('eAC', 'A', 'C');

    runLayout([A, B, C], [eAC]);

    debugLog(LOG_PREFIX, 'A->C points:', JSON.stringify(eAC.points, null, 2));
    debugLog(LOG_PREFIX, 'B (obstacle) bounds:', {
      minX: B.x - B.width / 2,
      maxX: B.x + B.width / 2,
      minY: B.y - B.height / 2,
      maxY: B.y + B.height / 2,
    });

    // A->C should NOT pass through B's interior
    const ACPassesThroughB = polylinePassesThroughNode(eAC.points!, B);
    expect(ACPassesThroughB).toBe(false);
  });
});
