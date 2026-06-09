import { describe, it, expect } from 'vitest';
import {
  lShapeWithinRect,
  polylineWithinRectInclusive,
  routeLShapeBetweenPorts,
} from './containment.js';
import type { Point, Rect } from '../types.js';

describe('domus/pipeline/containment - ', () => {
  it('routeLShapeBetweenPorts produces an orthogonal polyline', () => {
    const out = routeLShapeBetweenPorts({ x: 0, y: 0 } as Point, { x: 10, y: 10 } as Point);
    // should include an elbow
    expect(out.length).toBe(3);
    expect(out[0]).toEqual({ x: 0, y: 0 });
    expect(out.at(-1)).toEqual({ x: 10, y: 10 });
    expect(out[1].x === 0 || out[1].y === 0).toBe(true);
  });

  it('lShapeWithinRect stays within the rectangle', () => {
    const r: Rect = { left: 0, right: 10, top: 0, bottom: 10, cx: 5, cy: 5 };
    const pts = lShapeWithinRect({ x: -5, y: 2 } as Point, { x: 20, y: 8 } as Point, r);
    expect(polylineWithinRectInclusive(pts, r)).toBe(true);
  });
});
