import { describe, expect, it } from 'vitest';
// @ts-expect-error -- untyped JS module
import intersectLine from './intersect-line.js';
// @ts-expect-error -- untyped JS module
import intersectPolygon from './intersect-polygon.js';

/**
 * `intersectLine` comes from Graphics Gems, where the coordinates were INTEGERS
 * and `denom / 2` was added to the numerator so that the integer division
 * rounded instead of truncating. JavaScript has no truncating division, so that
 * term stopped being a rounding correction and became a constant half-unit
 * displacement of every result.
 *
 * It matters because `intersectPolygon` is how every non-rectangular shape
 * computes its edge attachment — diamond, stadium, hexagon, trapezoid,
 * subroutine. Half a pixel is invisible on its own, but it puts the attachment
 * point off the axis it was supposed to sit on, which turns an orthogonal edge
 * into one with a tiny diagonal opening segment, and can place the point just
 * inside the node it is supposed to touch.
 */
describe('intersectLine', () => {
  it('intersects a vertical line with a horizontal segment exactly at the crossing', () => {
    // Vertical line x = 10, horizontal segment y = 20.
    const result = intersectLine(
      { x: 10, y: 0 },
      { x: 10, y: 100 },
      { x: 0, y: 20 },
      { x: 50, y: 20 }
    );

    expect(result).toEqual({ x: 10, y: 20 });
  });

  it('intersects a horizontal line with a vertical segment exactly at the crossing', () => {
    const result = intersectLine(
      { x: 0, y: 7 },
      { x: 100, y: 7 },
      { x: 33, y: 0 },
      { x: 33, y: 50 }
    );

    expect(result).toEqual({ x: 33, y: 7 });
  });

  it('keeps the crossing on the query line for non-integer coordinates', () => {
    // The case that shows up in real layouts: node centres are fractional, and
    // the attachment must stay on the vertical ray leaving the node.
    const x = 285.01588439941406;
    const result = intersectLine({ x, y: 34.5 }, { x, y: 67 }, { x: 0, y: 57 }, { x: 400, y: 57 });

    expect(result.x).toBeCloseTo(x, 9);
    expect(result.y).toBeCloseTo(57, 9);
  });
});

describe('intersectPolygon', () => {
  it('attaches on the outline, on the axis the query ray travelled', () => {
    // A diamond, 100x100, centred at (200, 200): vertices at the midpoints of
    // its bounding box sides. A ray leaving the centre due east must attach at
    // the east vertex exactly, not half a pixel off it in both axes.
    const node = { x: 200, y: 200, width: 100, height: 100 };
    const points = [
      { x: 0, y: -50 },
      { x: 50, y: 0 },
      { x: 0, y: 50 },
      { x: -50, y: 0 },
    ];

    const result = intersectPolygon(node, points, { x: 400, y: 200 });

    expect(result.x).toBeCloseTo(250, 9);
    expect(result.y).toBeCloseTo(200, 9);
  });
});
