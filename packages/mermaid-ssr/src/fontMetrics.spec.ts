import { JSDOM } from 'jsdom';

import { fontOf, lineBoxHeight, measureTextWidth } from './fontMetrics.js';
import { parseFontFamilies, resolveFont } from './fonts.js';

const arial = { family: 'arial, sans-serif', size: 14, weight: 400 };

describe('fontMetrics', () => {
  it('measures Arial-compatible widths like Chromium', () => {
    // Chromium, Arial 14px: "Christmas" -> 63.0px, "Let me think" -> 76.3px
    expect(measureTextWidth('Christmas', arial)).toBeCloseTo(63.0, 0);
    expect(measureTextWidth('Let me think', arial)).toBeCloseTo(76.3, 0);
  });

  it('reports line height with per-part pixel rounding like Chromium', () => {
    expect(lineBoxHeight(arial)).toBe(16);
    expect(lineBoxHeight({ ...arial, size: 16 })).toBe(17);
  });

  it('uses a wider face for bold text', () => {
    expect(measureTextWidth('Christmas', { ...arial, weight: 700 })).toBeGreaterThan(
      measureTextWidth('Christmas', arial)
    );
  });

  it('falls back to the bundled font for unknown families', () => {
    const font = resolveFont('"No Such Font 123", sans-serif', 400);
    expect(font.names.fontFamily.en).toBe('Liberation Sans');
  });

  it('parses CSS font-family lists', () => {
    expect(parseFontFamilies('"Recursive Variable", arial, sans-serif')).toEqual([
      'Recursive Variable',
      'arial',
      'sans-serif',
    ]);
  });

  it('reads font-family and font-size from the root svg stylesheet', () => {
    const dom = new JSDOM(
      `<svg xmlns="http://www.w3.org/2000/svg" id="d1"><style>#d1{font-family:"Recursive Variable",arial,sans-serif;font-size:14px;fill:#000;}#d1 .x{font-size:12px;}</style><g><text>Hi</text></g></svg>`
    );
    const text = dom.window.document.querySelector('text')!;
    expect(fontOf(text)).toEqual({
      family: '"Recursive Variable",arial,sans-serif',
      size: 14,
      weight: 400,
    });
  });
});
