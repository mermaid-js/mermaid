import { describe, expect } from 'vitest';
import { jsdomIt } from '../../../tests/util.js';
import type { D3Selection } from '../../../types.js';
import type { LayoutData } from '../../types.js';
import { applyLayeredLineJumps } from './lineHops.js';

// Issue #8835: the layered layout draws a hop where two edges cross, as ELK does.

const originalPath = 'M4,20 L83.029,20 Q100,20 100,36.971 L100,96';
const arc = 'M4,20 L34,20 A6,6 0 0 1 46,20 L83.029,20 Q100,20 100,36.971 L100,96';
const gap = 'M4,20 L34,20 M46,20 L83.029,20 Q100,20 100,36.971 L100,96';

// Two drawn edges that cross at (40, 20), and one with no route.
function crossing(svg: D3Selection<SVGElement>, lineHops?: boolean | 'arc' | 'gap') {
  const group = svg.append('g');
  const horizontal = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  horizontal.setAttribute('data-id', 'horizontal');
  horizontal.setAttribute('d', originalPath);
  horizontal.setAttribute('marker-start', 'url(#start)');
  horizontal.setAttribute('marker-end', 'url(#end)');
  const vertical = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  vertical.setAttribute('data-id', 'vertical');
  vertical.setAttribute('d', 'M40,0 L40,60');
  group.node()!.append(horizontal, vertical);

  const data = {
    nodes: [],
    edges: [
      {
        id: 'horizontal',
        points: [
          { x: 0, y: 20 },
          { x: 100, y: 20 },
          { x: 100, y: 100 },
        ],
        curve: 'rounded',
        cornerRadius: 12,
        arrowTypeStart: 'arrow_point',
        arrowTypeEnd: 'arrow_point',
      },
      {
        id: 'vertical',
        points: [
          { x: 40, y: 0 },
          { x: 40, y: 60 },
        ],
        curve: 'rounded',
      },
      { id: 'unrouted' },
    ],
    config: { layered: lineHops === undefined ? {} : { lineHops } },
  } as unknown as LayoutData;
  const context = {
    element: svg,
    measure: { groups: { edgePaths: group } },
  };
  return { data, context, horizontal, vertical };
}

describe('layered line hops', () => {
  for (const { setting, expected } of [
    { setting: undefined, expected: arc },
    { setting: true as const, expected: arc },
    { setting: 'arc' as const, expected: arc },
    { setting: 'gap' as const, expected: gap },
    { setting: false as const, expected: originalPath },
  ]) {
    jsdomIt(`draws crossings with lineHops=${setting}`, ({ body }) => {
      const { data, context, horizontal, vertical } = crossing(
        body.select<SVGElement>('svg'),
        setting
      );

      applyLayeredLineJumps(data, context as never);

      expect(horizontal.getAttribute('d')).toBe(expected);
      // The edge that passes over keeps its path, and markers stay on the one that hops.
      expect(vertical.getAttribute('d')).toBe('M40,0 L40,60');
      expect(horizontal.getAttribute('marker-start')).toBe('url(#start)');
      expect(horizontal.getAttribute('marker-end')).toBe('url(#end)');
    });
  }

  // `edgeRouting: curved` keeps the edge's own curve, such as `basis`.
  jsdomIt('leaves smoothing curves unchanged', ({ body }) => {
    const { data, context, horizontal, vertical } = crossing(body.select<SVGElement>('svg'));
    for (const edge of data.edges) {
      edge.curve = 'basis';
    }
    const smoothedPath = 'M4,20 C50,20 100,20 100,96';
    horizontal.setAttribute('d', smoothedPath);

    applyLayeredLineJumps(data, context as never);

    expect(horizontal.getAttribute('d')).toBe(smoothedPath);
    expect(vertical.getAttribute('d')).toBe('M40,0 L40,60');
  });
});
