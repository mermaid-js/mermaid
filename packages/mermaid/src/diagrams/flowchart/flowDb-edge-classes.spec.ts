import { select } from 'd3';
import { FlowDB } from './flowDb.js';
import flow from './parser/flowParser.js';
import { insertEdge } from '../../rendering-util/rendering-elements/edges.js';

describe('flowchart edge classes', () => {
  const renderedClasses = (text: string): string[][] => {
    const flowDb = new FlowDB();
    flow.parser.yy = flowDb;
    flow.parser.parse(text);

    document.body.innerHTML = '';
    const svg = select(document.body).append('svg');
    const shape = { intersect: (point: { x: number; y: number }) => point };

    return flowDb.getData().edges.map((edge) => {
      edge.points = [
        { x: 0, y: 0 },
        { x: 0, y: 50 },
        { x: 0, y: 100 },
      ];
      insertEdge(svg, edge, null, 'flowchart', shape, shape, 'diagram');
      return svg.select(`path[id="diagram-${edge.id}"]`).attr('class').trim().split(/\s+/);
    });
  };

  it('should give thick and dotted edges a single thickness and pattern class', () => {
    const [thick, dotted] = renderedClasses('flowchart LR\nA ==> B\nC -.-> D');

    expect(thick.filter((c) => c.startsWith('edge-thickness-'))).toEqual(['edge-thickness-thick']);
    expect(thick.filter((c) => c.startsWith('edge-pattern-'))).toEqual(['edge-pattern-solid']);
    expect(dotted.filter((c) => c.startsWith('edge-thickness-'))).toEqual([
      'edge-thickness-normal',
    ]);
    expect(dotted.filter((c) => c.startsWith('edge-pattern-'))).toEqual(['edge-pattern-dotted']);
    expect(thick).toContain('flowchart-link');
    expect(dotted).toContain('flowchart-link');
  });
});
