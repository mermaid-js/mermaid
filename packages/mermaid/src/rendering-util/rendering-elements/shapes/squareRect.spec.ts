import { select } from 'd3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as configApi from '../../../config.js';
import type { Node } from '../../types.js';
import { squareRect } from './squareRect.js';

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

const rectNode = (extra: Partial<Node> = {}) =>
  ({
    id: 'n1',
    domId: 'diagram-n1',
    label: 'A node',
    labelType: 'text',
    shape: 'rect',
    isGroup: false,
    padding: 8,
    cssClasses: 'default',
    look: 'classic',
    x: 0,
    y: 0,
    ...extra,
  }) as Node;

beforeEach(() => {
  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  configApi.reset();
  configApi.setConfig({
    htmlLabels: false,
    flowchart: { htmlLabels: false },
    theme: 'redux-color',
  });
});

describe('squareRect colour slot', () => {
  /**
   * `squareRect` backs the plain `rect` shape for the whole library — notes, JSON tables and
   * `classDb`'s synthetic interface node all render through it. Stamping a slot on a node that
   * was never assigned one hands every one of them `color-0`, which is inert only for as long
   * as no stylesheet emitting `[data-color-id] … rect` rules happens to render a bare rect.
   * `er/styles.ts` already emits exactly that selector shape, so keep the stamp keyed to a slot
   * the diagram actually assigned.
   */
  it('leaves a node with no assigned slot unstamped on a palette theme', async () => {
    const shapeSvg = await squareRect(svg(), rectNode());

    expect(shapeSvg.attr('data-color-id')).toBeNull();
  });

  it('stamps the assigned slot on a palette theme', async () => {
    const shapeSvg = await squareRect(svg(), rectNode({ colorIndex: 3 }));

    expect(shapeSvg.attr('data-color-id')).toBe('color-3');
  });

  it('stays unstamped on a theme without a palette', async () => {
    configApi.setConfig({ theme: 'default' });

    const shapeSvg = await squareRect(svg(), rectNode({ colorIndex: 3 }));

    expect(shapeSvg.attr('data-color-id')).toBeNull();
  });
});
