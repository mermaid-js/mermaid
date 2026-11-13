import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { select } from 'd3';
import type { MermaidConfig } from '../../../config.type.js';
import type { SVG } from '../../../diagram-api/types.js';
import { log } from '../../../logger.js';
import type { Edge, LayoutData, Node } from '../../types.js';
import type * as Engine from './index.js';

// The engine refuses the input, as it would for something it cannot lay out.
vi.mock('./index.js', async (importOriginal) => ({
  ...(await importOriginal<typeof Engine>()),
  layered: () => {
    throw new Error('unsupported input');
  },
}));

import { render, setLayeredThrowsOnFailure } from './render.js';

const node = (id: string): Node =>
  ({ id, domId: `diagram-${id}`, shape: 'squareRect', isGroup: false, label: id }) as Node;

describe('layered fallback through the real dagre renderer', () => {
  beforeEach(() => {
    (SVGElement.prototype as unknown as { getBBox: () => DOMRect }).getBBox = () =>
      ({ x: 0, y: 0, width: 40, height: 20 }) as DOMRect;
    setLayeredThrowsOnFailure(false);
  });
  afterEach(() => setLayeredThrowsOnFailure(true));

  it('draws the diagram with dagre instead of failing the render', async () => {
    const warn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    document.body.innerHTML = '<svg id="diagram"><g></g></svg>';
    const svg = select('#diagram') as unknown as SVG;
    const data = {
      nodes: [node('A'), node('B')],
      edges: [
        { id: 'e1', start: 'A', end: 'B', type: 'arrow_point', arrowTypeEnd: 'arrow_point' },
      ] as Edge[],
      config: {} as MermaidConfig,
      direction: 'TB',
      nodeSpacing: 50,
      rankSpacing: 50,
      markers: ['point'],
      type: 'flowchart-v2',
      diagramId: 'diagram',
      layoutAlgorithm: 'layered',
    } as LayoutData;

    await render(data, svg);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('unsupported input'));
    const root = svg.select('g').node() as SVGGElement;
    // One drawing, not the failed attempt's leftovers plus dagre's.
    expect(root.querySelectorAll('#diagram-A').length).toBe(1);
    expect(root.querySelectorAll('#diagram-B').length).toBe(1);
    expect(root.querySelectorAll('path[data-edge="true"]').length).toBe(1);
    // dagre placed the nodes one rank apart.
    const [a, b] = data.nodes;
    expect(b.y! > a.y!).toBe(true);
    // dagre's points, not axis-tagged layered routes.
    expect(data.edges[0].points?.some((p) => 'axis' in p)).toBe(false);
  });
});
