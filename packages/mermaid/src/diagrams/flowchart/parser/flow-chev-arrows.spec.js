import { FlowDB } from '../flowDb.js';
import flow from './flowParserAdapter.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('[Chevrotain Arrows] when parsing', () => {
  beforeEach(function () {
    flow.yy = new FlowDB();
    flow.yy.clear();
  });

  it('should handle basic arrow', function () {
    const res = flow.parse('graph TD;A-->B;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
  });

  it('should handle arrow with text', function () {
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

  it('should handle dotted arrow', function () {
    const res = flow.parse('graph TD;A-.->B;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_dotted');
  });

  it('should handle dotted arrow with text', function () {
    const res = flow.parse('graph TD;A-.-|text|B;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].text).toBe('text');
    expect(edges[0].type).toBe('arrow_dotted');
  });

  it('should handle thick arrow', function () {
    const res = flow.parse('graph TD;A==>B;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_thick');
  });

  it('should handle thick arrow with text', function () {
    const res = flow.parse('graph TD;A==|text|==>B;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].text).toBe('text');
    expect(edges[0].type).toBe('arrow_thick');
  });

  it('should handle open arrow', function () {
    const res = flow.parse('graph TD;A---B;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_open');
  });

  it('should handle open arrow with text', function () {
    const res = flow.parse('graph TD;A---|text|B;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].text).toBe('text');
    expect(edges[0].type).toBe('arrow_open');
  });

  it('should handle cross arrow', function () {
    const res = flow.parse('graph TD;A--xB;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_cross');
  });

  it('should handle circle arrow', function () {
    const res = flow.parse('graph TD;A--oB;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_circle');
  });

  it('should handle bidirectional arrow', function () {
    const res = flow.parse('graph TD;A<-->B;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('double_arrow_point');
  });

  it('should handle bidirectional arrow with text', function () {
    const res = flow.parse('graph TD;A<--|text|-->B;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].text).toBe('text');
    expect(edges[0].type).toBe('double_arrow_point');
  });

  it('should handle multiple arrows in sequence', function () {
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

  it('should handle multiple arrows with different types', function () {
    const res = flow.parse('graph TD;A-->B-.->C==>D;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(edges.length).toBe(3);
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[1].type).toBe('arrow_dotted');
    expect(edges[2].type).toBe('arrow_thick');
  });

  it('should handle long arrows', function () {
    const res = flow.parse('graph TD;A---->B;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].length).toBe('long');
  });

  it('should handle extra long arrows', function () {
    const res = flow.parse('graph TD;A------>B;');

    const vert = flow.yy.getVertices();
    const edges = flow.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].length).toBe('extralong');
  });
});
