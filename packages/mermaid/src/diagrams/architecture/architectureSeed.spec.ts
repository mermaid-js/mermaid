import { describe, it, expect } from 'vitest';
import { withSeededRandom } from './architectureSeed.js';

describe('withSeededRandom', () => {
  it('produces identical Math.random sequences for the same seed', () => {
    const draw = () => [Math.random(), Math.random(), Math.random(), Math.random()];
    const a = withSeededRandom(42, draw);
    const b = withSeededRandom(42, draw);
    expect(a).toEqual(b);
  });

  it('produces different sequences for different seeds', () => {
    const draw = () => [Math.random(), Math.random(), Math.random()];
    expect(withSeededRandom(1, draw)).not.toEqual(withSeededRandom(2, draw));
  });

  it('returns Math.random values in [0, 1)', () => {
    const values = withSeededRandom(123, () => Array.from({ length: 32 }, () => Math.random()));
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('restores the original Math.random after the callback returns', () => {
    const original = Math.random;
    withSeededRandom(7, () => Math.random());
    expect(Math.random).toBe(original);
  });

  it('restores the original Math.random even when the callback throws', () => {
    const original = Math.random;
    expect(() =>
      withSeededRandom(7, () => {
        throw new Error('boom');
      })
    ).toThrow('boom');
    expect(Math.random).toBe(original);
  });

  it('returns the callback result', () => {
    expect(withSeededRandom(1, () => 'hello')).toBe('hello');
    expect(withSeededRandom(1, () => 42)).toBe(42);
  });

  it('does not stub Math.random when seed is 0 (opt-out into native randomness)', () => {
    const original = Math.random;
    const observed = withSeededRandom(0, () => Math.random);
    expect(observed).toBe(original);
    expect(Math.random).toBe(original);
  });
});
