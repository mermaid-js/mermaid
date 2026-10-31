import { select } from 'd3';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { reset, setConfig } from '../../../config.js';
import type { Node } from '../../types.js';
import { c4LabelHelper } from './c4LabelHelper.js';

// jsdom implements neither of these SVG measurement APIs. A flat per-character
// metric is enough: the assertions below count wrapped lines, not pixels.
const PX_PER_CHAR = 7;

beforeAll(() => {
  // @ts-expect-error -- jsdom's SVGElement has no getComputedTextLength
  SVGElement.prototype.getComputedTextLength = function () {
    return (this.textContent ?? '').length * PX_PER_CHAR;
  };
  // @ts-expect-error -- jsdom's SVGElement has no getBBox
  SVGElement.prototype.getBBox = function () {
    return { x: 0, y: 0, width: (this.textContent ?? '').length * PX_PER_CHAR, height: 20 };
  };
});

afterEach(() => {
  reset();
});

/** A `System(...)` element as `buildC4Node` hands it over: `c4.width` and `c4ShapePadding`. */
const c4Node = (): Node =>
  ({
    id: 'SystemAA',
    label: 'Internet Banking System',
    stereotype: '[Software System]',
    description: ['Allows customers to view information about their bank accounts'],
    width: 216,
    padding: 20,
  }) as unknown as Node;

const renderLabel = async (node: Node) => {
  const svg = select(document.body).append('svg');
  await c4LabelHelper(svg as never, node);
  return svg;
};

const outerTspans = (svg: ReturnType<typeof select<SVGSVGElement, unknown>>) =>
  svg.selectAll('tspan.text-outer-tspan').size();

describe('c4LabelHelper', () => {
  it('wraps element labels by default, so the label stays within c4.width', async () => {
    const svg = await renderLabel(c4Node());

    // Three sections (name, stereotype, description) produce exactly 3 outer
    // tspan elements when nothing wraps; the long description has to break further.
    expect(outerTspans(svg)).toBeGreaterThan(3);
  });

  it('does not wrap when c4.wrap is disabled', async () => {
    setConfig({ c4: { wrap: false } });
    const svg = await renderLabel(c4Node());

    // One line per section, none of them broken.
    expect(outerTspans(svg)).toBe(3);
  });
});
