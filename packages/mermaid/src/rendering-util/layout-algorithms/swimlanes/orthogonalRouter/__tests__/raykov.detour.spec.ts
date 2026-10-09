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
  const width = opts?.width ?? 42;
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

describe('Raykov orthogonal router - detour issue', () => {
  const LOG_PREFIX = '[detour_test]';

  it('should route J→E directly without U-shaped detour', () => {
    // EXACT coordinates from user's rendered diagram:
    // Node E: translate(-139.77734375, 117.5), width=41.34375, height=45
    // Node J: translate(0.78125, 117.5), width=39, height=45
    // Node F: translate(140.55859375, 117.5), width=40.5546875, height=45
    // All three at y=117.5!

    // Lanes (groups) - approximate
    const Constr = mkNode('Constr', -139.77734375, 70, { width: 100, height: 190, isGroup: true });
    const Legal = mkNode('Legal', 0.78125, 70, { width: 100, height: 190, isGroup: true });
    const Fun = mkNode('Fun', 140.55859375, 70, { width: 100, height: 190, isGroup: true });

    // Nodes with EXACT user coordinates
    const H = mkNode('H', -139.77734375, 22.5, { width: 41.34375, height: 45, parentId: 'Constr' });
    const I = mkNode('I', 0.78125, 22.5, { width: 39, height: 45, parentId: 'Legal' });
    const J = mkNode('J', 0.78125, 117.5, { width: 39, height: 45, parentId: 'Legal' });
    const E = mkNode('E', -139.77734375, 117.5, {
      width: 41.34375,
      height: 45,
      parentId: 'Constr',
    });
    const F = mkNode('F', 140.55859375, 117.5, { width: 40.5546875, height: 45, parentId: 'Fun' });

    // Edges - in the order they appear in the flowchart
    const eHI = mkEdge('eHI', 'H', 'I');
    const eIJ = mkEdge('eIJ', 'I', 'J');
    const eJE = mkEdge('eJE', 'J', 'E');
    const eEF = mkEdge('eEF', 'E', 'F');

    const data: TestLayout = {
      nodes: [Constr, Legal, Fun, H, I, J, E, F],
      edges: [eHI, eIJ, eJE, eEF],
      config: {},
    };

    routeEdgesOrthogonal(data as unknown as LayoutData);

    // Check J→E
    expect(eJE.points).toBeDefined();
    const pointsJE = eJE.points!;
    debugLog(LOG_PREFIX, 'J→E points:', JSON.stringify(pointsJE, null, 2));

    const yValuesJE = pointsJE.map((p) => p.y);
    const minYJE = Math.min(...yValuesJE);
    const maxYJE = Math.max(...yValuesJE);
    const yRangeJE = maxYJE - minYJE;
    debugLog(LOG_PREFIX, `J→E Y range: ${minYJE} to ${maxYJE} (range: ${yRangeJE})`);

    // J and E are on the same row (y=117.5), path should be mostly horizontal
    expect(yRangeJE).toBeLessThan(50);

    // Check E→F
    expect(eEF.points).toBeDefined();
    const pointsEF = eEF.points!;
    debugLog(LOG_PREFIX, 'E→F points:', JSON.stringify(pointsEF, null, 2));

    const yValuesEF = pointsEF.map((p) => p.y);
    const minYEF = Math.min(...yValuesEF);
    const maxYEF = Math.max(...yValuesEF);
    const yRangeEF = maxYEF - minYEF;
    debugLog(LOG_PREFIX, `E→F Y range: ${minYEF} to ${maxYEF} (range: ${yRangeEF})`);

    // E and F are on the same row but J is between them - some vertical deviation expected
    // But should route around J efficiently (up or down, not huge detour)
    expect(yRangeEF).toBeLessThan(100);
  });
});
