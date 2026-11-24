import { select } from 'd3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as configApi from '../../../config.js';
import type { Node } from '../../types.js';
import { composite } from './composite.js';

// An SVG text label centred on its origin, as `createText` lays it out.
const measurementStubs = {
  getBBox: () => ({ x: -20, y: 0, width: 40, height: 16 }),
  getComputedTextLength: () => 40,
} as const;

const originalDescriptors = Object.fromEntries(
  Object.keys(measurementStubs).map((name) => [
    name,
    Object.getOwnPropertyDescriptor(SVGElement.prototype, name),
  ])
);

beforeAll(() => {
  for (const [name, value] of Object.entries(measurementStubs)) {
    Object.defineProperty(SVGElement.prototype, name, { configurable: true, value });
  }
});

afterAll(() => {
  for (const [name, descriptor] of Object.entries(originalDescriptors)) {
    if (descriptor) {
      Object.defineProperty(SVGElement.prototype, name, descriptor);
    } else {
      Reflect.deleteProperty(SVGElement.prototype, name);
    }
  }
});

const svg = () => select(document.querySelector<SVGSVGElement>('svg')!);

const compositeNode = (extra: Partial<Node> & { positioned?: boolean } = {}) =>
  ({
    id: 'group',
    domId: 'diagram-group',
    label: 'Group title',
    shape: 'composite',
    isGroup: false,
    padding: 8,
    cssClasses: 'default',
    look: 'classic',
    x: 0,
    y: 0,
    ...extra,
  }) as Node;

const labelTranslate = () => {
  const transform = document.querySelector('#diagram-group > g.label')!.getAttribute('transform')!;
  const match = /translate\(([^,]+),([^)]+)\)/.exec(transform);
  return { x: Number(match![1]), y: Number(match![2]) };
};

beforeEach(() => {
  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  configApi.reset();
  configApi.setConfig({ htmlLabels: false, flowchart: { htmlLabels: false } });
});

describe('composite title', () => {
  it('draws the title of a placed composite at its top, not in its middle (#5423)', async () => {
    await composite(svg(), compositeNode({ positioned: true, width: 200, height: 100 }));

    // The rect spans y = -50..50; the title starts half a padding below its top edge.
    expect(labelTranslate()).toEqual({ x: 0, y: -50 + 4 });
  });

  it('keeps the title centred in a placed composite with nothing inside', async () => {
    // `block:id["Title"] columns 1 end` has no inner blocks, so the layout keeps the
    // composite at its bare title height (16 here) and reserves no band for the title.
    await composite(svg(), compositeNode({ positioned: true, width: 40, height: 16 }));

    expect(labelTranslate()).toEqual({ x: 0, y: -8 });
  });

  it('still centres the title while the composite is being measured', async () => {
    await composite(svg(), compositeNode({ padding: 0 }));

    expect(labelTranslate()).toEqual({ x: 0, y: -8 });
  });
});
