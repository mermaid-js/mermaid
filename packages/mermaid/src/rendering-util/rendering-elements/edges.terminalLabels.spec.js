import { describe, it, expect, vi } from 'vitest';
import { select } from 'd3';

vi.mock('../../diagram-api/diagramAPI.js', () => ({
  getConfig: vi.fn(() => ({ htmlLabels: false, flowchart: {} })),
}));
vi.mock('../fastdom.js', () => ({ default: { measure: (fn) => Promise.resolve(fn()) } }));

// jsdom has no layout, so give every created label a fixed size.
const svgLabel = (width, height) => {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.getBBox = () => ({ x: 0, y: -12, width, height });
  return g;
};
vi.mock('../createText.js', () => ({ createText: vi.fn(() => Promise.resolve(svgLabel(0, 0))) }));
vi.mock('./createLabel.js', () => ({
  default: vi.fn((parent, text) => {
    const label = svgLabel(text.length * 7, 16.5);
    parent.node().appendChild(label);
    return Promise.resolve(label);
  }),
}));

import { insertEdgeLabel, terminalLabels } from './edges.js';

describe('insertEdgeLabel terminal labels', () => {
  // #8329: end labels were drawn from their top-left corner while start labels were centred,
  // so a long end label ("many") ran past the point it was placed at and under the node.
  it('centres end labels on their group origin, like start labels', async () => {
    const svg = select(document.body).append('svg');
    const edge = { id: 'e', label: '', startLabelRight: '1', endLabelLeft: 'many' };
    await insertEdgeLabel(svg.append('g'), edge);

    const { startRight, endLeft } = terminalLabels.get('e');
    for (const group of [startRight, endLeft]) {
      const inner = group.select('.inner');
      expect(inner.attr('transform')).toMatch(/^translate\(/);
      expect(inner.node().childNodes.length).toBe(1);
    }
    expect(edge.terminalLabelSizes.endLeft).toEqual({ width: 28, height: 16.5 });
  });
});
