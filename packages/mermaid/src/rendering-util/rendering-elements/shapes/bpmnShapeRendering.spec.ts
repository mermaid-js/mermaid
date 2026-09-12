import { select } from 'd3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as configApi from '../../../config.js';
import type { Node } from '../../types.js';
import { shapes } from '../shapes.js';
import { EVENT_DIAMETER, GATEWAY_SIZE } from './bpmnShapeCore.js';
import { DATA_HEIGHT, DATA_WIDTH } from './bpmnDataObject.js';

const originalGetBBox = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getBBox');
const originalGetComputedTextLength = Object.getOwnPropertyDescriptor(
  SVGElement.prototype,
  'getComputedTextLength'
);
const originalGetBoundingClientRect = Object.getOwnPropertyDescriptor(
  SVGElement.prototype,
  'getBoundingClientRect'
);

const numberAttribute = (element: Element, name: string) =>
  Number.parseFloat(element.getAttribute(name) ?? '0');

const box = (x: number, y: number, width: number, height: number) =>
  ({
    x,
    y,
    width,
    height,
    left: x,
    top: y,
    right: x + width,
    bottom: y + height,
    toJSON: () => ({}),
  }) as DOMRect;

beforeAll(() => {
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value(this: SVGElement) {
      const tag = this.tagName.toLowerCase();
      if (tag === 'rect') {
        return box(
          numberAttribute(this, 'x'),
          numberAttribute(this, 'y'),
          numberAttribute(this, 'width'),
          numberAttribute(this, 'height')
        );
      }
      if (tag === 'circle') {
        const radius = numberAttribute(this, 'r');
        return box(
          numberAttribute(this, 'cx') - radius,
          numberAttribute(this, 'cy') - radius,
          radius * 2,
          radius * 2
        );
      }
      if (tag === 'text' || tag === 'tspan') {
        return box(0, 0, (this.textContent?.length ?? 0) * 7, 16);
      }
      const childBoxes = [...this.children]
        .filter((child): child is SVGGraphicsElement => child instanceof SVGElement)
        .map((child) => child.getBBox());
      if (childBoxes.length === 0) {
        return box(0, 0, 0, 0);
      }
      const left = Math.min(...childBoxes.map((child) => child.x));
      const top = Math.min(...childBoxes.map((child) => child.y));
      const right = Math.max(...childBoxes.map((child) => child.x + child.width));
      const bottom = Math.max(...childBoxes.map((child) => child.y + child.height));
      return box(left, top, right - left, bottom - top);
    },
  });
  Object.defineProperty(SVGElement.prototype, 'getComputedTextLength', {
    configurable: true,
    value(this: SVGElement) {
      return (this.textContent?.length ?? 0) * 7;
    },
  });
  Object.defineProperty(SVGElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value(this: SVGElement) {
      return (this as SVGGraphicsElement).getBBox();
    },
  });
});

afterAll(() => {
  const restore = (name: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Object.defineProperty(SVGElement.prototype, name, descriptor);
    } else {
      Reflect.deleteProperty(SVGElement.prototype, name);
    }
  };
  restore('getBBox', originalGetBBox);
  restore('getComputedTextLength', originalGetComputedTextLength);
  restore('getBoundingClientRect', originalGetBoundingClientRect);
});

const svg = () => select(document.querySelector<SVGSVGElement>('svg')!);

const bpmnNode = (shape: string, extra: Record<string, unknown> = {}) =>
  ({
    id: `n-${shape}`,
    domId: `diagram-n-${shape}`,
    label: 'Step',
    labelType: 'text',
    shape,
    isGroup: false,
    padding: 0,
    cssClasses: `bpmn-${shape}`,
    cssStyles: [],
    look: 'classic',
    x: 0,
    y: 0,
    ...extra,
  }) as unknown as Node;

const draw = async (shape: string, extra: Record<string, unknown> = {}) => {
  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  const node = bpmnNode(shape, extra);
  const handler = shapes[shape as keyof typeof shapes] as (
    parent: unknown,
    node: Node
  ) => Promise<unknown>;
  await handler(svg(), node);
  return node;
};

const ringWidths = () =>
  [...document.querySelectorAll('circle.bpmn-event-ring')].map((ring) =>
    Number.parseFloat((ring as SVGElement).style.strokeWidth)
  );

beforeEach(() => {
  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  configApi.setConfig({ htmlLabels: false, flowchart: { htmlLabels: false } });
});

describe('BPMN event rendering', () => {
  it.each([
    ['bpmn-start', 1],
    ['bpmn-end', 1],
    ['bpmn-intermediate', 2],
    ['bpmn-boundary', 2],
  ])('draws %s with %i ring(s)', async (shape, rings) => {
    await draw(shape);
    expect(document.querySelectorAll('circle.bpmn-event-ring')).toHaveLength(rings);
  });

  it('gives the end event a heavier ring than the start event', async () => {
    await draw('bpmn-start');
    const [start] = ringWidths();
    await draw('bpmn-end');
    const [end] = ringWidths();

    expect(start).toBeGreaterThan(0);
    expect(end).toBeGreaterThan(start);
  });

  it('sets the ring weight inline, so a host stylesheet cannot outrank it', async () => {
    await draw('bpmn-end');
    const ring = document.querySelector<SVGElement>('circle.bpmn-event-ring');

    // A presentation attribute would lose to any `.node circle` rule the host diagram sets.
    expect(ring?.getAttribute('stroke-width')).toBeNull();
    expect(ring?.style.strokeWidth).not.toBe('');
  });
});

describe('BPMN geometry is fixed, not label-driven', () => {
  it('keeps the circle at its notation size however long the caption is', async () => {
    await draw('bpmn-start', { label: 'Go' });
    const short = numberAttribute(document.querySelector('circle.bpmn-event-ring')!, 'r');
    const shortNode = await draw('bpmn-start', { label: 'Go' });

    await draw('bpmn-start', { label: 'An extremely long caption that dwarfs the circle' });
    const long = numberAttribute(document.querySelector('circle.bpmn-event-ring')!, 'r');
    const longNode = await draw('bpmn-start', {
      label: 'An extremely long caption that dwarfs the circle',
    });

    expect(short).toBe(EVENT_DIAMETER / 2);
    expect(long).toBe(short);
    // The reserved box does grow with the caption - that is what keeps the caption from
    // being clipped - which is precisely why the glyph size has to be asserted separately.
    expect(longNode.width ?? 0).toBeGreaterThan(shortNode.width ?? 0);
  });

  it('docks an edge on the glyph rather than on the reserved caption box', async () => {
    const node = await draw('bpmn-start', {
      label: 'An extremely long caption that dwarfs the circle',
    });

    const fromTheRight = node.intersect?.({ x: 1000, y: 0 });
    expect(fromTheRight).toEqual({ x: EVENT_DIAMETER / 2, y: 0 });
    // If it docked on the reserved box the x would be half the node width instead.
    expect(fromTheRight?.x).toBeLessThan((node.width ?? 0) / 2);
  });

  it('reserves the node bounds with an invisible rect rather than a painted one', async () => {
    await draw('bpmn-start');
    const bounds = document.querySelector('rect.bpmn-bounds');

    expect(bounds).not.toBeNull();
    expect(bounds?.getAttribute('opacity')).toBe('0');
    expect(bounds?.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps the gateway diamond at its notation size', async () => {
    await draw('bpmn-gateway', { label: 'A very long gateway caption indeed' });
    const points = document.querySelector('polygon.bpmn-gateway-diamond')?.getAttribute('points');

    expect(points).not.toBeNull();
    const xs = points!
      .trim()
      .split(/\s+/)
      .map((pair) => Math.abs(Number(pair.split(',')[0])));
    expect(Math.max(...xs)).toBe(GATEWAY_SIZE / 2);
  });
});

describe('BPMN shapes draw their own marks', () => {
  it.each([
    ['bpmn-gateway', 'polygon.bpmn-gateway-diamond'],
    ['bpmn-activity', 'rect.bpmn-activity-rect'],
    ['bpmn-data', '.bpmn-data-page'],
    ['bpmn-data-store', '.bpmn-store-body'],
    ['bpmn-annotation', '.bpmn-annotation-bracket'],
  ])('draws %s as %s', async (shape, selector) => {
    await draw(shape);
    expect(document.querySelector(selector)).not.toBeNull();
  });

  it('docks every shape at the centre of the face an edge approaches', async () => {
    // The notation joins two elements border-centre to border-centre, so a flow leaves
    // the middle of one side and arrives at the middle of another. An outline intersect
    // answers with wherever the line crosses instead, which on a diagonal approach is
    // near a corner and leaves neither coordinate on a centre line - so these three
    // approaches tell the two apart without knowing any shape's size.
    for (const shape of [
      'bpmn-start',
      'bpmn-intermediate',
      'bpmn-boundary',
      'bpmn-end',
      'bpmn-gateway',
      'bpmn-activity',
      'bpmn-data',
      'bpmn-data-store',
      'bpmn-annotation',
    ]) {
      const node = await draw(shape, { label: 'A caption wider than the shape it names' });
      const intersect = node.intersect;
      expect(intersect, `${shape} has no intersect`).toBeTypeOf('function');

      const fromTheRight = intersect!({ x: 1000, y: 0 });
      expect(fromTheRight.y, `${shape} from the right leaves the centre line`).toBe(0);
      expect(fromTheRight.x, `${shape} from the right`).toBeGreaterThan(0);

      const fromBelow = intersect!({ x: 0, y: 1000 });
      expect(fromBelow.x, `${shape} from below leaves the centre line`).toBe(0);
      expect(fromBelow.y, `${shape} from below`).toBeGreaterThan(0);

      const fromACorner = intersect!({ x: 1000, y: 1000 });
      expect(
        fromACorner.x === 0 || fromACorner.y === 0,
        `${shape} docks off both centre lines on a diagonal approach`
      ).toBe(true);

      // The caption widens the reserved box but not the shape, so docking on the drawn
      // silhouette has to land inside the bounds the layout was given.
      expect(fromTheRight.x, `${shape} docks on its reserved box`).toBeLessThanOrEqual(
        (node.width ?? 0) / 2
      );
    }
  });

  it.each([
    ['bpmn-gateway', GATEWAY_SIZE / 2, GATEWAY_SIZE / 2],
    ['bpmn-data', DATA_WIDTH / 2, DATA_HEIGHT / 2],
  ])('docks %s on its own drawn extent', async (shape, halfWidth, halfHeight) => {
    const node = await draw(shape, { label: 'A caption wider than the shape it names' });

    expect(node.intersect!({ x: 1000, y: 0 })).toEqual({ x: halfWidth, y: 0 });
    expect(node.intersect!({ x: 0, y: 1000 })).toEqual({ x: 0, y: halfHeight });
  });
});

describe('shape and glyph compose', () => {
  it('draws a glyph only when one is asked for', async () => {
    await draw('bpmn-start');
    expect(document.querySelector('.bpmn-glyph')).toBeNull();

    await draw('bpmn-start', { icon: 'bpmn:message' });
    expect(document.querySelector('.bpmn-glyph')).not.toBeNull();
  });

  it('pairs one glyph with different ring weights, which is what avoids a shape per combination', async () => {
    await draw('bpmn-start', { icon: 'bpmn:message' });
    const [startRing] = ringWidths();
    expect(document.querySelector('.bpmn-glyph')).not.toBeNull();

    await draw('bpmn-end', { icon: 'bpmn:message' });
    const [endRing] = ringWidths();
    expect(document.querySelector('.bpmn-glyph')).not.toBeNull();

    expect(endRing).toBeGreaterThan(startRing);
  });
});
