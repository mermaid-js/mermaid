import { select } from 'd3';
import rough from 'roughjs';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
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

afterEach(() => {
  vi.restoreAllMocks();
});

const svg = () => select(document.querySelector<SVGSVGElement>('svg')!);

const entityNode = (
  attributes: { type: string; name: string; keys: string[]; comment: string }[]
) =>
  ({
    id: 'CUSTOMER',
    domId: 'diagram-entity-CUSTOMER-0',
    label: 'CUSTOMER',
    labelType: 'text',
    shape: 'erBox',
    isGroup: false,
    padding: 8,
    cssClasses: 'default',
    cssStyles: [],
    look: 'classic',
    attributes,
    x: 0,
    y: 0,
  }) as unknown as Node;

beforeEach(() => {
  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  configApi.reset();
  configApi.setConfig({
    htmlLabels: false,
    er: { minEntityWidth: 400, minEntityHeight: 300 },
  });
});

describe('erBox minimum entity size', () => {
  it('applies minEntityWidth and minEntityHeight to an entity without attributes', async () => {
    const node = entityNode([]);

    await erBox(svg(), node);

    expect(node.width).toBe(400);
    expect(node.height).toBe(300);
  });

  it('applies minEntityWidth to an entity with attributes', async () => {
    const createRoughSvg = rough.svg.bind(rough);
    const rectangleWidths: number[] = [];
    vi.spyOn(rough, 'svg').mockImplementation((svgElement, roughConfig) => {
      const roughSvg = createRoughSvg(svgElement, roughConfig);
      const rectangle = roughSvg.rectangle.bind(roughSvg);
      roughSvg.rectangle = (x, y, width, height, options) => {
        rectangleWidths.push(width);
        return rectangle(x, y, width, height, options);
      };
      return roughSvg;
    });

    await erBox(svg(), entityNode([{ type: 'string', name: 'id', keys: [], comment: '' }]));

    expect(rectangleWidths[0]).toBe(400);
  });
});
