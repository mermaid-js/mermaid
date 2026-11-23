/**
 * The brace shapes pad their label more in the neo look (18px across, 12px down) than in
 * classic (`node.padding`), but they placed the label with `node.padding` in both looks. In
 * neo that left the label of a `braces` node 10.5px left of centre and every brace label
 * 4.5px above centre.
 */
import { select } from 'd3';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Node } from '../../types.js';
import { curlyBraces } from './curlyBraces.js';
import { curlyBraceLeft } from './curlyBraceLeft.js';
import { curlyBraceRight } from './curlyBraceRight.js';
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

const LABEL = { width: 120, height: 21 };
const PADDING = 15;

const translate = (element: Element) => {
  const [, x, y] = /translate\(\s*([^\s,]+)[\s,]+([^\s)]+)\s*\)/.exec(
    element.getAttribute('transform') ?? ''
  )!;
  return { x: Number(x), y: Number(y) };
};

/** The x range of a drawn path, in the node's coordinates. */
const xRange = (path: Element, offset: number) => {
  const xs = [...path.getAttribute('d')!.matchAll(/[LM]([^ ,]+),/g)].map(([, x]) => Number(x));
  return { left: Math.min(...xs) + offset, right: Math.max(...xs) + offset };
};

const render = async (
  shape: typeof curlyBraces,
  look: string
): Promise<{
  label: { left: number; right: number; centreY: number };
  braces: { left: number; right: number }[];
}> => {
  const parent = select(document.querySelector<SVGSVGElement>('svg')!);
  const shapeSvg = parent.append('g');
  const label = shapeSvg.append('g');
  vi.mocked(labelHelper).mockResolvedValue({
    shapeSvg,
    bbox: { x: 0, y: 0, ...LABEL } as DOMRect,
    halfPadding: PADDING / 2,
    label,
  });
  await shape(parent, { id: 'n', look, padding: PADDING } as Node);

  const outline = shapeSvg.select<SVGGElement>('g.text').node()!;
  const offset = translate(outline).x;
  const at = translate(label.node()!);
  const braces = [...outline.querySelectorAll('path')]
    .filter((path) => path.getAttribute('stroke-opacity') !== '0')
    .map((path) => xRange(path, offset))
    .sort((a, b) => a.left - b.left);
  return {
    label: { left: at.x, right: at.x + LABEL.width, centreY: at.y + LABEL.height / 2 },
    braces,
  };
};

beforeEach(() => {
  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  vi.mocked(labelHelper).mockReset();
  vi.mocked(updateNodeBounds).mockImplementation(() => undefined);
});

describe.each(['classic', 'neo', 'handDrawn'])('brace shapes in the %s look', (look) => {
  it('centres a braces label between the two braces', async () => {
    const { label, braces } = await render(curlyBraces, look);

    expect(braces).toHaveLength(2);
    const [left, right] = braces;
    expect(label.left - left.right).toBeCloseTo(right.left - label.right, 5);
    expect(label.centreY).toBeCloseTo(0, 5);
  });

  it.each([
    ['brace-l', curlyBraceLeft],
    ['brace-r', curlyBraceRight],
  ])('centres a %s label vertically', async (_name, shape) => {
    const { label } = await render(shape, look);

    expect(label.centreY).toBeCloseTo(0, 5);
  });
});

describe('brace shapes in the classic look', () => {
  it.each([
    ['braces', curlyBraces, -60],
    ['brace-l', curlyBraceLeft, -62.5],
    ['brace-r', curlyBraceRight, -60],
  ])('keeps the %s label where it was', async (_name, shape, x) => {
    const { label } = await render(shape, 'classic');

    expect(label.left).toBeCloseTo(x, 5);
  });
});
