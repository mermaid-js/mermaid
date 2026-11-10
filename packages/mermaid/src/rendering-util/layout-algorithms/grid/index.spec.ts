import { afterEach, describe, expect } from 'vitest';
import { getConfig } from '../../../config.js';
import mermaidAPI from '../../../mermaidAPI.js';
import { jsdomIt } from '../../../tests/util.js';
import { findEdgeIntersections } from '../../rendering-elements/lineJump.js';
import type { Node } from '../../types.js';
import { render } from './index.js';
import type { GridLayoutData } from './types.js';

function node(id: string, row: number, column: number): Node {
  return {
    id,
    label: id,
    shape: 'rect',
    isGroup: false,
    metadata: { row, column },
  };
}

describe('grid renderer line hops', () => {
  afterEach(() => {
    mermaidAPI.initialize({});
  });

  for (const lineHops of [undefined, false] as const) {
    jsdomIt(`paints routed crossings with lineHops=${lineHops}`, async ({ svg }) => {
      mermaidAPI.initialize({ flowchart: { htmlLabels: false } });
      svg.append('g');
      const data: GridLayoutData = {
        type: 'flowchart',
        diagramId: 'grid-line-hops',
        layoutAlgorithm: 'grid',
        markers: ['point'],
        nodes: [node('top', 1, 2), node('bottom', 3, 2), node('left', 2, 1), node('right', 2, 3)],
        edges: [
          { id: 'vertical', start: 'top', end: 'bottom', arrowTypeEnd: 'arrow_point' },
          { id: 'horizontal', start: 'left', end: 'right', arrowTypeEnd: 'arrow_point' },
        ],
        config: {
          ...getConfig(),
          grid: { lineHops, rowGap: 120, columnGap: 120 },
        },
      };

      await render(data, svg);

      const routedEdges = data.edges.flatMap((edge) =>
        edge.points ? [{ ...edge, points: edge.points }] : []
      );
      expect(findEdgeIntersections(routedEdges).length).toBeGreaterThan(0);
      const paths = [...document.querySelectorAll('.edgePaths path[data-id]')];
      expect(paths).toHaveLength(2);
      expect(paths.some((path) => path.getAttribute('d')?.includes('A6,6'))).toBe(
        lineHops !== false
      );
    });
  }
});
