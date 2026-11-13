import { select } from 'd3';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Bounds, Point } from '../../../types.js';
import type { Node } from '../../types.js';
import {
  createDecisionBoxPathD,
  DECISION_ASPECT_RATIO,
  getDecisionBoxHalfSize,
  question,
} from './question.js';
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

const outlinePoints = (element: Element): Point[] => {
  const coordinates =
    element.tagName === 'polygon'
      ? element.getAttribute('points')!
      : element.getAttribute('d')!.replace(/[LMZ]/g, '');
  return coordinates
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [x, y] = pair.split(',').map(Number);
      return { x, y };
    });
};

beforeEach(() => {
  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  vi.mocked(labelHelper).mockReset();
  vi.mocked(updateNodeBounds).mockImplementation((node, element) => {
    const points = outlinePoints(element.node()!);
    node.width = Math.max(...points.map((p) => p.x)) - Math.min(...points.map((p) => p.x));
    node.height = Math.max(...points.map((p) => p.y)) - Math.min(...points.map((p) => p.y));
  });
});

const LABEL = { width: 120, height: 24 };
const PADDING = 15;
const W = LABEL.width + PADDING;
const H = LABEL.height + PADDING;
const S = W + H;
const { halfWidth: HALF_WIDTH, halfHeight: HALF_HEIGHT } = getDecisionBoxHalfSize(
  W,
  H,
  DECISION_ASPECT_RATIO
);

const render = async (look = 'classic', label = LABEL) => {
  const parent = select(document.querySelector<SVGSVGElement>('svg')!);
  const shapeSvg = parent.append('g');
  vi.mocked(labelHelper).mockResolvedValue({
    shapeSvg,
    bbox: { x: 0, y: 0, ...label } as DOMRect,
    halfPadding: PADDING / 2,
    label: shapeSvg.append('g'),
  });
  const node = { id: 'decision', look, padding: PADDING, x: 0, y: 0 } as Node;
  await question(parent, node);
  const outline = shapeSvg.node()!.firstElementChild!;
  return { node, outline, points: outlinePoints(outline) };
};

/** Where the ray from the center of a diamond towards `point` crosses its outline. */
const onOutline = (center: Point, halfWidth: number, halfHeight: number, point: Point) => {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const t = Math.abs(dx) / halfWidth + Math.abs(dy) / halfHeight;
  return { x: center.x + dx / t, y: center.y + dy / t };
};

const expectPoint = (actual: Point, expected: Point) => {
  expect(actual.x).toBeCloseTo(expected.x, 6);
  expect(actual.y).toBeCloseTo(expected.y, 6);
};

describe('getDecisionBoxHalfSize', () => {
  it('is a square rhombus for ratio 1', () => {
    expect(getDecisionBoxHalfSize(W, H, 1)).toEqual({ halfWidth: S / 2, halfHeight: S / 2 });
  });

  it.each([0.5, 1, 1.6, 3])('has the given ratio %s', (ratio) => {
    const { halfWidth, halfHeight } = getDecisionBoxHalfSize(W, H, ratio);
    expect(halfWidth / halfHeight).toBeCloseTo(ratio, 12);
  });

  it.each([0.5, 1, 1.6, 3])('puts the padded label corners on its sides for ratio %s', (ratio) => {
    const { halfWidth, halfHeight } = getDecisionBoxHalfSize(W, H, ratio);
    expect(W / 2 / halfWidth + H / 2 / halfHeight).toBeCloseTo(1, 12);
  });
});

describe('createDecisionBoxPathD', () => {
  it('draws a square when only a size is given', () => {
    expect(createDecisionBoxPathD(0, 0, 100)).toBe('M50,0 L100,-50 L50,-100 L0,-50 Z');
  });

  it('draws a wider diamond when given a width and height', () => {
    expect(createDecisionBoxPathD(0, 0, 160, 100)).toBe('M80,0 L160,-50 L80,-100 L0,-50 Z');
  });
});

describe('question shape', () => {
  it.each(['classic', 'neo'])('draws a diamond wider than it is tall (%s)', async (look) => {
    const { node, outline } = await render(look);
    expect(outline.getAttribute('points')).toBe(
      `${HALF_WIDTH},0 ${2 * HALF_WIDTH},${-HALF_HEIGHT} ${HALF_WIDTH},${-2 * HALF_HEIGHT} 0,${-HALF_HEIGHT}`
    );
    expect(outline.getAttribute('transform')).toBe(
      `translate(${-HALF_WIDTH + 0.5}, ${HALF_HEIGHT})`
    );
    expect(node.width! / node.height!).toBeCloseTo(DECISION_ASPECT_RATIO);
  });

  it('draws a hand-drawn diamond wider than it is tall', async () => {
    const { node, outline } = await render('handDrawn');
    expect(outline.getAttribute('d')).toBe(
      createDecisionBoxPathD(0, 0, 2 * HALF_WIDTH, 2 * HALF_HEIGHT)
    );
    expect(outline.getAttribute('transform')).toBe(
      `translate(${-HALF_WIDTH + 0.5}, ${HALF_HEIGHT})`
    );
    expect(node.width! / node.height!).toBeCloseTo(DECISION_ASPECT_RATIO);
  });

  it('is shorter than a square diamond around a one-line label', async () => {
    const { node } = await render();
    expect(node.height).toBeLessThan(S);
    expect(node.width).toBeGreaterThan(S);
  });

  it('keeps a one-character label inside', async () => {
    const label = { width: 8, height: 24 };
    const { node } = await render('classic', label);
    const w = label.width + PADDING;
    const h = label.height + PADDING;
    expect(w / node.width! + h / node.height!).toBeCloseTo(1, 12);
  });
});

describe('question intersect', () => {
  const center = { x: 300, y: 200 };
  const directions = [
    { x: 500, y: 0 },
    { x: -500, y: 0 },
    { x: 0, y: 500 },
    { x: 0, y: -500 },
    { x: 400, y: 90 },
    { x: -400, y: 90 },
    { x: 37, y: -410 },
    { x: -260, y: -260 },
  ];
  const towards = (d: Point) => ({ x: center.x + d.x, y: center.y + d.y });

  it('keeps the drawn ratio when hand-drawn bounds are slightly out of proportion', async () => {
    // Hand-drawn outlines overflow the nominal diamond, so their bounds are not exactly in proportion.
    const { node } = await render('handDrawn');
    const bounds = { ...center, width: node.width!, height: node.height! + 3 };
    const halfWidth = node.width! / 2;
    for (const d of directions) {
      expectPoint(
        node.calcIntersect!(bounds, towards(d)),
        onOutline(center, halfWidth, halfWidth / DECISION_ASPECT_RATIO, towards(d))
      );
    }
  });

  it.each(['classic', 'neo', 'handDrawn'])(
    'ends edges on the outline of the diamond (%s)',
    async (look) => {
      const { node } = await render(look);
      const bounds = { ...center, width: node.width!, height: node.height! };
      const halfWidth = node.width! / 2;
      const halfHeight = node.height! / 2;
      for (const d of directions) {
        expectPoint(
          node.calcIntersect!(bounds, towards(d)),
          onOutline(center, halfWidth, halfHeight, towards(d))
        );
      }
    }
  );

  it('treats points on the outline, like bounding-box-clipped vertices, as their own intersection', async () => {
    const { node } = await render();
    const bounds = { ...center, width: node.width!, height: node.height! };
    const halfWidth = node.width! / 2;
    const halfHeight = node.height! / 2;
    const vertices = [
      { x: center.x + halfWidth, y: center.y },
      { x: center.x - halfWidth, y: center.y },
      { x: center.x, y: center.y + halfHeight },
      { x: center.x, y: center.y - halfHeight },
    ];
    const sides = [
      { x: center.x + halfWidth / 2, y: center.y + halfHeight / 2 },
      { x: center.x - halfWidth / 4, y: center.y - (3 * halfHeight) / 4 },
    ];
    for (const point of [...vertices, ...sides]) {
      expectPoint(node.calcIntersect!(bounds, point), point);
    }
  });

  it('projects points a hair inside the outline, as float32 bounds can leave them, onto it', async () => {
    const { node } = await render();
    const bounds = { ...center, width: node.width!, height: node.height! };
    const halfWidth = node.width! / 2;
    const halfHeight = node.height! / 2;
    const inside = [
      { x: center.x + Math.fround(halfWidth) - 1e-4, y: center.y },
      { x: center.x, y: center.y + Math.fround(halfHeight) - 1e-4 },
      { x: center.x - halfWidth / 2 + 1e-4, y: center.y + halfHeight / 2 - 1e-4 },
    ];
    for (const point of inside) {
      const hit = node.calcIntersect!(bounds, point);
      expectPoint(hit, onOutline(center, halfWidth, halfHeight, point));
      expect(Math.hypot(hit.x - point.x, hit.y - point.y)).toBeLessThan(1e-3);
    }
  });

  it('returns the center for a point at the center', async () => {
    const { node } = await render();
    const bounds = { ...center, width: node.width!, height: node.height! };
    expect(node.calcIntersect!(bounds, center)).toEqual(center);
  });

  it('intersects against the node itself', async () => {
    const { node } = await render();
    Object.assign(node, center);
    const point = towards({ x: 400, y: 90 });
    expectPoint(
      node.intersect!(point),
      onOutline(center, node.width! / 2, node.height! / 2, point)
    );
  });
});
