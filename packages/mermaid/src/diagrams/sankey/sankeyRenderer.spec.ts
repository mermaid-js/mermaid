import { describe, it, expect, beforeEach } from 'vitest';
import { draw } from './sankeyRenderer.js';
import { select as d3select } from 'd3';
import { setConfig } from '../../config.js';
import type { DiagramDB } from '../../diagram-api/types.js';
import type { Selection } from 'd3';
import type { Diagram } from '../../Diagram.js';

// Extend DiagramDB to include Sankey-specific methods
interface SankeyDB extends DiagramDB {
  getGraph(): {
    nodes: { id: string }[];
    links: { source: string; target: string; value: number }[];
  };
}

interface SankeyDB extends DiagramDB {
  getGraph: () => {
    nodes: { id: string }[];
    links: { source: string; target: string; value: number }[];
  };
}

describe('Sankey Renderer', () => {
  let svg: Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  const mockDiagramText = `sankey
    A --> B
    B --> C`;

  beforeEach(() => {
    // Create a fresh SVG for each test
    document.body.innerHTML = '<div id="container"><svg></svg></div>';
    svg = d3select('svg');
  });

  it('should maintain consistent link thickness regardless of showValues setting', () => {
    // Test with showValues: false
    setConfig({
      sankey: {
        showValues: false,
      },
    });
    const mockDiagram: Diagram = {
      db: getMockDb(),
      type: 'sankey',
      parser: {
        parse: async () => {
          /* empty */
        },
      },
      renderer: {
        draw: async () => {
          /* empty */
        },
      },
      text: mockDiagramText,
      render: async () => {
        /* empty */
      },
      getParser: () => ({
        parse: async () => {
          /* empty */
        },
      }),
      getType: () => 'sankey',
    };
    const linksWithoutValues = svg.selectAll('path');
    const thicknessWithoutValues = linksWithoutValues.nodes().map((path) => {
      return (path as SVGPathElement).getBBox().height;
    });

    // Test with showValues: true
    setConfig({
      sankey: {
        showValues: true,
      },
    });
    document.body.innerHTML = '<div id="container"><svg></svg></div>';
    svg = d3select('svg');
    draw(mockDiagramText, 'svg', '1.0.0', mockDiagram);
    const linksWithValues = svg.selectAll('path');
    const thicknessWithValues = linksWithValues
      .nodes()
      .map((path) => (path as SVGPathElement).getBBox().height);

    // Compare thicknesses - they should be within 1px of each other
    thicknessWithoutValues.forEach((thickness: number, i: number) => {
      const difference = Math.abs(thickness - thicknessWithValues[i]);
      expect(difference).toBeLessThanOrEqual(1);
    });
  });
});

function getMockDb(): SankeyDB {
  return {
    clear: () => {
      /* clear */
    },
    getConfig: () => undefined,
    setDiagramTitle: () => {
      /* set title */
    },
    getDiagramTitle: () => '',
    setAccTitle: () => {
      /* set acc title */
    },
    getAccTitle: () => '',
    setAccDescription: () => {
      /* set acc description */
    },
    getAccDescription: () => '',
    bindFunctions: () => {
      /* bind functions */
    },
    getGraph: () => ({
      nodes: [{ id: 'A' }, { id: 'B' }, { id: 'C' }],
      links: [
        { source: 'A', target: 'B', value: 5 },
        { source: 'B', target: 'C', value: 5 },
      ],
    }),
  };
}
