import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { select } from 'd3';
import type { MermaidConfig } from '../../../config.type.js';
import type { SVG } from '../../../diagram-api/types.js';
import { log } from '../../../logger.js';
import type { Edge, LayoutData, Node } from '../../types.js';
import type * as LayoutDataModule from './layoutData.js';

// The layered attempt changes the data and then fails; the hook is that attempt.
const attempt = vi.hoisted(() => ({ run: undefined as ((data: LayoutData) => void) | undefined }));
vi.mock('./layoutData.js', async (importOriginal) => {
  const actual = await importOriginal<typeof LayoutDataModule>();
  return {
    ...actual,
    runLayeredLayoutCore: (data: LayoutData) => {
      attempt.run?.(data);
      throw new Error('forced layered failure');
    },
  };
});

// Records what dagre is handed at the moment it is called.
const seenByDagre = vi.hoisted(() => ({ data: undefined as LayoutData | undefined, children: -1 }));
vi.mock('../dagre/index.js', () => ({
  render: (data: LayoutData, svg: SVG) => {
    seenByDagre.data = data;
    seenByDagre.children = svg.select('g').selectAll('*').size();
    return Promise.resolve();
  },
}));

import { render, setLayeredThrowsOnFailure } from './render.js';

class Opaque {
  readonly kind = 'instance';
}

const dataWith = (nodeExtra: Record<string, unknown>): LayoutData => {
  const a = { id: 'A', domId: 'd-A', width: 0, height: 0, shape: 'squareRect', ...nodeExtra };
  const e: Edge = { id: 'e1', start: 'A', end: 'A', points: [{ x: 1, y: 2 }] } as Edge;
  return {
    nodes: [a as Node],
    edges: [e],
    config: {} as MermaidConfig,
    direction: 'TB',
    diagramId: 'diagram',
    layoutAlgorithm: 'layered',
  } as LayoutData;
};

const svgRoot = (): SVG => {
  document.body.innerHTML = '<svg id="diagram"><g></g></svg>';
  return select('#diagram') as unknown as SVG;
};

describe('layered fallback: what dagre gets back after a failed attempt', () => {
  beforeEach(() => {
    (SVGElement.prototype as unknown as { getBBox: () => DOMRect }).getBBox = () =>
      ({ x: 0, y: 0, width: 40, height: 20 }) as DOMRect;
    setLayeredThrowsOnFailure(false);
    vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    seenByDagre.data = undefined;
    seenByDagre.children = -1;
  });
  afterEach(() => {
    attempt.run = undefined;
    setLayeredThrowsOnFailure(true);
  });

  it('puts back nested objects and arrays the attempt changed in place, and the keys it added or removed', async () => {
    const data = dataWith({ labelBBox: { width: 5, height: 6 }, styles: ['fill:red'], label: 'A' });
    const node = data.nodes[0]!;
    attempt.run = (d) => {
      const n = d.nodes[0]!;
      n.labelBBox!.width = 99;
      n.cssStyles = ['changed'];
      Reflect.set(n, 'styles', ['changed']);
      Reflect.set(n, 'added', true);
      Reflect.deleteProperty(n, 'label');
      (d.edges[0]!.points as unknown[]).push({ x: 9, y: 9 });
    };

    await render(data, svgRoot());

    expect(seenByDagre.data!.nodes[0]).toBe(node);
    expect(node.labelBBox).toEqual({ width: 5, height: 6 });
    expect(Reflect.get(node, 'styles')).toEqual(['fill:red']);
    expect(Reflect.has(node, 'added')).toBe(false);
    expect(node.label).toBe('A');
    expect(data.edges[0]!.points).toEqual([{ x: 1, y: 2 }]);
  });

  it('keeps functions and class instances by reference, as they cannot be copied', async () => {
    const intersect = (p: unknown) => p;
    const opaque = new Opaque();
    const data = dataWith({ intersect, meta: { opaque } });
    attempt.run = (d) => {
      Reflect.set(d.nodes[0]!, 'meta', { opaque: 'replaced' });
    };

    await render(data, svgRoot());

    const node = data.nodes[0]!;
    expect(node.intersect).toBe(intersect);
    expect(Reflect.get(node, 'meta')).toEqual({ opaque });
    expect(Reflect.get(Reflect.get(node, 'meta') as object, 'opaque')).toBe(opaque);
  });

  it('copies an object with no prototype all the way down', async () => {
    const bare = Object.create(null) as Record<string, unknown>;
    bare.inner = { n: 1 };
    const data = dataWith({ bare });
    attempt.run = (d) => {
      const held = Reflect.get(d.nodes[0]!, 'bare') as { inner: { n: number } };
      held.inner.n = 2;
    };

    await render(data, svgRoot());

    const restored = Reflect.get(data.nodes[0]!, 'bare') as { inner: { n: number } };
    expect(restored.inner.n).toBe(1);
  });

  it('does not copy a __proto__ key, so a hostile object cannot reach Object.prototype', async () => {
    const hostile: unknown = JSON.parse('{"__proto__": {"polluted": true}, "safe": 1}');
    const data = dataWith({ hostile });

    await render(data, svgRoot());

    const restored = Reflect.get(data.nodes[0]!, 'hostile') as object;
    expect(Object.hasOwn(restored, '__proto__')).toBe(false);
    expect(Reflect.get(restored, 'safe')).toBe(1);
    expect(Reflect.get({}, 'polluted')).toBeUndefined();
  });

  it('hands dagre an empty drawing: what the attempt drew is removed first', async () => {
    const svg = svgRoot();
    attempt.run = () => {
      svg.select('g').append('rect');
      svg.select('g').append('path');
    };

    await render(dataWith({}), svg);

    expect(seenByDagre.children).toBe(0);
  });

  it('tells dagre it is the layout, so the next render does not try layered again', async () => {
    const data = dataWith({});

    await render(data, svgRoot());

    expect(data.layoutAlgorithm).toBe('dagre');
  });
});
