import { describe, expect, it } from 'vitest';
import {
  isGridHorizontalAlign,
  isGridVerticalAlign,
  isValidGridCoordinate,
} from './gridPlacement.js';

describe('grid placement validation', () => {
  it.each([Number.MIN_SAFE_INTEGER, -1, 0, 1, Number.MAX_SAFE_INTEGER])(
    'accepts safe integer coordinate %j',
    (value) => {
      expect(isValidGridCoordinate(value)).toBe(true);
    }
  );

  it.each([
    1.5,
    -1.5,
    Number.MIN_SAFE_INTEGER - 1,
    Number.MAX_SAFE_INTEGER + 1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    '1',
    {},
    null,
  ])('rejects invalid coordinate %j', (value) => {
    expect(isValidGridCoordinate(value)).toBe(false);
  });

  it('accepts only supported alignment values', () => {
    expect(isGridHorizontalAlign('left')).toBe(true);
    expect(isGridHorizontalAlign('center')).toBe(true);
    expect(isGridHorizontalAlign('right')).toBe(true);
    expect(isGridHorizontalAlign('middle')).toBe(false);

    expect(isGridVerticalAlign('top')).toBe(true);
    expect(isGridVerticalAlign('center')).toBe(true);
    expect(isGridVerticalAlign('bottom')).toBe(true);
    expect(isGridVerticalAlign('middle')).toBe(false);
  });
});
