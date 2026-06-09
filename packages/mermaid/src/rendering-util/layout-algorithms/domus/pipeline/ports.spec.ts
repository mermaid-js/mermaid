import { describe, it, expect } from 'vitest';
import { inferPortSideFromPointOnRect, snapPortForRoutingOnSide } from './ports.js';
import type { Point, Rect } from '../types.js';

describe('domus/pipeline/ports - ', () => {
  it('inferPortSideFromPointOnRect detects boundary sides', () => {
    const r = {
      cx: 5,
      cy: 10,
      left: 0,
      right: 10,
      top: 0,
      bottom: 20,
      width: 10,
      height: 20,
    } as Rect;
    expect(inferPortSideFromPointOnRect({ x: 0, y: 5 } as Point, r)).toBe('W');
    expect(inferPortSideFromPointOnRect({ x: 10, y: 5 } as Point, r)).toBe('E');
    expect(inferPortSideFromPointOnRect({ x: 5, y: 0 } as Point, r)).toBe('N');
    expect(inferPortSideFromPointOnRect({ x: 5, y: 20 } as Point, r)).toBe('S');
  });

  it('snapPortForRoutingOnSide preserves boundary coord and snaps along-axis', () => {
    const r = {
      cx: 5,
      cy: 10,
      left: 0,
      right: 10,
      top: 0,
      bottom: 20,
      width: 10,
      height: 20,
    } as Rect;
    const p = snapPortForRoutingOnSide(r, 'E', { x: 10, y: 7 } as Point, 10);
    expect(p.x).toBe(10);
    expect(p.y).toBe(10);
  });
});
