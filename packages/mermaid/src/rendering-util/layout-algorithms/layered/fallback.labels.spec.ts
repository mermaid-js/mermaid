/**
 * When the layered engine fails, dagre draws the diagram. Hostile labels must come out of that
 * fallback exactly as sanitised as they would from dagre alone, and the svg must carry the constant
 * `data-layout-fallback="dagre"` and nothing derived from the labels.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { select } from 'd3';
import type { MermaidConfig } from '../../../config.type.js';
import type { SVG } from '../../../diagram-api/types.js';
import { log } from '../../../logger.js';
import type { Edge, LayoutData, Node } from '../../types.js';
import { render as renderDagre } from '../dagre/index.js';
import type * as Engine from './index.js';

// The engine refuses the input, as it would for something it cannot lay out.
vi.mock('./index.js', async (importOriginal) => ({
  ...(await importOriginal<typeof Engine>()),
  layered: () => {
    throw new Error('engine refuses this input');
  },
}));

import { render as renderLayered, setLayeredThrowsOnFailure } from './render.js';

const MEASURED_BOX = { x: 0, y: 0, width: 40, height: 20 };
const FALLBACK_ATTRIBUTE = 'data-layout-fallback';
// The first render loads dagre's modules; on a busy machine that can pass the default test timeout.
const WARM_UP_TIMEOUT_MS = 60_000;

// jsdom does not lay out SVG; measuring needs a box to read.
const mockMeasuring = (): void => {
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value: () => MEASURED_BOX,
  });
};

const HOSTILE_LABELS: Record<string, string> = {
  // No src: jsdom never fires load or error for an image that has one, and createText waits for it.
  img: '<img onerror=xssAttack()>',
  svg: '<svg onload=xssAttack()>',
  link: "<a href='javascript:xssAttack()'>click</a>",
  script: '<script>xssAttack()</script>',
  iframe: '<iframe srcdoc="<script>parent.xssAttack()</script>"></iframe>',
  mutation: '<math><mtext><table><mglyph><style><img src=x onerror=xssAttack()>',
};

const node = (id: string, label: string, extra: Partial<Node> = {}): Node =>
  ({
    id,
    domId: `diagram-${id}`,
    shape: 'squareRect',
    isGroup: false,
    label,
    ...extra,
  }) as Node;

// One group, two members, and an edge between them: a label in every place a label can go.
const hostileData = (label: string): LayoutData =>
  ({
    nodes: [
      node('G', label, { isGroup: true, shape: 'rect' }),
      node('A', label, { parentId: 'G' }),
      node('B', label, { parentId: 'G' }),
    ],
    edges: [
      {
        id: 'e1',
        start: 'A',
        end: 'B',
        label,
        type: 'arrow_point',
        arrowTypeEnd: 'arrow_point',
      } as Edge,
    ],
    config: {} as MermaidConfig,
    direction: 'TB',
    nodeSpacing: 50,
    rankSpacing: 50,
    markers: ['point'],
    type: 'flowchart-v2',
    diagramId: 'diagram',
    layoutAlgorithm: 'layered',
  }) as LayoutData;

const freshSvg = (): SVG => {
  document.body.innerHTML = '<svg id="diagram"><g></g></svg>';
  return select<SVGSVGElement, unknown>('#diagram');
};

const markup = (svg: SVG): string => svg.node()!.innerHTML;

const unsafeParts = (root: Element): string[] => {
  const found: string[] = [];
  for (const el of [root, ...root.querySelectorAll('*')]) {
    if (el.localName === 'script') {
      found.push('script element');
    }
    for (const { name, value } of el.attributes) {
      if (name.startsWith('on')) {
        found.push(`${el.localName}[${name}]`);
      }
      if (/^\s*javascript:/i.test(value)) {
        found.push(`${el.localName}[${name}]=${value}`);
      }
    }
  }
  return found;
};

describe('the unsafe-markup check', () => {
  it('finds a script element, an event handler and a javascript: url', () => {
    document.body.innerHTML =
      '<svg id="probe"><a href="javascript:xssAttack()" onclick="xssAttack()"><script>x</script></a></svg>';

    expect(unsafeParts(document.getElementById('probe')!)).toEqual([
      'a[href]=javascript:xssAttack()',
      'a[onclick]',
      'script element',
    ]);
  });
});

describe('layered fallback keeps labels as sanitised as dagre does', () => {
  beforeAll(async () => {
    mockMeasuring();
    setLayeredThrowsOnFailure(false);
    vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    await renderLayered(hostileData('warm up'), freshSvg());
    setLayeredThrowsOnFailure(true);
    vi.restoreAllMocks();
  }, WARM_UP_TIMEOUT_MS);

  beforeEach(() => {
    mockMeasuring();
    setLayeredThrowsOnFailure(false);
    vi.spyOn(log, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    setLayeredThrowsOnFailure(true);
    vi.restoreAllMocks();
  });

  it.each(Object.entries(HOSTILE_LABELS))(
    'draws a %s label the way dagre alone draws it',
    async (_name, label) => {
      const direct = freshSvg();
      await renderDagre({ ...hostileData(label), layoutAlgorithm: 'dagre' }, direct);
      const expected = markup(direct);

      const fallback = freshSvg();
      await renderLayered(hostileData(label), fallback);

      expect(expected).toContain('diagram-A');
      expect(fallback.attr(FALLBACK_ATTRIBUTE)).toBe('dagre');
      expect(markup(fallback)).toBe(expected);
    }
  );

  it.each(Object.entries(HOSTILE_LABELS))(
    'leaves no script, event handler or javascript: url from a %s label',
    async (_name, label) => {
      const svg = freshSvg();

      await renderLayered(hostileData(label), svg);

      expect(unsafeParts(svg.node()!)).toEqual([]);
    }
  );

  it('restores a node field named __proto__ without inheriting from it', async () => {
    const data = hostileData('plain');
    // JSON.parse makes `__proto__` an own property, as a parsed `@{ }` block can.
    Object.assign(data.nodes[1], {
      metadata: JSON.parse('{"__proto__":{"inherited":"yes"},"ordinary":1}'),
    });

    await renderLayered(data, freshSvg());

    const restored: unknown = Reflect.get(data.nodes[1], 'metadata');
    expect(Reflect.get(Object(restored), 'ordinary')).toBe(1);
    expect(Reflect.get(Object(restored), 'inherited')).toBeUndefined();
    expect(Object.getPrototypeOf(restored)).toBe(Object.prototype);
    expect(Object.keys(Object.prototype)).toEqual([]);
  });

  it('keeps the marker value constant whatever the labels say', async () => {
    const svg = freshSvg();

    await renderLayered(hostileData(HOSTILE_LABELS.img), svg);

    expect(svg.attr(FALLBACK_ATTRIBUTE)).toBe('dagre');
    expect(svg.node()!.getAttributeNames()).not.toContain('onerror');
  });
});
