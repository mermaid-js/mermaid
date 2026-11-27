import { describe, expect } from 'vitest';
import { jsdomIt } from '../../../tests/util.js';
import type { D3Selection } from '../../../types.js';
import type { LayoutData } from '../../types.js';
import { applyGridLineJumps } from './lineHops.js';

const originalPath = 'M4,20 L83.029,20 Q100,20 100,36.971 L100,96';

function crossing(svg: D3Selection<SVGElement>, lineHops?: false | 'arc' | 'gap') {
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

  const data: LayoutData = {
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
    config: { grid: { lineHops } },
  };
  const context = {
    element: svg,
    measure: { groups: { edgePaths: group } },
  };
  return { data, context, horizontal, vertical };
}

describe('grid line hops', () => {
  for (const { setting, expected } of [
    {
      setting: undefined,
      expected: 'M4,20 L34,20 A6,6 0 0 1 46,20 L83.029,20 Q100,20 100,36.971 L100,96',
    },
    {
      setting: 'arc' as const,
      expected: 'M4,20 L34,20 A6,6 0 0 1 46,20 L83.029,20 Q100,20 100,36.971 L100,96',
    },
    {
      setting: 'gap' as const,
      expected: 'M4,20 L34,20 M46,20 L83.029,20 Q100,20 100,36.971 L100,96',
    },
    { setting: false as const, expected: originalPath },
  ]) {
    jsdomIt(`draws crossings with lineHops=${setting}`, ({ body }) => {
      const { data, context, horizontal, vertical } = crossing(
        body.select<SVGElement>('svg'),
        setting
      );

      applyGridLineJumps(data, context);

      expect(horizontal.getAttribute('d')).toBe(expected);
      expect(vertical.getAttribute('d')).toBe('M40,0 L40,60');
      expect(horizontal.getAttribute('marker-start')).toBe('url(#start)');
      expect(horizontal.getAttribute('marker-end')).toBe('url(#end)');
    });
  }

  jsdomIt('leaves smoothing curves unchanged', ({ body }) => {
    const { data, context, horizontal, vertical } = crossing(body.select<SVGElement>('svg'));
    for (const edge of data.edges) {
      edge.curve = 'basis';
    }
    const smoothedPath = 'M4,20 C50,20 100,20 100,96';
    horizontal.setAttribute('d', smoothedPath);

    applyGridLineJumps(data, context);

    expect(horizontal.getAttribute('d')).toBe(smoothedPath);
    expect(vertical.getAttribute('d')).toBe('M40,0 L40,60');
  });
});
