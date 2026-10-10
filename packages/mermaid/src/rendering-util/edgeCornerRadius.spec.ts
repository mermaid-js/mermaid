import { describe, expect, it } from 'vitest';
import { DEFAULT_EDGE_CORNER_RADIUS, resolveEdgeCornerRadius } from './edgeCornerRadius.js';

describe('resolveEdgeCornerRadius', () => {
  it('accepts finite non-negative values', () => {
    expect(resolveEdgeCornerRadius(0)).toBe(0);
    expect(resolveEdgeCornerRadius(12)).toBe(12);
  });

  it('uses the shared default for invalid values', () => {
    expect(resolveEdgeCornerRadius(-1)).toBe(DEFAULT_EDGE_CORNER_RADIUS);
    expect(resolveEdgeCornerRadius(Number.NaN)).toBe(DEFAULT_EDGE_CORNER_RADIUS);
    expect(resolveEdgeCornerRadius(Number.POSITIVE_INFINITY)).toBe(DEFAULT_EDGE_CORNER_RADIUS);
    expect(resolveEdgeCornerRadius('5')).toBe(DEFAULT_EDGE_CORNER_RADIUS);
  });
});
