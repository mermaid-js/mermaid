import { describe, it, expect } from 'vitest';
import { clamp, pointInsideAnyRectInterior } from './helpers.js';

describe('domus/core/helpers', () => {
  it('clamp clamps to inclusive bounds', () => {
    expect(clamp(0, 1, 2)).toBe(1);
    expect(clamp(1, 1, 2)).toBe(1);
    expect(clamp(2, 1, 2)).toBe(2);
    expect(clamp(3, 1, 2)).toBe(2);
  });

  it('pointInsideAnyRectInterior checks strict containment against many rects', () => {
    const rects = [
      { left: 0, right: 10, top: 0, bottom: 10, cx: 5, cy: 5 },
      { left: 20, right: 30, top: 0, bottom: 10, cx: 25, cy: 5 },
    ] as any;

    expect(pointInsideAnyRectInterior({ x: 5, y: 5 } as any, rects)).toBe(true);
    expect(pointInsideAnyRectInterior({ x: 20, y: 5 } as any, rects)).toBe(false); // boundary
    expect(pointInsideAnyRectInterior({ x: 15, y: 5 } as any, rects)).toBe(false);
  });
});
