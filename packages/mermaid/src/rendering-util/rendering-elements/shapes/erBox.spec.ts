import { select } from 'd3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as configApi from '../../../config.js';
import type { Node } from '../../types.js';
import { erBox } from './erBox.js';

const measurementStubs = {
  getBBox: () => ({ x: 0, y: 0, width: 40, height: 16 }),
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

const entityNode = (attributeType: string) =>
  ({
    id: 'entity-A-0',
    domId: 'diagram-entity-A-0',
    label: 'A',
    labelType: 'markdown',
    shape: 'erBox',
    isGroup: false,
    cssClasses: 'default',
    cssStyles: [],
    cssCompiledStyles: [],
    look: 'classic',
    x: 0,
    y: 0,
    attributes: [{ type: attributeType, name: 'items', keys: [], comment: '' }],
  }) as unknown as Node;

beforeEach(() => {
  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  configApi.reset();
  configApi.setConfig({ htmlLabels: false });
});

describe('erBox attribute types', () => {
  const typeTspans = () =>
    [...document.querySelectorAll('g.attribute-type tspan.text-inner-tspan')] as SVGTSpanElement[];

  it('writes generic types with angle brackets', async () => {
    await erBox(svg(), entityNode('List~int~'));

    expect(typeTspans().map((t) => t.textContent)).toEqual(['List<int>']);
  });

  it('keeps markdown formatting on a generic type', async () => {
    await erBox(svg(), entityNode('**List~int~**'));

    const [tspan] = typeTspans();
    expect(tspan.textContent).toBe('List<int>');
    expect(tspan.getAttribute('font-weight')).toBe('bold');
  });

  it('keeps markdown formatting on a type without generics', async () => {
    await erBox(svg(), entityNode('**int**'));

    const [tspan] = typeTspans();
    expect(tspan.textContent).toBe('int');
    expect(tspan.getAttribute('font-weight')).toBe('bold');
  });
});
