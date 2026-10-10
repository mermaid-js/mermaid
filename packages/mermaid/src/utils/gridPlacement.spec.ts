import { describe, expect, it } from 'vitest';
import {
  isGridHorizontalAlign,
  isGridVerticalAlign,
  isValidGridCoordinate,
} from './gridPlacement.js';

describe('grid placement validation', () => {
  it('accepts positive safe integer coordinates', () => {
    expect(isValidGridCoordinate(1)).toBe(true);
    expect(isValidGridCoordinate(Number.MAX_SAFE_INTEGER)).toBe(true);
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, '1', {}, null])(
    'rejects invalid coordinate %j',
    (value) => {
      expect(isValidGridCoordinate(value)).toBe(false);
    }
  );

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
