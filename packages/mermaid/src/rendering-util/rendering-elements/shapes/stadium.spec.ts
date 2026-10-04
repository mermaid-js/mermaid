import { select } from 'd3';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Point } from '../../../types.js';
import type { Node } from '../../types.js';
import { stadium } from './stadium.js';
import type * as ShapeUtils from './util.js';
import { labelHelper, updateNodeBounds } from './util.js';

vi.mock('./util.js', async (importOriginal) => ({
  ...(await importOriginal<typeof ShapeUtils>()),
  labelHelper: vi.fn(),
  updateNodeBounds: vi.fn(),
}));

vi.mock('./handDrawnShapeStyles.js', () => ({
  styles2String: () => ({ labelStyles: '', nodeStyles: '' }),
  userNodeOverrides: () => ({}),
}));

// Keep the input outline visible to the test without depending on roughjs's
// stroke perturbations or jsdom's unimplemented SVG measurement APIs.
vi.mock('roughjs', () => ({
  default: {
    svg: () => ({
      path: (d: string) => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        return path;
      },
    }),
  },
}));

const pointsFromPath = (path: Element): Point[] =>
  [...path.getAttribute('d')!.matchAll(/[LM]([^ ,]+),([^ ]+)/g)].map(([, x, y]) => ({
    x: Number(x),
    y: Number(y),
  }));

// A convex outline contains a point iff it stays on the interior side of every
// edge. This also rejects the overlapping cap construction in the old shape.
const contains = (points: Point[], point: Point) => {
  const crosses = points.map((a, i) => {
    const b = points[(i + 1) % points.length];
    return (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
  });
  return crosses.every((cross) => cross >= -1e-7) || crosses.every((cross) => cross <= 1e-7);
};

beforeEach(() => {
  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  vi.mocked(labelHelper).mockReset();
  vi.mocked(updateNodeBounds).mockImplementation((node, element) => {
    const points = pointsFromPath(element.node()!);
    node.width = Math.max(...points.map((p) => p.x)) - Math.min(...points.map((p) => p.x));
    node.height = Math.max(...points.map((p) => p.y)) - Math.min(...points.map((p) => p.y));
  });
});

const render = async (
  width: number,
  height: number,
  look = 'neo',
  padding = 15,
  extra: Partial<Node> = {}
) => {
  const parent = select(document.querySelector<SVGSVGElement>('svg')!);
  const shapeSvg = parent.append('g');
  vi.mocked(labelHelper).mockResolvedValue({
    shapeSvg,
    bbox: { x: 0, y: 0, width, height } as DOMRect,
    halfPadding: padding / 2,
    label: shapeSvg.append('g'),
  });
  const node = { id: 'stadium', look, padding, x: 0, y: 0, ...extra } as Node;
  await stadium(parent, node);
  return { node, points: pointsFromPath(shapeSvg.select<SVGPathElement>('path').node()!) };
};

describe('stadium geometry', () => {
  it('measures its label once, at the configured wrapping width', async () => {
    const { node } = await render(120, 231, 'neo', 15, { wrappingWidth: 120 });
    expect(labelHelper).toHaveBeenCalledTimes(1);
    // No wrapping exception is passed: the `w >= 1.5h` floor below is what keeps a wrapped
    // label from closing the caps into a circle.
    expect(vi.mocked(labelHelper).mock.calls[0]).toHaveLength(3);
    expect(node.wrappingWidth).toBe(120);
  });

  it.each(['neo', 'classic', 'handDrawn'])('keeps tall %s nodes elongated', async (look) => {
    for (const height of [170, 231, 651]) {
      const { node, points } = await render(120, height, look);
      expect(node.width! / node.height!).toBeGreaterThanOrEqual(1.5 - 1e-7);
      const halfPadding = look === 'neo' ? 20 : 7.5;
      for (const x of [-60 - halfPadding, 60 + halfPadding]) {
        for (const y of [-height / 2, height / 2]) {
          expect(contains(points, { x, y })).toBe(true);
        }
      }
    }
  });

  it('preserves the existing short neo stadium dimensions', async () => {
    const { node } = await render(120, 21);
    expect(node.width).toBeCloseTo(171.22687973, 6);
    expect(node.height).toBe(45);
    expect(labelHelper).toHaveBeenCalledTimes(1);
  });

  it('does not reflow an explicitly sized node', async () => {
    await render(120, 231, 'neo', 15, { width: 120 });
    expect(labelHelper).toHaveBeenCalledTimes(1);
  });

  it.each([0, 0.01, 15])('contains wide label corners with padding %s', async (padding) => {
    const { points } = await render(400, 200, 'classic', padding);
    for (const x of [-200 - padding / 2, 200 + padding / 2]) {
      for (const y of [-100, 100]) {
        expect(contains(points, { x, y })).toBe(true);
      }
    }
  });

  it('keeps edge intersections on the painted outline after translating the node', async () => {
    const { node, points } = await render(120, 651);
    node.x = 300;
    node.y = 500;
    for (const [x, y] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, 2],
    ]) {
      const crossing = node.intersect!({ x: node.x + x * 2000, y: node.y + y * 2000 });
      const local = { x: crossing.x - node.x, y: crossing.y - node.y };
      expect(contains(points, { x: local.x * 0.999, y: local.y * 0.999 })).toBe(true);
      expect(contains(points, { x: local.x * 1.001, y: local.y * 1.001 })).toBe(false);
    }
  });
});
