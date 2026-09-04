import { describe, expect, it } from 'vitest';
import { withMinWidth } from './util.js';

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
