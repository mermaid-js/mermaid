import flowDb from '../flowDb';
import flow from './flow';
import { setConfig } from '../../../config';

setConfig({
  securityLevel: 'strict'
});

describe('when parsing flowcharts', function() {
  beforeEach(function() {
    flow.parser.yy = flowDb;
    flow.parser.yy.clear();
  });

  it('should handle chaining of vertices', function() {
    const res = flow.parser.parse(`
    graph TD
      A-->B-->C;
    `);

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(vert['C'].id).toBe('C');
    expect(edges.length).toBe(2);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow');
    expect(edges[0].text).toBe('');
    expect(edges[1].start).toBe('B');
    expect(edges[1].end).toBe('C');
    expect(edges[1].type).toBe('arrow');
    expect(edges[1].text).toBe('');
  });
});
