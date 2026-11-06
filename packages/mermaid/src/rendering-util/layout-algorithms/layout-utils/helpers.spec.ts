import { describe, it, expect } from 'vitest';
import type { Edge } from '../../types.js';
import {
  clamp,
  compareCodeUnits,
  hasTerminalMarker,
  orthogonalPolylineContainsPoint,
  pointInsideAnyRectInterior,
  terminalMarkerClearanceRect,
} from './helpers.js';

describe('domus/core/helpers', () => {
  it('compares strings by locale-independent UTF-16 code-unit order', () => {
    expect(['ä', 'a', 'A', 'aa'].sort(compareCodeUnits)).toEqual(['A', 'a', 'aa', 'ä']);
    expect(compareCodeUnits('same', 'same')).toBe(0);
  });

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

  it('requires an orthogonal polyline to pass through the requested point', () => {
    expect(
      orthogonalPolylineContainsPoint(
        [
          { x: 0, y: 10 },
          { x: 20, y: 10 },
        ],
        { x: 10, y: 10 }
      )
    ).toBe(true);
    expect(
      orthogonalPolylineContainsPoint(
        [
          { x: 0, y: 0 },
          { x: 0, y: 20 },
        ],
        { x: 0, y: 10 }
      )
    ).toBe(true);
    expect(
      orthogonalPolylineContainsPoint(
        [
          { x: 0, y: 0 },
          { x: 20, y: 0 },
        ],
        { x: 10, y: 1 }
      )
    ).toBe(false);
    expect(
      orthogonalPolylineContainsPoint(
        [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
        { x: 5, y: 5 }
      )
    ).toBe(false);
  });

  it('builds terminal marker clearance inward from the terminal tip', () => {
    expect(
      terminalMarkerClearanceRect(
        [
          { x: 20, y: 10 },
          { x: 0, y: 10 },
        ],
        'start',
        12,
        7
      )
    ).toMatchObject({ left: 8, right: 20, top: 3, bottom: 17 });
    expect(
      terminalMarkerClearanceRect(
        [
          { x: 10, y: 20 },
          { x: 10, y: 0 },
        ],
        'start',
        12,
        7
      )
    ).toMatchObject({ left: 3, right: 17, top: 8, bottom: 20 });
    expect(
      terminalMarkerClearanceRect(
        [
          { x: 20, y: 10 },
          { x: 0, y: 10 },
        ],
        'end',
        12,
        7
      )
    ).toMatchObject({ left: 0, right: 12, top: 3, bottom: 17 });
    expect(
      terminalMarkerClearanceRect(
        [
          { x: 10, y: 20 },
          { x: 10, y: 0 },
        ],
        'end',
        12,
        7
      )
    ).toMatchObject({ left: 3, right: 17, top: 0, bottom: 12 });
  });

  it('detects only terminals that render markers', () => {
    const edge = {
      arrowTypeStart: 'none',
      arrowTypeEnd: 'arrow_point',
      type: 'arrow_point',
    } as Edge;

    expect(hasTerminalMarker(edge, 'start')).toBe(false);
    expect(hasTerminalMarker(edge, 'end')).toBe(true);
    expect(
      hasTerminalMarker({ ...edge, arrowTypeEnd: 'arrow_open', type: undefined } as Edge, 'end')
    ).toBe(false);
    expect(
      hasTerminalMarker(
        { ...edge, arrowTypeStart: 'none', type: 'double_arrow_point' } as Edge,
        'start'
      )
    ).toBe(false);
    expect(
      hasTerminalMarker(
        { ...edge, arrowTypeStart: undefined, type: 'double_arrow_point' } as Edge,
        'start'
      )
    ).toBe(true);
  });
});
