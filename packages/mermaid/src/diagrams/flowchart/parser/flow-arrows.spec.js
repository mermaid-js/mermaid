import flowDb from '../flowDb.js';
import flow from './flow.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('[Arrows] when parsing', () => {
  beforeEach(function () {
    flow.parser.yy = flowDb;
    flow.parser.yy.clear();
  });

  it('should handle a nodes and edges', function () {
    const res = flow.parser.parse('graph TD;\nA-->B;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
    expect(edges[0].stroke).toBe('normal');
    expect(edges[0].length).toBe(1);
  });

  it("should handle angle bracket ' > ' as direction LR", function () {
    const res = flow.parser.parse('graph >;A-->B;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();
    const direction = flow.parser.yy.getDirection();

    expect(direction).toBe('LR');

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
    expect(edges[0].stroke).toBe('normal');
    expect(edges[0].length).toBe(1);
  });

  it("should handle angle bracket ' < ' as direction RL", function () {
    const res = flow.parser.parse('graph <;A-->B;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();
    const direction = flow.parser.yy.getDirection();

    expect(direction).toBe('RL');

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
    expect(edges[0].stroke).toBe('normal');
    expect(edges[0].length).toBe(1);
  });

  it("should handle caret ' ^ ' as direction BT", function () {
    const res = flow.parser.parse('graph ^;A-->B;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();
    const direction = flow.parser.yy.getDirection();

    expect(direction).toBe('BT');

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].length).toBe(1);
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
    expect(edges[0].stroke).toBe('normal');
    expect(edges[0].length).toBe(1);
  });

  it("should handle lower-case 'v' as direction TB", function () {
    const res = flow.parser.parse('graph v;A-->B;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();
    const direction = flow.parser.yy.getDirection();

    expect(direction).toBe('TB');

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
    expect(edges[0].stroke).toBe('normal');
    expect(edges[0].length).toBe(1);
  });

  it('should handle a nodes and edges and a space between link and node', function () {
    const res = flow.parser.parse('graph TD;A --> B;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
    expect(edges[0].stroke).toBe('normal');
    expect(edges[0].length).toBe(1);
  });

  it('should handle a nodes and edges, a space between link and node and each line ending without semicolon', function () {
    const res = flow.parser.parse('graph TD\nA --> B\n style e red');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
    expect(edges[0].stroke).toBe('normal');
    expect(edges[0].length).toBe(1);
  });

  it('should handle statements ending without semicolon', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nB-->C');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('B').id).toBe('B');
    expect(edges.length).toBe(2);
    expect(edges[1].start).toBe('B');
    expect(edges[1].end).toBe('C');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
    expect(edges[0].stroke).toBe('normal');
    expect(edges[0].length).toBe(1);
  });

  describe('it should handle multi directional arrows', function () {
    describe('point', function () {
      it('should handle double edged nodes and edges', function () {
        const res = flow.parser.parse('graph TD;\nA<-->B;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert.get('A').id).toBe('A');
        expect(vert.get('B').id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(1);
      });

      it('should handle double edged nodes with text', function () {
        const res = flow.parser.parse('graph TD;\nA<-- text -->B;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert.get('A').id).toBe('A');
        expect(vert.get('B').id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('text');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(1);
      });

      it('should handle double edged nodes and edges on thick arrows', function () {
        const res = flow.parser.parse('graph TD;\nA<==>B;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert.get('A').id).toBe('A');
        expect(vert.get('B').id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('thick');
        expect(edges[0].length).toBe(1);
      });

      it('should handle double edged nodes with text on thick arrows', function () {
        const res = flow.parser.parse('graph TD;\nA<== text ==>B;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert.get('A').id).toBe('A');
        expect(vert.get('B').id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('text');
        expect(edges[0].stroke).toBe('thick');
        expect(edges[0].length).toBe(1);
      });

      it('should handle double edged nodes and edges on dotted arrows', function () {
        const res = flow.parser.parse('graph TD;\nA<-.->B;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert.get('A').id).toBe('A');
        expect(vert.get('B').id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('dotted');
        expect(edges[0].length).toBe(1);
      });

      it('should handle double edged nodes with text on dotted arrows', function () {
        const res = flow.parser.parse('graph TD;\nA<-. text .->B;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert.get('A').id).toBe('A');
        expect(vert.get('B').id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('text');
        expect(edges[0].stroke).toBe('dotted');
        expect(edges[0].length).toBe(1);
      });
    });
  });
});
