import { describe, it, expect } from 'vitest';
import {
  axisCoordForSide,
  antiZAdjustSide,
  clipPolylineEndpointsToRects,
  computeBoundaryPortAtT,
  determineSideOnRect,
  dot,
  intersectRectBoundary,
  normalizedTForSide,
  projectOtherCenterToSide,
  sideOutDirUnit,
} from './geometry.js';

describe('domus/core/geometry', () => {
  it('computeBoundaryPortAtT returns boundary points', () => {
    const r = { left: 0, right: 10, top: 0, bottom: 20, cx: 5, cy: 10 } as any;
    expect(computeBoundaryPortAtT(r, 'W', 0.25)).toEqual({ x: 0, y: 5 });
    expect(computeBoundaryPortAtT(r, 'E', 0.5)).toEqual({ x: 10, y: 10 });
    expect(computeBoundaryPortAtT(r, 'N', 1)).toEqual({ x: 10, y: 0 });
    expect(computeBoundaryPortAtT(r, 'S', 0)).toEqual({ x: 0, y: 20 });
  });

  it('axisCoordForSide uses y for vertical sides and x for horizontal sides', () => {
    const p = { x: 3, y: 7 } as any;
    expect(axisCoordForSide(p, 'W')).toBe(7);
    expect(axisCoordForSide(p, 'E')).toBe(7);
    expect(axisCoordForSide(p, 'N')).toBe(3);
    expect(axisCoordForSide(p, 'S')).toBe(3);
  });

  it('sideOutDirUnit and dot are consistent', () => {
    expect(dot(sideOutDirUnit('E'), { x: 2, y: 0 })).toBe(2);
    expect(dot(sideOutDirUnit('N'), { x: 0, y: 2 })).toBe(-2);
  });

  it('normalizedTForSide returns a clamped normalized coordinate', () => {
    const r = { left: 0, right: 10, top: 0, bottom: 20, cx: 5, cy: 10 } as any;
    expect(normalizedTForSide({ x: 0, y: 5 } as any, r, 'W')).toBe(0.25);
    expect(normalizedTForSide({ x: 20, y: 0 } as any, r, 'N')).toBe(1);
  });

  it('determineSideOnRect chooses the closest side', () => {
    const r = { left: 0, right: 10, top: 0, bottom: 20, cx: 5, cy: 10 } as any;
    expect(determineSideOnRect({ x: 0, y: 3 } as any, r)).toBe('W');
    expect(determineSideOnRect({ x: 10, y: 3 } as any, r)).toBe('E');
    expect(determineSideOnRect({ x: 3, y: 0 } as any, r)).toBe('N');
    expect(determineSideOnRect({ x: 3, y: 20 } as any, r)).toBe('S');
  });

  it('intersectRectBoundary returns a point on the rectangle boundary', () => {
    const r = { left: 0, right: 10, top: 0, bottom: 20, cx: 5, cy: 10 } as any;
    const hit = intersectRectBoundary(r, { x: 50, y: 10 } as any);
    expect(hit).toEqual({ x: 10, y: 10 });
  });

  it('projectOtherCenterToSide projects and clamps to a side', () => {
    const r = { left: 0, right: 10, top: 0, bottom: 20, cx: 5, cy: 10 } as any;
    expect(projectOtherCenterToSide(r, { x: 999, y: 999 } as any, 'E')).toEqual({ x: 10, y: 20 });
    expect(projectOtherCenterToSide(r, { x: -999, y: -999 } as any, 'N')).toEqual({ x: 0, y: 0 });
  });

  it('antiZAdjustSide switches to a perpendicular side when in corner quartiles', () => {
    const r = { left: 0, right: 10, top: 0, bottom: 20, cx: 5, cy: 10 } as any;
    // On E side near top corner => choose between N/S; baryVec down => prefer S.
    expect(antiZAdjustSide('E', { x: 10, y: 0 } as any, r, { x: 0, y: 1 } as any)).toBe('S');
    // Not in corner quartiles => unchanged
    expect(antiZAdjustSide('E', { x: 10, y: 10 } as any, r, { x: 0, y: 1 } as any)).toBe('E');
  });

  it('clipPolylineEndpointsToRects clips endpoints to the box boundary', () => {
    const rs = { left: 0, right: 10, top: 0, bottom: 10, cx: 5, cy: 5 } as any;
    const re = { left: 20, right: 30, top: 0, bottom: 10, cx: 25, cy: 5 } as any;
    const pts = [
      { x: 5, y: 5 },
      { x: 25, y: 5 },
    ];
    const clipped = clipPolylineEndpointsToRects(pts as any, rs, re);
    expect(clipped[0]).toEqual({ x: 10, y: 5 });
    expect(clipped[clipped.length - 1]).toEqual({ x: 20, y: 5 });
  });
});
