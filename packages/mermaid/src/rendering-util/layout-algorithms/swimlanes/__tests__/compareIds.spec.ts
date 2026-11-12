import { describe, expect, it } from 'vitest';
import { compareIds } from '../compareIds.js';

describe('compareIds', () => {
  it('orders by UTF-16 code unit: upper case, then underscore, then lower case, then non-ASCII', () => {
    expect(['z', 'ä', 'b', '_', 'a', 'B'].sort(compareIds)).toEqual(['B', '_', 'a', 'b', 'z', 'ä']);
  });

  it('puts a prefix before a longer id and compares digits as characters', () => {
    expect(['t2', 't', 't10', 't1'].sort(compareIds)).toEqual(['t', 't1', 't10', 't2']);
  });

  it('returns 0 for equal ids and opposite signs when the arguments are swapped', () => {
    expect(compareIds('Zinc', 'Zinc')).toBe(0);
    expect(compareIds('Tea', 'Zinc')).toBe(-1);
    expect(compareIds('Zinc', 'Tea')).toBe(1);
  });
});
