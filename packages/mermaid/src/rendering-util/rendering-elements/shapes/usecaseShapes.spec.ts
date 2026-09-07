import { select } from 'd3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as configApi from '../../../config.js';
import { registerIconPacks } from '../../icons.js';
import type { Node } from '../../types.js';
import { shapes } from '../shapes.js';
import { usecaseActor } from './usecaseActor.js';
import { usecaseActorAwesome } from './usecaseActorAwesome.js';
import { usecaseActorHollow } from './usecaseActorHollow.js';
import { usecaseActorIcon } from './usecaseActorIcon.js';
import { usecaseBusiness } from './usecaseBusiness.js';
import { usecaseEllipse } from './usecaseEllipse.js';
import { usecaseJsonTable } from './usecaseJsonTable.js';

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
      if (tag === 'ellipse') {
        const rx = numberAttribute(this, 'rx');
        const ry = numberAttribute(this, 'ry');
        return box(-rx, -ry, rx * 2, ry * 2);
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
      if (tag === 'svg') {
        return box(0, 0, numberAttribute(this, 'width'), numberAttribute(this, 'height'));
      }
      if (this.classList.contains('usecase-actor-icon-symbol')) {
        return box(0, 0, 42, 42);
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
  if (originalGetBBox) {
    Object.defineProperty(SVGElement.prototype, 'getBBox', originalGetBBox);
  } else {
    Reflect.deleteProperty(SVGElement.prototype, 'getBBox');
  }
  if (originalGetComputedTextLength) {
    Object.defineProperty(
      SVGElement.prototype,
      'getComputedTextLength',
      originalGetComputedTextLength
    );
  } else {
    Reflect.deleteProperty(SVGElement.prototype, 'getComputedTextLength');
  }
  if (originalGetBoundingClientRect) {
    Object.defineProperty(
      SVGElement.prototype,
      'getBoundingClientRect',
      originalGetBoundingClientRect
    );
  } else {
    Reflect.deleteProperty(SVGElement.prototype, 'getBoundingClientRect');
  }
});

const svg = () => select(document.querySelector<SVGSVGElement>('svg')!);

const actorNode = (shape: Node['shape'], extra: Record<string, unknown> = {}) =>
  ({
    id: `actor-${shape}`,
    domId: `diagram-actor-${shape}`,
    label: 'Customer',
    labelType: 'text',
    shape,
    isGroup: false,
    padding: 8,
    cssClasses: 'default usecase-actor',
    x: 0,
    y: 0,
    ...extra,
  }) as Node;

beforeEach(() => {
  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  configApi.setConfig({ htmlLabels: false, flowchart: { htmlLabels: false } });
});

describe('use-case shared shape registration', () => {
  it('registers every custom use-case shape without changing shared aliases', () => {
    expect(shapes).toMatchObject({
      usecaseActor,
      usecaseActorHollow,
      usecaseActorAwesome,
      usecaseActorIcon,
      usecaseBusiness,
      usecaseEllipse,
      usecaseJsonTable,
    });
    expect(shapes.process).toBe(shapes.rect);
    expect(shapes.note).toBeDefined();
    expect('ellipse' in shapes).toBe(false);
  });
});

describe('use-case actor shapes', () => {
  it('uses one measured footprint and rectangular outline intersection for all variants', async () => {
    const variants = [
      ['usecaseActor', usecaseActor, '.usecase-actor-stick'],
      ['usecaseActorHollow', usecaseActorHollow, '.usecase-actor-hollow-body'],
      ['usecaseActorAwesome', usecaseActorAwesome, '.usecase-actor-awesome-silhouette'],
      ['usecaseActorIcon', usecaseActorIcon, '.usecase-actor-icon-frame'],
    ] as const;
    const dimensions: [number | undefined, number | undefined][] = [];

    for (const [shape, handler, hook] of variants) {
      document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
      const node = actorNode(shape, shape === 'usecaseActorIcon' ? { icon: 'missing:actor' } : {});
      await handler(svg(), node);
      dimensions.push([node.width, node.height]);
      expect(document.querySelector(hook)).not.toBeNull();
      expect(node.intersect?.({ x: 100, y: 0 })).toEqual({ x: (node.width ?? 0) / 2, y: 0 });
    }

    expect(new Set(dimensions.map((dimension) => dimension.join('x'))).size).toBe(1);
  });

  it('renders the hollow actor with wide shoulders, body, and split legs', async () => {
    await usecaseActorHollow(svg(), actorNode('usecaseActorHollow'));

    const body = document.querySelector('.usecase-actor-hollow-body');
    const head = document.querySelector('.usecase-actor-hollow-head');
    expect(body?.getAttribute('d')).toBe(
      'M -22 -10 H 22 V 0 H 6 L 22 17 L 13 28 L 0 13 L -13 28 L -22 17 L -6 0 H -22 Z'
    );
    expect(body?.getAttribute('fill')).toBe('none');
    expect(head?.getAttribute('r')).toBe('9');
    expect(head?.getAttribute('fill')).toBe('none');
  });

  it('measures stereotypes, exposes accessible names, and inherits computed business stroke', async () => {
    const node = actorNode('usecaseActor', {
      business: true,
      stereotype: 'External Customer',
      accessibleName: 'business actor Customer, stereotype External Customer',
      cssStyles: ['stroke: #12506b', 'stroke-width: 5px'],
    });
    await usecaseActor(svg(), node);

    const root = document.querySelector('[role="img"]');
    const glyph = document.querySelector('.usecase-actor-shape');
    const marker = document.querySelector('.usecase-actor-business-marker');
    expect(root?.getAttribute('aria-label')).toBe(
      'business actor Customer, stereotype External Customer'
    );
    const actorLabel = document.querySelector('.usecase-actor-label');
    const stereotypeLabels = document.querySelectorAll('.usecase-stereotype');
    expect(actorLabel?.textContent).toBe('Customer');
    expect(stereotypeLabels).toHaveLength(1);
    expect(stereotypeLabels[0]?.textContent).toContain('«External Customer»');
    expect(actorLabel?.querySelector('.c4-name')).toBeNull();
    expect(actorLabel?.querySelector('.c4-type')).toBeNull();
    expect(glyph?.getAttribute('style')).toContain('stroke:#12506b !important');
    expect(glyph?.getAttribute('style')).toContain('stroke-width:5px !important');
    expect(marker?.getAttribute('style')).toContain('stroke: inherit !important');
  });

  it.each([
    ['normal', 'usecaseActor', usecaseActor, -24, 12],
    ['hollow', 'usecaseActorHollow', usecaseActorHollow, -23, 9],
    ['awesome', 'usecaseActorAwesome', usecaseActorAwesome, -21, 13],
  ] as const)(
    'renders the %s business marker as a right-side, edge-to-edge head chord',
    async (_variant, shape, handler, centerY, radius) => {
      await handler(svg(), actorNode(shape, { business: true }));

      const markerPath =
        document.querySelector('.usecase-actor-business-marker')?.getAttribute('d') ?? '';
      const markerPoints = /^M ([^ ]+) ([^ ]+) L ([^ ]+) ([^ ]+)$/.exec(markerPath);
      expect(markerPoints).not.toBeNull();
      if (!markerPoints) {
        throw new Error('Expected a four-coordinate actor business marker path');
      }
      const [, startXText, startYText, endXText, endYText] = markerPoints;
      const points = [
        [Number(startXText), Number(startYText)],
        [Number(endXText), Number(endYText)],
      ];
      expect(points[0][0]).toBeGreaterThan(0);
      expect(points[0][0]).toBeLessThan(points[1][0]);
      expect(points[0][1]).toBeGreaterThan(points[1][1]);
      for (const [x, y] of points) {
        expect((x / radius) ** 2 + ((y - centerY) / radius) ** 2).toBeCloseTo(1, 10);
      }
      const angleDegrees =
        (Math.atan2(points[0][1] - points[1][1], points[1][0] - points[0][0]) * 180) / Math.PI;
      expect(angleDegrees).toBeCloseTo(60, 10);
    }
  );

  it('renders actors from the shared icon pack registry', async () => {
    registerIconPacks([
      {
        name: 'usecase-test',
        icons: {
          prefix: 'usecase-test',
          icons: {
            user: {
              body: '<path data-usecase-test-icon="true" d="M0 0h24v24H0z"/>',
            },
          },
          width: 24,
          height: 24,
        },
      },
    ]);

    await usecaseActorIcon(svg(), actorNode('usecaseActorIcon', { icon: 'usecase-test:user' }));

    expect(document.querySelector('.usecase-actor-icon-fallback')).toBeNull();
    expect(document.querySelector('[data-usecase-test-icon="true"]')).not.toBeNull();
  });

  it('keeps the shared unknown-icon fallback and bundles awesome without an icon pack', async () => {
    const unknown = actorNode('usecaseActorIcon', { icon: 'not-registered:missing' });
    await usecaseActorIcon(svg(), unknown);
    expect(document.querySelector('.usecase-actor-icon-fallback')).not.toBeNull();
    expect(document.querySelector('.usecase-actor-icon-symbol')?.textContent).toContain('?');

    document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    await usecaseActorAwesome(svg(), actorNode('usecaseActorAwesome'));
    expect(document.querySelector('.usecase-actor-awesome-silhouette')).not.toBeNull();
    expect(document.querySelector('.usecase-actor-awesome svg')).toBeNull();
  });

  it('keeps HTML actor labels in local actor coordinates when the SVG has a viewport offset', async () => {
    const originalHtmlGetBoundingClientRect = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'getBoundingClientRect'
    );
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: () => box(300, 1000, 80, 20),
    });
    configApi.setConfig({ htmlLabels: true, flowchart: { htmlLabels: true } });

    try {
      const node = actorNode('usecaseActor', { stereotype: 'Analyst' });
      await usecaseActor(svg(), node);

      const labels = [
        document.querySelector('.usecase-actor-label'),
        document.querySelector('.usecase-stereotype'),
      ];
      for (const label of labels) {
        const transform = label?.getAttribute('transform') ?? '';
        const match = /^translate\(([^,]+),([^)]+)\)$/.exec(transform);
        expect(match).not.toBeNull();
        expect(Math.abs(Number(match?.[1]))).toBeLessThan(node.width ?? 0);
        expect(Math.abs(Number(match?.[2]))).toBeLessThan(node.height ?? 0);
      }
    } finally {
      if (originalHtmlGetBoundingClientRect) {
        Object.defineProperty(
          HTMLElement.prototype,
          'getBoundingClientRect',
          originalHtmlGetBoundingClientRect
        );
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, 'getBoundingClientRect');
      }
      configApi.setConfig({ htmlLabels: false, flowchart: { htmlLabels: false } });
    }
  });
});

describe('business use case and JSON table', () => {
  it('preserves ellipse intersection and applies compiled stroke to the business slash', async () => {
    const node = actorNode('usecaseBusiness', {
      label: 'Checkout',
      stereotype: 'Primary',
      accessibleName: 'business use case Checkout, stereotype Primary',
      cssClasses: 'default usecase-element usecase-business',
      cssStyles: ['stroke: #6b253c', 'stroke-width: 4px'],
    });
    await usecaseBusiness(svg(), node);

    const marker = document.querySelector('.usecase-business-marker');
    expect(marker?.getAttribute('style')).toContain('stroke:#6b253c !important');
    expect(marker?.getAttribute('style')).toContain('stroke-width:4px !important');
    const markerPath = marker?.getAttribute('d') ?? '';
    const markerPoints = /^M ([^ ]+) ([^ ]+) L ([^ ]+) ([^ ]+)$/.exec(markerPath);
    expect(markerPoints).not.toBeNull();
    if (!markerPoints) {
      throw new Error('Expected a four-coordinate business marker path');
    }
    const [, startXText, startYText, endXText, endYText] = markerPoints;
    const [startX, startY, endX, endY] = [startXText, startYText, endXText, endYText].map(Number);
    const ellipse = document.querySelector<SVGEllipseElement>('.usecase-business-ellipse');
    const label = document.querySelector<SVGGraphicsElement>('.usecase-label');
    if (!ellipse || !label) {
      throw new Error('Expected the business ellipse and its label');
    }
    const radiusX = numberAttribute(ellipse, 'rx');
    const radiusY = numberAttribute(ellipse, 'ry');
    const labelRight = label.getBBox().width / 2;
    expect(startX).toBeGreaterThan(labelRight);
    expect(endX).toBeGreaterThan(startX);
    expect(endX).toBeLessThan(radiusX);
    expect(startY).toBeGreaterThan(endY);
    expect((startX / radiusX) ** 2 + (startY / radiusY) ** 2).toBeCloseTo(1, 10);
    expect((endX / radiusX) ** 2 + (endY / radiusY) ** 2).toBeCloseTo(1, 10);
    expect(document.querySelector('.usecase-stereotype')?.textContent).toContain('«Primary»');
    expect(document.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(
      'business use case Checkout, stereotype Primary'
    );
    expect(node.intersect?.({ x: 100, y: 0 }).x).toBe((node.width ?? 0) / 2);
  });

  it('keeps an HTML stereotype in local coordinates when the SVG has a viewport offset', async () => {
    const originalHtmlGetBoundingClientRect = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'getBoundingClientRect'
    );
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: () => box(300, 1000, 70, 18),
    });
    configApi.setConfig({ htmlLabels: true, flowchart: { htmlLabels: true } });

    try {
      const node = actorNode('usecaseBusiness', {
        label: 'Prepare quote',
        stereotype: 'Core',
      });
      await usecaseBusiness(svg(), node);

      const stereotype = document.querySelector('.usecase-stereotype');
      const transform = stereotype?.getAttribute('transform') ?? '';
      const match = /^translate\(([^,]+),([^)]+)\)$/.exec(transform);
      expect(match).not.toBeNull();
      expect(Math.abs(Number(match?.[1]))).toBeLessThan(node.width ?? 0);
      expect(Math.abs(Number(match?.[2]))).toBeLessThan(node.height ?? 0);
      expect(Number(match?.[2])).toBeLessThan(0);
      expect(document.querySelector('.c4-type')).toBeNull();
    } finally {
      if (originalHtmlGetBoundingClientRect) {
        Object.defineProperty(
          HTMLElement.prototype,
          'getBoundingClientRect',
          originalHtmlGetBoundingClientRect
        );
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, 'getBoundingClientRect');
      }
      configApi.setConfig({ htmlLabels: false, flowchart: { htmlLabels: false } });
    }
  });

  it('renders ordered sanitized JSON cells with stable hooks, bounds, and aria label', async () => {
    const node = actorNode('usecaseJsonTable', {
      label: 'Payload<script>',
      accessibleName: 'JSON Payload, fruit Apple, tags Red, tags Green',
      cssClasses: 'default usecase-json-table',
      jsonRows: [
        { key: 'fruit', accessibleKey: 'fruit', value: '<script>Apple</script>' },
        { key: 'tags', accessibleKey: 'tags', value: 'Red' },
        { key: '', accessibleKey: 'tags', value: 'Green' },
      ],
    });
    await usecaseJsonTable(svg(), node);

    const rows = [...document.querySelectorAll('.usecase-json-row')];
    expect(rows.map((row) => row.getAttribute('data-row-index'))).toEqual(['0', '1', '2']);
    expect(rows.map((row) => row.querySelector('.usecase-json-key')?.textContent)).toEqual([
      'fruit',
      'tags',
      '',
    ]);
    expect(document.querySelector('.usecase-json-table script')).toBeNull();
    expect(document.querySelectorAll('.usecase-json-key-cell')).toHaveLength(3);
    expect(document.querySelectorAll('.usecase-json-value-cell')).toHaveLength(3);
    expect(node.width).toBeGreaterThan(0);
    expect(node.height).toBeGreaterThan(0);
    expect(node.intersect?.({ x: 100, y: 0 }).x).toBe((node.width ?? 0) / 2);
    expect(document.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(
      'JSON Payload, fruit Apple, tags Red, tags Green'
    );
  });
  it('renders JSON table borders and cells with rough paths in hand-drawn mode', async () => {
    const node = actorNode('usecaseJsonTable', {
      label: 'Payload',
      look: 'handDrawn',
      jsonRows: [{ key: 'status', accessibleKey: 'status', value: 'ready' }],
    });
    await usecaseJsonTable(svg(), node);

    const border = document.querySelector('.usecase-json-border');
    expect(border?.tagName.toLowerCase()).toBe('g');
    expect(border?.querySelectorAll('path').length).toBeGreaterThan(0);
    const cells = [...document.querySelectorAll('.usecase-json-cell')];
    expect(cells).toHaveLength(3);
    expect(cells.every((cell) => cell.tagName.toLowerCase() === 'g')).toBe(true);
    expect(cells.every((cell) => cell.querySelector('path'))).toBe(true);
  });

  it('keeps HTML table labels in local table coordinates when the SVG has a viewport offset', async () => {
    const originalHtmlGetBoundingClientRect = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'getBoundingClientRect'
    );
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: () => box(300, 1000, 80, 20),
    });
    configApi.setConfig({ htmlLabels: true, flowchart: { htmlLabels: true } });

    try {
      const node = actorNode('usecaseJsonTable', {
        label: 'Payload',
        cssClasses: 'default usecase-json-table',
        jsonRows: [{ key: 'status', accessibleKey: 'status', value: 'ready' }],
      });
      await usecaseJsonTable(svg(), node);
      const tableGrid = document.querySelector('.usecase-json-table-grid');
      const title = document.querySelector('.usecase-json-title');
      expect(title?.parentElement).toBe(tableGrid);
      expect(title?.previousElementSibling?.classList.contains('usecase-json-title-cell')).toBe(
        true
      );

      const labels = [
        document.querySelector('.usecase-json-title'),
        document.querySelector('.usecase-json-key'),
        document.querySelector('.usecase-json-value'),
      ];
      for (const label of labels) {
        const transform = label?.getAttribute('transform') ?? '';
        const match = /^translate\(([^,]+),([^)]+)\)$/.exec(transform);
        expect(match).not.toBeNull();
        expect(Math.abs(Number(match?.[1]))).toBeLessThan(node.width ?? 0);
        expect(Math.abs(Number(match?.[2]))).toBeLessThan(node.height ?? 0);
      }
    } finally {
      if (originalHtmlGetBoundingClientRect) {
        Object.defineProperty(
          HTMLElement.prototype,
          'getBoundingClientRect',
          originalHtmlGetBoundingClientRect
        );
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, 'getBoundingClientRect');
      }
      configApi.setConfig({ htmlLabels: false, flowchart: { htmlLabels: false } });
    }
  });
});
