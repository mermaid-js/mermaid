import { select } from 'd3';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Node } from '../../types.js';
import { person } from './person.js';
import type * as ShapeUtils from './util.js';
import { labelHelper } from './util.js';

vi.mock('./util.js', async (importOriginal) => ({
  ...(await importOriginal<typeof ShapeUtils>()),
  labelHelper: vi.fn(),
  updateNodeBounds: vi.fn(),
}));

vi.mock('./handDrawnShapeStyles.js', () => ({
  styles2String: () => ({ labelStyles: '', nodeStyles: '' }),
  userNodeOverrides: () => ({}),
}));

beforeEach(() => {
  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  vi.mocked(labelHelper).mockReset();
});

const render = async (labelWidth: number, labelHeight: number, extra: Partial<Node> = {}) => {
  const parent = select(document.querySelector<SVGSVGElement>('svg')!);
  const shapeSvg = parent.append('g');
  const label = shapeSvg.append('g');
  vi.mocked(labelHelper).mockResolvedValue({
    shapeSvg,
    bbox: { x: 0, y: 0, width: labelWidth, height: labelHeight } as DOMRect,
    halfPadding: 10,
    label,
  });
  const node = { id: 'person', look: 'classic', padding: 20, x: 0, y: 0, ...extra } as Node;
  await person(parent, node);
  const attr = (selector: string, name: string) =>
    Number(shapeSvg.select(selector).attr(name) ?? Number.NaN);
  const labelTop = Number(/translate\([^,]+, ([^)]+)\)/.exec(label.attr('transform'))![1]);
  return {
    bodyTop: attr('rect', 'y'),
    bodyWidth: attr('rect', 'width'),
    bodyHeight: attr('rect', 'height'),
    headCenterY: attr('circle', 'cy'),
    headRadius: attr('circle', 'r'),
    labelTop,
    labelBottom: labelTop + labelHeight,
  };
};

describe('person geometry', () => {
  it('keeps the body at least 0.6 times as tall as it is wide', async () => {
    const { bodyWidth, bodyHeight } = await render(200, 20);
    expect(bodyHeight).toBeGreaterThanOrEqual(bodyWidth * 0.6 - 1e-7);
  });

  it('grows the body to fit a tall label below the head', async () => {
    const { bodyTop, bodyHeight, headCenterY, headRadius, labelTop, labelBottom } = await render(
      100,
      300
    );
    const headBottom = headCenterY + headRadius;
    expect(labelTop).toBeGreaterThanOrEqual(headBottom - 1e-7);
    expect(labelBottom).toBeLessThanOrEqual(bodyTop + bodyHeight + 1e-7);
  });

  it('centres the label on the part of the body the head does not cover', async () => {
    const { bodyTop, bodyHeight, headCenterY, headRadius, labelTop, labelBottom } = await render(
      200,
      20
    );
    const headBottom = headCenterY + headRadius;
    const below = bodyTop + bodyHeight - labelBottom;
    expect(labelTop - headBottom).toBeCloseTo(below, 6);
  });

  it.each([
    [40, 23],
    [240, 64.4],
    [1000, 80],
  ])('scales the head with the body up to a cap, for a %spx label', async (labelWidth, radius) => {
    const { headRadius } = await render(labelWidth, 20);
    expect(headRadius).toBeCloseTo(radius, 6);
  });

  it('honours an explicit node height taller than the minimum', async () => {
    const { bodyTop, bodyHeight, headCenterY, headRadius } = await render(100, 20, {
      height: 400,
    });
    const top = headCenterY - headRadius;
    expect(bodyTop + bodyHeight - top).toBeCloseTo(400, 6);
  });
});
