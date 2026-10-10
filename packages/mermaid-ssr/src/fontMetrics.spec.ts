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

  it('reads font-size from a class rule, not just the root rule', () => {
    const dom = new JSDOM(
      `<svg xmlns="http://www.w3.org/2000/svg" id="d2"><style>#d2{font-size:16px;}#d2 .c4-shape .label{font-size:14px;}</style><g class="c4-shape"><g class="label"><text>Hi</text></g></g></svg>`
    );
    expect(fontOf(dom.window.document.querySelector('text')!).size).toBe(14);
  });

  it('resolves an em font-size against the inherited size', () => {
    // c4 sizes its type line with `font-size: 0.75em` under a 14px label.
    const dom = new JSDOM(
      `<svg xmlns="http://www.w3.org/2000/svg" id="d3"><style>#d3{font-size:16px;}#d3 .label{font-size:14px;}#d3 .label .c4-type{font-size:0.75em;}</style><g class="label"><g class="c4-type"><text>Hi</text></g></g></svg>`
    );
    expect(fontOf(dom.window.document.querySelector('text')!).size).toBeCloseTo(10.5, 3);
  });

  it('reads font-weight from a class rule', () => {
    const dom = new JSDOM(
      `<svg xmlns="http://www.w3.org/2000/svg" id="d4"><style>#d4 .label .c4-name{font-weight:bold;}</style><g class="label"><g class="c4-name"><text>Hi</text></g></g></svg>`
    );
    expect(fontOf(dom.window.document.querySelector('text')!).weight).toBe(700);
  });
});
