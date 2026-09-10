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

describe('estimateBBox text-anchor', () => {
  const label = (attrs: string, style = ''): Element => {
    const svg = parseSvgElement(`
      ${style}
      <g class="node"><g class="label">
        <text y="-10.1" ${attrs}>
          <tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em">Handle paren</tspan>
        </text>
      </g></g>
    `);
    return svg.querySelector('text')!;
  };

  it('starts the box at x for the default anchor', () => {
    const box = estimateBBox(label('x="0"'));
    expect(box.x).toBeCloseTo(0, 1);
  });

  it('centres the box on x when the anchor attribute is middle', () => {
    const box = estimateBBox(label('x="0" text-anchor="middle"'));
    expect(box.x).toBeCloseTo(-box.width / 2, 1);
  });

  it('ends the box at x when the anchor attribute is end', () => {
    const box = estimateBBox(label('x="0" text-anchor="end"'));
    expect(box.x).toBeCloseTo(-box.width, 1);
  });

  it('honours an anchor set in a style attribute', () => {
    const box = estimateBBox(label('x="0" style="text-anchor: middle"'));
    expect(box.x).toBeCloseTo(-box.width / 2, 1);
  });

  it('honours an anchor inherited from an ancestor', () => {
    const svg = parseSvgElement(`
      <g text-anchor="middle"><text x="0" y="-10.1">
        <tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em">Handle paren</tspan>
      </text></g>
    `);
    const box = estimateBBox(svg.querySelector('text')!);
    expect(box.x).toBeCloseTo(-box.width / 2, 1);
  });

  it('honours an anchor from a stylesheet rule, as mermaid centres node labels', () => {
    // Mermaid emits no attribute for node labels; the rule below is what centres them.
    const box = estimateBBox(
      label('x="0"', '<style>.node .label text{text-anchor:middle;fill:#333;}</style>')
    );
    expect(box.x).toBeCloseTo(-box.width / 2, 1);
  });

  it('leaves text unmatched by the stylesheet rule at the default anchor', () => {
    const svg = parseSvgElement(`
      <style>.node .label text{text-anchor:middle;}</style>
      <g class="edgePaths"><text x="0" y="-10.1">
        <tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em">Handle paren</tspan>
      </text></g>
    `);
    const box = estimateBBox(svg.querySelector('text')!);
    expect(box.x).toBeCloseTo(0, 1);
  });

  it('offsets single-line text with no tspan children too', () => {
    const svg = parseSvgElement(`<text x="0" y="0" text-anchor="middle">Handle paren</text>`);
    const box = estimateBBox(svg.querySelector('text')!);
    expect(box.x).toBeCloseTo(-box.width / 2, 1);
  });

  it('honours an anchor set on the row tspan, as c4 centres its labels', () => {
    // c4 puts text-anchor on the row tspan rather than on the <text>.
    const svg = parseSvgElement(`
      <text y="-10.1">
        <tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle">
          <tspan class="text-inner-tspan">Handle paren</tspan>
        </tspan>
      </text>
    `);
    const box = estimateBBox(svg.querySelector('text')!);
    expect(box.x).toBeCloseTo(-box.width / 2, 1);
  });

  it('anchors each row on its own x', () => {
    const svg = parseSvgElement(`
      <text y="-10.1">
        <tspan class="row" x="100" y="0" text-anchor="middle">Handle paren</tspan>
      </text>
    `);
    const box = estimateBBox(svg.querySelector('text')!);
    expect(box.x).toBeCloseTo(100 - box.width / 2, 1);
  });
});
