import { describe, it, expect } from 'vitest';
import {
  cleanupMultipleCrossingsBetweenTwoPaths,
  countSharedCrossingVertices,
} from './multiCrossingCleanup.js';

describe('RP1 Stage 3b multi-crossing cleanup', () => {
  it('reduces multiple shared crossing vertices by swapping subpaths', () => {
    // Path A: a vertical “spine” that crosses the horizontal parts of B twice.
    const a = [
      { x: 10, y: 0 },
      { x: 10, y: 5 },
      { x: 10, y: 15 },
      { x: 10, y: 20 },
    ];

    // Path B: horizontal at y=5, then vertical at x=20, then horizontal at y=15.
    // Includes explicit vertices at the two crossings: (10,5) and (10,15).
    const b = [
      { x: 0, y: 5 },
      { x: 10, y: 5 },
      { x: 20, y: 5 },
      { x: 20, y: 15 },
      { x: 10, y: 15 },
      { x: 0, y: 15 },
    ];

    expect(countSharedCrossingVertices(a, b)).toBe(2);

    const res = cleanupMultipleCrossingsBetweenTwoPaths(a, b);
    expect(res.changed).toBe(true);

    // After cleanup, crossings at shared vertices should be removed (turns replace straight-through).
    expect(countSharedCrossingVertices(res.a, res.b)).toBe(0);

    // Endpoints stay the same (swap only happens in the interior).
    expect(res.a[0]).toEqual(a[0]);
    expect(res.a[res.a.length - 1]).toEqual(a[a.length - 1]);
    expect(res.b[0]).toEqual(b[0]);
    expect(res.b[res.b.length - 1]).toEqual(b[b.length - 1]);
  });
});
