import { describe, expect, it } from 'vitest';

import { normalizeSpacing } from './stateCommon.js';

describe('normalizeSpacing', () => {
  it('returns fallback for non-numeric values', () => {
    expect(normalizeSpacing(undefined, 50)).toBe(50);
    expect(normalizeSpacing(null as unknown as number, 40)).toBe(40);
    expect(normalizeSpacing('10' as unknown as number, 30)).toBe(30);
  });

  it('clamps values below the minimum', () => {
    expect(normalizeSpacing(0, 50)).toBe(10);
    expect(normalizeSpacing(9, 50)).toBe(10);
  });

  it('clamps values above the maximum', () => {
    expect(normalizeSpacing(201, 50)).toBe(200);
    expect(normalizeSpacing(1000, 50)).toBe(200);
  });

  it('passes through values within range', () => {
    expect(normalizeSpacing(10, 50)).toBe(10);
    expect(normalizeSpacing(50, 10)).toBe(50);
    expect(normalizeSpacing(200, 10)).toBe(200);
  });
});
