import { FlowDB } from '../flowDb.js';
import flow from './flowParserAdapter.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('[Chevrotain Edges] when parsing', () => {
  beforeEach(function () {
    flow.yy = new FlowDB();
    flow.yy.clear();
  });

  it('should handle a single edge', function () {
    const res = flow.parse('graph TD;A-->B;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
  });

  it('should handle multiple edges', function () {
    const res = flow.parse('graph TD;A-->B;B-->C;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(vert.get('C').id).toBe('C');
    expect(edges.length).toBe(2);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[1].start).toBe('B');
    expect(edges[1].end).toBe('C');
  });

  it('should handle chained edges', function () {
    const res = flow.parse('graph TD;A-->B-->C;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(vert.get('C').id).toBe('C');
    expect(edges.length).toBe(2);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[1].start).toBe('B');
    expect(edges[1].end).toBe('C');
  });

  it('should handle edges with text', function () {
    const res = flow.parse('graph TD;A-->|text|B;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].text).toBe('text');
  });

  it('should handle edges with quoted text', function () {
    const res = flow.parse('graph TD;A-->|"quoted text"|B;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].text).toBe('quoted text');
  });

  it('should handle edges with complex text', function () {
    const res = flow.parse('graph TD;A-->|"text with spaces and symbols!"|B;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].text).toBe('text with spaces and symbols!');
  });

  it('should handle multiple edges from one node', function () {
    const res = flow.parse('graph TD;A-->B;A-->C;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(vert.get('C').id).toBe('C');
    expect(edges.length).toBe(2);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[1].start).toBe('A');
    expect(edges[1].end).toBe('C');
  });

  it('should handle multiple edges to one node', function () {
    const res = flow.parse('graph TD;A-->C;B-->C;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(vert.get('C').id).toBe('C');
    expect(edges.length).toBe(2);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('C');
    expect(edges[1].start).toBe('B');
    expect(edges[1].end).toBe('C');
  });

  it('should handle edges with node shapes', function () {
    const res = flow.parse('graph TD;A[Start]-->B{Decision};');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('A').type).toBe('square');
    expect(vert.get('A').text).toBe('Start');
    expect(vert.get('B').id).toBe('B');
    expect(vert.get('B').type).toBe('diamond');
    expect(vert.get('B').text).toBe('Decision');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
  });

  it('should handle complex edge patterns', function () {
    const res = flow.parse('graph TD;A[Start]-->B{Decision};B-->|Yes|C[Process];B-->|No|D[End];');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(edges.length).toBe(3);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[1].start).toBe('B');
    expect(edges[1].end).toBe('C');
    expect(edges[1].text).toBe('Yes');
    expect(edges[2].start).toBe('B');
    expect(edges[2].end).toBe('D');
    expect(edges[2].text).toBe('No');
  });

  it('should handle edges with ampersand syntax', function () {
    const res = flow.parse('graph TD;A & B --> C;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(vert.get('C').id).toBe('C');
    expect(edges.length).toBe(2);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('C');
    expect(edges[1].start).toBe('B');
    expect(edges[1].end).toBe('C');
  });

  it('should handle edges with multiple ampersands', function () {
    const res = flow.parse('graph TD;A & B & C --> D;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(vert.get('C').id).toBe('C');
    expect(vert.get('D').id).toBe('D');
    expect(edges.length).toBe(3);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('D');
    expect(edges[1].start).toBe('B');
    expect(edges[1].end).toBe('D');
    expect(edges[2].start).toBe('C');
    expect(edges[2].end).toBe('D');
  });

  it('should handle self-referencing edges', function () {
    const res = flow.parse('graph TD;A-->A;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('A');
  });

  it('should handle edges with numeric node IDs', function () {
    const res = flow.parse('graph TD;1-->2;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('1').id).toBe('1');
    expect(vert.get('2').id).toBe('2');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('1');
    expect(edges[0].end).toBe('2');
  });

  it('should handle edges with mixed alphanumeric node IDs', function () {
    const res = flow.parse('graph TD;A1-->B2;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A1').id).toBe('A1');
    expect(vert.get('B2').id).toBe('B2');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A1');
    expect(edges[0].end).toBe('B2');
  });
});
