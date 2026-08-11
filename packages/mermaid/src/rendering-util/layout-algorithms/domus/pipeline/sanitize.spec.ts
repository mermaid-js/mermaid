import { describe, it, expect } from 'vitest';
import { sanitizeOrthogonalPolylineForRendering } from './sanitize.js';
import type { Point } from '../types.js';

function isOrtho(points: Point[]): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (a.x !== b.x && a.y !== b.y) {
      return false;
    }
  }
  return true;
}

describe('domus/pipeline/sanitize - ', () => {
  it('expands diagonal segments into deterministic orthogonal joins', () => {
    const pts: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 10 }, // diagonal
    ];
    const out = sanitizeOrthogonalPolylineForRendering(pts, { spacing: 10 });
    expect(isOrtho(out)).toBe(true);
    expect(out[0]).toEqual({ x: 0, y: 0 });
    expect(out[out.length - 1]).toEqual({ x: 10, y: 10 });
  });

  it('extends too-short terminal stubs to min segment length', () => {
    const pts: Point[] = [
      { x: 0, y: 0 },
      { x: 0, y: 1 }, // too short for spacing=10 => minSeg=10
    ];
    const out = sanitizeOrthogonalPolylineForRendering(pts, { spacing: 10 });
    expect(out[0]).toEqual({ x: 0, y: 0 });
    expect(out[1]).toEqual({ x: 0, y: 10 });
  });
});
