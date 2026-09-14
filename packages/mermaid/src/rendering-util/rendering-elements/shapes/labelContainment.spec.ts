/**
 * Shapes whose outline is not a rectangle have to be sized from the label's height as well
 * as its width, or a tall label leaves the outline. Each of these clipped its label once
 * `flowchart.wrappingWidth` dropped to 120 and labels became narrow columns; the first fix
 * turned wrapping off for them instead, which traded clipping for single-line nodes
 * hundreds of pixels wide.
 */
import { select } from 'd3';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Point } from '../../../types.js';
import type { Node } from '../../types.js';
import { circle } from './circle.js';
import { doublecircle } from './doubleCircle.js';
import { halfRoundedRectangle } from './halfRoundedRectangle.js';
import { curvedTrapezoid } from './curvedTrapezoid.js';
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

/** These outlines are convex, so a point is inside iff it is on one side of every edge. */
const contains = (points: Point[], point: Point) => {
  const crosses = points.map((a, i) => {
    const b = points[(i + 1) % points.length];
    return (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
  });
  return crosses.every((cross) => cross >= -1e-7) || crosses.every((cross) => cross <= 1e-7);
};

/** The label box's corners, which are what a width-only size calculation misses. */
const labelCorners = (width: number, height: number): Point[] =>
  [-1, 1].flatMap((sx) => [-1, 1].map((sy) => ({ x: (sx * width) / 2, y: (sy * height) / 2 })));

beforeEach(() => {
  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  vi.mocked(labelHelper).mockReset();
  vi.mocked(updateNodeBounds).mockImplementation(() => undefined);
});

const setup = (width: number, height: number, look: string, padding: number) => {
  const parent = select(document.querySelector<SVGSVGElement>('svg')!);
  const shapeSvg = parent.append('g');
  vi.mocked(labelHelper).mockResolvedValue({
    shapeSvg,
    bbox: { x: 0, y: 0, width, height } as DOMRect,
    halfPadding: padding / 2,
    label: shapeSvg.append('g'),
  });
  return { parent, shapeSvg };
};

/** A short wide label, a square-ish one, and the tall narrow column a 120px wrap produces. */
const LABEL_BOXES: [string, number, number][] = [
  ['short and wide', 200, 24],
  ['square-ish', 120, 110],
  ['tall column', 120, 240],
];

describe('label containment', () => {
  describe.each(['neo', 'classic'])('%s look', (look) => {
    describe.each(LABEL_BOXES)('%s label', (_name, width, height) => {
      it('fits inside the circle', async () => {
        const { parent, shapeSvg } = setup(width, height, look, 15);
        await circle(parent, { id: 'c', look, padding: 15, x: 0, y: 0 } as Node);
        const r = Number(shapeSvg.select('circle').attr('r'));
        // Every corner of the label box has to be within the radius, not just its sides.
        expect(r).toBeGreaterThanOrEqual(Math.sqrt(width ** 2 + height ** 2) / 2);
      });

      it('fits inside the double circle', async () => {
        const { parent, shapeSvg } = setup(width, height, look, 15);
        await doublecircle(parent, { id: 'd', look, padding: 15, x: 0, y: 0 } as Node);
        const radii = shapeSvg
          .selectAll('circle')
          .nodes()
          .map((n) => Number((n as Element).getAttribute('r')));
        // The label sits inside the inner ring, so that is the one that has to clear it.
        expect(Math.min(...radii)).toBeGreaterThanOrEqual(Math.sqrt(width ** 2 + height ** 2) / 2);
      });

      it('fits inside the delay outline', async () => {
        const { parent, shapeSvg } = setup(width, height, look, 15);
        await halfRoundedRectangle(parent, { id: 'h', look, padding: 15, x: 0, y: 0 } as Node);
        const points = pointsFromPath(shapeSvg.select<SVGPathElement>('path').node()!);
        for (const corner of labelCorners(width, height)) {
          expect(contains(points, corner), `corner ${JSON.stringify(corner)}`).toBe(true);
        }
      });

      it('fits inside the display outline', async () => {
        const { parent, shapeSvg } = setup(width, height, look, 15);
        await curvedTrapezoid(parent, { id: 'q', look, padding: 15, x: 0, y: 0 } as Node);
        const points = pointsFromPath(shapeSvg.select<SVGPathElement>('path').node()!);
        // This outline is drawn from its top-left corner rather than its centre.
        const xs = points.map((p) => p.x);
        const ys = points.map((p) => p.y);
        const centre = {
          x: (Math.min(...xs) + Math.max(...xs)) / 2,
          y: (Math.min(...ys) + Math.max(...ys)) / 2,
        };
        for (const corner of labelCorners(width, height)) {
          const absolute = { x: corner.x + centre.x, y: corner.y + centre.y };
          expect(contains(points, absolute), `corner ${JSON.stringify(corner)}`).toBe(true);
        }
      });
    });
  });
});
