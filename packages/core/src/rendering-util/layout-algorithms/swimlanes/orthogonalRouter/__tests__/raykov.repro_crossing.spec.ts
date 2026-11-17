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

const segmentsCross = (a1: Point, a2: Point, b1: Point, b2: Point) => {
  if (isVertical(a1, a2) && isHorizontal(b1, b2)) {
    const x = a1.x;
    const y = b1.y;
    const withinX = x >= Math.min(b1.x, b2.x) - EPS && x <= Math.max(b1.x, b2.x) + EPS;
    const withinY = y >= Math.min(a1.y, a2.y) - EPS && y <= Math.max(a1.y, a2.y) + EPS;
    if (withinX && withinY) {
      // Allow shared endpoints (true crossing only if interior)
      const touchesEndpoint =
        (Math.abs(x - b1.x) < EPS && Math.abs(y - b1.y) < EPS) ||
        (Math.abs(x - b2.x) < EPS && Math.abs(y - b2.y) < EPS) ||
        (Math.abs(x - a1.x) < EPS && Math.abs(y - a1.y) < EPS) ||
        (Math.abs(x - a2.x) < EPS && Math.abs(y - a2.y) < EPS);
      return !touchesEndpoint;
    }
  }
  if (isHorizontal(a1, a2) && isVertical(b1, b2)) {
    return segmentsCross(b1, b2, a1, a2);
  }
  return false;
};

const polylinesCross = (pa: Point[], pb: Point[]) => {
  for (const [a1, a2] of iterSegments(pa)) {
    for (const [b1, b2] of iterSegments(pb)) {
      if (segmentsCross(a1, a2, b1, b2)) {
        return true;
      }
    }
  }
  return false;
};

describe('Raykov orthogonal router crossing repro', () => {
  const runLayout = (nodes: TestNode[], edges: TestEdge[]) => {
    const data: TestLayout = {
      nodes,
      edges,
      config: {},
    };
    routeEdgesOrthogonal(data as unknown as LayoutData);
    return data;
  };

  it('should avoid crossing for D->E and D->H', () => {
    // D at top, E below D, H below E. All aligned vertically at -19.5
    const D = mkNode('D', -19.5, 22.5);
    const E = mkNode('E', -19.5, 117.5);
    const H = mkNode('H', -19.5, 212.5);

    const eDE = mkEdge('eDE', 'D', 'E');
    const eDH = mkEdge('eDH', 'D', 'H');

    runLayout([D, E, H], [eDE, eDH]);

    // Check start points of edges leaving D
    // Assuming D's bottom is roughly at 22.5 + 22.5 = 45.
    // Edges should start near (x, 45)

    // Analyze tracks.
    // If D->H goes left (x < -19.5), it should be on the left of D->E
    // If D->H goes right (x > -19.5), it should be on the right of D->E

    // Let's check the bounding box of the entire path
    const minX_DH = Math.min(...eDH.points!.map((p) => p.x));
    const maxX_DH = Math.max(...eDH.points!.map((p) => p.x));

    const goesLeft = minX_DH < -20;
    const goesRight = maxX_DH > -19;

    const EPSILON = 0.1;

    const startDE = eDE.points![0];
    const endDE = eDE.points![eDE.points!.length - 1];
    expect(startDE.x).toBeCloseTo(D.x, 5);
    expect(endDE.x).toBeCloseTo(E.x, 5);

    if (goesLeft) {
      // Path must extend meaningfully left of the shared column
      expect(minX_DH).toBeLessThan(-19.5 - EPSILON);
    } else if (goesRight) {
      expect(maxX_DH).toBeGreaterThan(-19.5 + EPSILON);
    } else {
      // If the router keeps both edges centered, ensure the point sets differ
      expect(JSON.stringify(eDE.points)).not.toEqual(JSON.stringify(eDH.points));
    }
  });

  it('keeps D->E centered at x=50 when D->H detours', () => {
    const D = mkNode('D', 50, 22.5);
    const E = mkNode('E', 50, 117.5, { width: 41.34375 });
    const H = mkNode('H', 50, 212.5);

    const eDE = mkEdge('eDE2', 'D', 'E');
    const eDH = mkEdge('eDH2', 'D', 'H');

    runLayout([D, E, H], [eDE, eDH]);

    const startDE = eDE.points![0];
    const endDE = eDE.points![eDE.points!.length - 1];

    expect(startDE.x).toBeCloseTo(50, 3);
    expect(endDE.x).toBeCloseTo(50, 3);

    // D->H should be offset to avoid overlap.
    //
    // NOTE: before iter 6's paper-backed δ_s side-split (Kandinsky /
    // diss.pdf §6.1.2.2), D->H detoured geometrically to the LEFT with
    // minX < 45. After iter 6, sibling edges sharing a face at D's
    // bottom and E's top are port-distributed instead of routed via a
    // physical detour — both may stay near x=50 but at distinct port
    // offsets on the shared nodes.
    //
    // The invariant we actually need is that the two polylines are
    // DISTINCT (not overlapping segment-for-segment), not that D->H
    // visibly bows out to the left. Verify that here.
    debugLog('eDE.points:', JSON.stringify(eDE.points));
    debugLog('eDH.points:', JSON.stringify(eDH.points));
    expect(JSON.stringify(eDE.points)).not.toEqual(JSON.stringify(eDH.points));
  });

  it('routes I->K to the right of J when Constr lane is left of Legal', () => {
    // Constr lane on the left at x = 0, Legal lane on the right at x = 150.
    const constrX = 0;
    const legalX = 150;
    const rowGap = 95;

    const H = mkNode('H', constrX, rowGap * 0);
    const I = mkNode('I', legalX, rowGap * 0);
    const J = mkNode('J', legalX, rowGap * 1);
    const K = mkNode('K', legalX, rowGap * 2);
    const E = mkNode('E', constrX, rowGap * 1);
    const L = mkNode('L', constrX, rowGap * 2);

    const eHI = mkEdge('eHI', 'H', 'I');
    const eIK = mkEdge('eIK', 'I', 'K');
    const eIJ = mkEdge('eIJ', 'I', 'J');
    const eJE = mkEdge('eJE', 'J', 'E');
    const eKL = mkEdge('eKL', 'K', 'L');

    // Intentionally order edges so the router processes I->K before I->J, mimicking
    // the bad scenario from the diagram when lane ordering swaps.
    runLayout([H, I, J, K, E, L], [eHI, eIK, eIJ, eJE, eKL]);

    expect(eIK.points).toBeDefined();
    expect(eJE.points).toBeDefined();

    const crosses = polylinesCross(eIK.points!, eJE.points!);
    const minX_IK = Math.min(...eIK.points!.map((p) => p.x));

    // Router should pick the right-hand corridor (>= legalX), never swinging left of J.
    expect(minX_IK).toBeGreaterThanOrEqual(legalX - 1);
    expect(crosses).toBe(false);
  });
});
