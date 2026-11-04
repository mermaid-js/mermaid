import { describe, expect, it, vi } from 'vitest';
import { measureHtmlLabel } from './measureHtmlLabel.js';

describe('measureHtmlLabel', () => {
  const measure = (matrix: DOMMatrix | null | undefined) => {
    const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    const div = document.createElement('div');
    foreignObject.appendChild(div);
    vi.spyOn(div, 'getBoundingClientRect').mockReturnValue(new DOMRect(30, 40, 200, 60));
    if (matrix !== undefined) {
      Object.defineProperty(foreignObject, 'getScreenCTM', { value: () => matrix });
    }
    return measureHtmlLabel(div);
  };

  it.each([
    [2, 2, 100, 30],
    [0.5, 0.5, 400, 120],
    [2, 0.5, 100, 120],
    [-2, -0.5, 100, 120],
    [1, 1, 200, 60],
  ])('converts scale(%s, %s) to SVG dimensions', (a, d, width, height) => {
    const result = measure({ a, b: 0, c: 0, d, e: 100, f: 200 } as DOMMatrix);
    expect(result.width).toBe(width);
    expect(result.height).toBe(height);
    // Existing consumers distinguish HTML rects from SVG boxes using left/top.
    expect(result.x).toBe(30);
    expect(result.x).toBe(result.left);
    expect(result.y).toBe(40);
    expect(result.y).toBe(result.top);
  });

  it.each([
    undefined,
    null,
    { a: 0, b: 0, c: 0, d: 1 },
    { a: 2, b: 1, c: 0, d: 2 },
    { a: 2, b: 0, c: 1, d: 2 },
    { a: Number.NaN, b: 0, c: 0, d: 1 },
    { a: Number.POSITIVE_INFINITY, b: 0, c: 0, d: 1 },
  ])('preserves the client rect when conversion is unavailable (%j)', (matrix) => {
    const result = measure(matrix as DOMMatrix | null | undefined);
    expect([result.x, result.y, result.width, result.height]).toEqual([30, 40, 200, 60]);
  });
});
