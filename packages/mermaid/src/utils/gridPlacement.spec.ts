import { describe, expect, it } from 'vitest';
import {
  isGridHorizontalAlign,
  isGridVerticalAlign,
  isValidGridCoordinate,
  validateGridCoordinate,
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

  it.each([
    { value: 'first', received: '"first" (string)' },
    { value: '1', received: '"1" (string)' },
    { value: 1.5, received: '1.5 (number)' },
    { value: Number.NaN, received: 'NaN (number)' },
    { value: Number.POSITIVE_INFINITY, received: 'Infinity (number)' },
    { value: Number.NEGATIVE_INFINITY, received: '-Infinity (number)' },
    { value: Number.MAX_SAFE_INTEGER + 1, received: '9007199254740992 (number)' },
    { value: null, received: 'null (null)' },
    { value: false, received: 'false (boolean)' },
    { value: { toString: null }, received: '[object] (object)' },
    { value: [1], received: '[array] (object)' },
    { value: () => 1, received: '[function] (function)' },
  ])('explains the safe integer requirement for $received', ({ value, received }) => {
    expect(() => validateGridCoordinate('A', 'row', value)).toThrow(
      `GRID_INVALID_COORDINATE: Invalid row for placement "A": expected a safe integer; received ${received}.`
    );
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
