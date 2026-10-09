import { describe, it, expect } from 'vitest';
import { routeEdgesOrthogonal } from '../router.js';
import type { LayoutData } from '../../../../types.js';

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
  const width = opts?.width ?? 42.1171875;
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

type SegmentOrientation = 'vertical' | 'horizontal';

interface Segment {
  orientation: SegmentOrientation;
  min: number;
  max: number;
  coord: number;
}

const EPS = 1e-4;

function toSegments(points: Point[]): Segment[] {
  const segments: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (Math.abs(p1.x - p2.x) < EPS && Math.abs(p1.y - p2.y) < EPS) {
      continue;
    }
    if (Math.abs(p1.x - p2.x) < EPS) {
      const min = Math.min(p1.y, p2.y);
      const max = Math.max(p1.y, p2.y);
      segments.push({ orientation: 'vertical', min, max, coord: p1.x });
    } else if (Math.abs(p1.y - p2.y) < EPS) {
      const min = Math.min(p1.x, p2.x);
      const max = Math.max(p1.x, p2.x);
      segments.push({ orientation: 'horizontal', min, max, coord: p1.y });
    }
  }
  return segments;
}

function segmentsCross(a: Segment, b: Segment, shared: Point): boolean {
  if (a.orientation === b.orientation) {
    return false;
  }

  const vert = a.orientation === 'vertical' ? a : b;
  const horiz = a.orientation === 'horizontal' ? a : b;

  const withinX = horiz.min - EPS <= vert.coord && vert.coord <= horiz.max + EPS;
  const withinY = vert.min - EPS <= horiz.coord && horiz.coord <= vert.max + EPS;
  if (withinX && withinY) {
    if (Math.abs(vert.coord - shared.x) < EPS && Math.abs(horiz.coord - shared.y) < EPS) {
      return false;
    }
    return true;
  }
  return false;
}

function edgesCross(aPts: Point[], bPts: Point[]): boolean {
  const shared = aPts[0];
  const aSegments = toSegments(aPts);
  const bSegments = toSegments(bPts);
  for (const a of aSegments) {
    for (const b of bSegments) {
      if (segmentsCross(a, b, shared)) {
        return true;
      }
    }
  }
  return false;
}

describe('Raykov orthogonal router crossing regression', () => {
  it('should keep D->E and D->H from crossing', () => {
    const D = mkNode('D', -19.5, 22.5);
    const E = mkNode('E', -19.5, 117.5);
    const H = mkNode('H', -19.5, 212.5);

    const eDE = mkEdge('eDE', 'D', 'E');
    const eDH = mkEdge('eDH', 'D', 'H');

    const data: TestLayout = {
      nodes: [D, E, H],
      edges: [eDE, eDH],
      config: {},
    };

    routeEdgesOrthogonal(data as unknown as LayoutData);

    if (process.env.RAYKOV_DEBUG === 'true') {
      console.log('crossing-test D->E', eDE.points);
      console.log('crossing-test D->H', eDH.points);
    }

    expect(edgesCross(eDE.points ?? [], eDH.points ?? [])).toBe(false);
  });
});
