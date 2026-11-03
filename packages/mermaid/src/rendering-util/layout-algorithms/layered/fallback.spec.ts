import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { select } from 'd3';
import type { MermaidConfig } from '../../../config.type.js';
import type { SVG } from '../../../diagram-api/types.js';
import { log } from '../../../logger.js';
import type { Edge, LayoutData, Node } from '../../types.js';
import type * as Engine from './index.js';
import type * as LayoutDataModule from './layoutData.js';

// Makes the engine fail the way a bug, or input it cannot lay out, would.
const engineFailure = vi.hoisted(() => ({ on: false }));
vi.mock('./index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof Engine>();
  return {
    ...actual,
    layered: (...args: Parameters<typeof actual.layered>) => {
      if (engineFailure.on) {
        throw new Error('forced layered failure');
      }
      return actual.layered(...args);
    },
  };
});

// Lets a test make the attempt change the diagram data in place before it fails.
const beforeCore = vi.hoisted(() => ({
  hook: undefined as ((data: LayoutData) => void) | undefined,
}));
vi.mock('./layoutData.js', async (importOriginal) => {
  const actual = await importOriginal<typeof LayoutDataModule>();
  return {
    ...actual,
    runLayeredLayoutCore: (data: LayoutData) => {
      beforeCore.hook?.(data);
      return actual.runLayeredLayoutCore(data);
    },
  };
});

const dagreRender = vi.hoisted(() => vi.fn());
vi.mock('../dagre/index.js', () => ({ render: dagreRender }));

import { render, setLayeredThrowsOnFailure } from './render.js';

const node = (id: string): Node =>
  ({
    id,
    domId: `diagram-${id}`,
    width: 0,
    height: 0,
    shape: 'squareRect',
    isGroup: false,
    label: id,
  }) as Node;

const layoutData = (): LayoutData =>
  ({
    nodes: [node('A'), node('B')],
    edges: [
      { id: 'e1', start: 'A', end: 'B', type: 'arrow_point', arrowTypeEnd: 'arrow_point' } as Edge,
    ],
    config: {} as MermaidConfig,
    direction: 'TB',
    nodeSpacing: 50,
    rankSpacing: 50,
    markers: [],
    type: 'flowchart-v2',
    diagramId: 'diagram',
    layoutAlgorithm: 'layered',
  }) as LayoutData;

const svgRoot = (): SVG => {
  document.body.innerHTML = '<svg id="diagram"><g></g></svg>';
  return select('#diagram') as unknown as SVG;
};

describe('layered falls back to dagre', () => {
  beforeEach(() => {
    // jsdom does not lay out SVG; measuring needs a box to read.
    (SVGElement.prototype as unknown as { getBBox: () => DOMRect }).getBBox = () =>
      ({ x: 0, y: 0, width: 40, height: 20 }) as DOMRect;
    engineFailure.on = true;
    dagreRender.mockReset();
    dagreRender.mockResolvedValue(undefined);
  });
  afterEach(() => {
    engineFailure.on = false;
    beforeCore.hook = undefined;
    // Back to what the unit-test setup sets for every spec.
    setLayeredThrowsOnFailure(true);
  });

  // Runs first, before any test here touches the flag.
  it('throws under the unit tests, so bugs cannot hide behind the fallback', async () => {
    await expect(render(layoutData(), svgRoot())).rejects.toThrow('forced layered failure');
    expect(dagreRender).not.toHaveBeenCalled();
  });

  it('renders with dagre and warns why when the engine throws', async () => {
    setLayeredThrowsOnFailure(false);
    const warn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    const svg = svgRoot();
    const data = layoutData();

    await expect(render(data, svg)).resolves.toBeUndefined();

    expect(dagreRender).toHaveBeenCalledTimes(1);
    const [handed, handedSvg] = dagreRender.mock.calls[0];
    expect(handed).toBe(data);
    expect(handedSvg).toBe(svg);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('forced layered failure'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('dagre'));
  });

  it('hands dagre the diagram as it was before the layered attempt', async () => {
    setLayeredThrowsOnFailure(false);
    vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    const svg = svgRoot();
    const data = layoutData();
    let seen:
      | { layoutAlgorithm: string; nodes: Node[]; edges: Edge[]; children: number }
      | undefined;
    dagreRender.mockImplementation((d: LayoutData, s: SVG) => {
      seen = {
        layoutAlgorithm: d.layoutAlgorithm,
        nodes: d.nodes.map((n) => ({ ...n })),
        edges: d.edges.map((e) => ({ ...e })),
        children: (s.select('g').node() as SVGGElement).childElementCount,
      };
      return Promise.resolve();
    });

    await render(data, svg);

    // The failed attempt drew markers and measured nodes into the group; none of it may linger.
    expect(seen?.children).toBe(0);
    expect(seen?.layoutAlgorithm).toBe('dagre');
    expect(seen?.nodes).toEqual(layoutData().nodes);
    expect(seen?.edges).toEqual(layoutData().edges);
  });

  it('undoes changes the attempt made inside nested fields', async () => {
    setLayeredThrowsOnFailure(false);
    vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    const withNested = (): LayoutData => {
      const d = layoutData();
      d.nodes[0].labelBBox = { width: 10, height: 5 };
      d.nodes[0].cssStyles = ['fill:red'];
      d.edges[0].points = [
        { x: 0, y: 0 },
        { x: 0, y: 40 },
      ];
      return d;
    };
    const data = withNested();
    beforeCore.hook = (d) => {
      d.nodes[0].labelBBox!.width = 99;
      d.nodes[0].cssStyles!.push('stroke:blue');
      d.edges[0].points![0].x = 7;
      d.edges[0].points!.push({ x: 9, y: 9 });
    };
    let seen: { nodes: Node[]; edges: Edge[] } | undefined;
    dagreRender.mockImplementation((d: LayoutData) => {
      seen = structuredClone({ nodes: d.nodes, edges: d.edges });
      return Promise.resolve();
    });

    await render(data, svgRoot());

    expect(seen?.nodes).toEqual(withNested().nodes);
    expect(seen?.edges).toEqual(withNested().edges);
  });

  it("passes the caller's render options on to dagre", async () => {
    setLayeredThrowsOnFailure(false);
    vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    const options = { algorithm: 'layered' };

    await render(layoutData(), svgRoot(), undefined, options);

    expect(dagreRender.mock.calls[0][3]).toBe(options);
  });

  it('lets the error through when the test-only flag is set', async () => {
    setLayeredThrowsOnFailure(false);
    setLayeredThrowsOnFailure(true);

    await expect(render(layoutData(), svgRoot())).rejects.toThrow('forced layered failure');
    expect(dagreRender).not.toHaveBeenCalled();
  });
});
