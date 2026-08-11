import { describe, it, expect } from 'vitest';
import { MinHeap } from './minHeap.js';

describe('domus/core/MinHeap', () => {
  it('pops values in increasing order', () => {
    const h = new MinHeap<number>((a, b) => a < b);
    h.push(5);
    h.push(1);
    h.push(3);
    h.push(2);
    h.push(4);
    const out: number[] = [];
    while (h.size > 0) {
      out.push(h.pop()!);
    }
    expect(out).toEqual([1, 2, 3, 4, 5]);
  });

  it('handles pop on empty', () => {
    const h = new MinHeap<number>((a, b) => a < b);
    expect(h.pop()).toBeUndefined();
    expect(h.size).toBe(0);
  });

  it('respects complex comparators deterministically', () => {
    interface T {
      p: number;
      t: number;
    }
    const h = new MinHeap<T>((x, y) => x.p < y.p || (x.p === y.p && x.t < y.t));
    h.push({ p: 1, t: 2 });
    h.push({ p: 0, t: 9 });
    h.push({ p: 1, t: 1 });
    h.push({ p: 0, t: 1 });
    const out: T[] = [];
    while (h.size > 0) {
      out.push(h.pop()!);
    }
    expect(out).toEqual([
      { p: 0, t: 1 },
      { p: 0, t: 9 },
      { p: 1, t: 1 },
      { p: 1, t: 2 },
    ]);
  });
});
