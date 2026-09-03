import { JSDOM } from 'jsdom';

import { estimateBBox } from './svgBBox.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const parseSvgElement = (markup: string): Element => {
  const dom = new JSDOM(`<svg xmlns="${SVG_NS}">${markup}</svg>`);
  const svg = dom.window.document.querySelector('svg');
  if (!svg) {
    throw new Error('Failed to parse SVG');
  }
  return svg;
};

describe('estimateBBox', () => {
  it('returns zero for empty text tspans', () => {
    const svg = parseSvgElement(`
      <text y="-10.1">
        <tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"></tspan>
      </text>
    `);
    const text = svg.querySelector('text');

    expect(text).not.toBeNull();
    expect(estimateBBox(text!)).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });

  it('ignores empty translated labels when unioning container bounds', () => {
    const svg = parseSvgElement(`
      <g>
        <g class="label" transform="translate(0, -7.4)">
          <text y="-10.1">
            <tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"></tspan>
          </text>
        </g>
        <rect x="8" y="8" width="100" height="40"></rect>
      </g>
    `);
    const group = svg.querySelector('g');

    expect(group).not.toBeNull();
    expect(estimateBBox(group!)).toEqual({ x: 8, y: 8, width: 100, height: 40 });
  });

  it('keeps non-empty text measurable', () => {
    const svg = parseSvgElement(`
      <text y="-10.1">
        <tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em">Yes</tspan>
      </text>
    `);
    const text = svg.querySelector('text');

    expect(text).not.toBeNull();
    const box = estimateBBox(text!);
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });
});
