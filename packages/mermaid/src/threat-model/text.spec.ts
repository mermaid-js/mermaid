import { describe, expect, it } from 'vitest';
import { wrapText } from './text.js';

const measure = (text: string) => [...text].length * 8;

describe('register text wrapping', () => {
  it('wraps at word boundaries according to measured width', () => {
    expect(wrapText('first second third', 100, measure)).toEqual(['first second', 'third']);
  });
  it('splits long unbroken references rather than overflowing the report', () => {
    const text = '1234567890'.repeat(10);
    const lines = wrapText(text, 80, measure);
    expect(lines.join('')).toBe(text);
    expect(lines.every((line) => measure(line) <= 80)).toBe(true);
  });
  it('preserves Unicode code points when splitting', () => {
    expect(wrapText('🔐🔐🔐', 8, measure)).toEqual(['🔐', '🔐', '🔐']);
  });
  it('preserves paragraph breaks', () => {
    expect(wrapText('first\n\nsecond', 100, measure)).toEqual(['first', '', 'second']);
  });
  it('terminates even when one character is wider than the available space', () => {
    expect(wrapText('ABC', 1, measure)).toEqual(['A', 'B', 'C']);
  });
});
