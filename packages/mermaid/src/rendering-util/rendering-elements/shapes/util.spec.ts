import { select } from 'd3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getConfig, reset, setConfig } from '../../../config.js';
import type { Node } from '../../types.js';
import { labelHelper, withMinWidth } from './util.js';

describe('withMinWidth', () => {
  it('leaves a box that already meets the minimum untouched', () => {
    const bbox = { x: -20, y: 0, width: 40, height: 16 } as DOMRect;
    expect(withMinWidth(bbox, 40)).toBe(bbox);
  });

  it('keeps SVG text centred and does not invent left/top', () => {
    // getBBox() on SVG text: centred on x=0, no left/top.
    const bbox = { x: -20, y: 1, width: 40, height: 16 } as DOMRect;
    const widened = withMinWidth(bbox, 120);
    expect(widened).toEqual({ x: -60, y: 1, width: 120, height: 16 });
    expect('left' in widened).toBe(false);
  });

  it('keeps an HTML label DOMRect anchored at its origin with left/top', () => {
    const bbox = {
      x: 300,
      y: 200,
      width: 40,
      height: 16,
      left: 300,
      top: 200,
      right: 340,
      bottom: 216,
    } as DOMRect;
    const widened = withMinWidth(bbox, 120);
    expect(widened).toMatchObject({ x: 300, y: 200, width: 120, height: 16, left: 300, top: 200 });
    expect(widened.right).toBe(420);
  });
});

describe('shape label wrapping', () => {
  beforeEach(() => {
    setConfig({ htmlLabels: true, flowchart: { wrappingWidth: 120 } });
    document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  });

  afterEach(() => reset());

  const renderLabel = async (extra: Partial<Node> = {}) => {
    const parent = select(document.querySelector<SVGSVGElement>('svg')!);
    const node = {
      id: 'label',
      isGroup: false,
      label: 'A long label with an explicit<br/>line break',
      minWidth: 120,
      ...extra,
    } as Node;
    const result = await labelHelper(parent, node, undefined);
    return { ...result, node, div: parent.select('foreignObject div').node() as HTMLDivElement };
  };

  it('wraps at the configured width', async () => {
    const { div } = await renderLabel();
    expect(div.style.maxWidth).toBe('120px');
  });

  it('wraps at a per-node width when one is set', async () => {
    const { div } = await renderLabel({ wrappingWidth: 80 });
    expect(div.style.maxWidth).toBe('80px');
  });

  it('keeps an explicit node width authoritative', async () => {
    const { div } = await renderLabel({ width: 90 });
    expect(div.style.maxWidth).toBe('90px');
  });
});
