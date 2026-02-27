import { FlowDB } from '../flowDb.js';
import flow from './flowParser.ts';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('[Arrows] when parsing', () => {
  beforeEach(function () {
    flow.parser.yy = new FlowDB();
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

  describe('Issue #2492: Node names starting with o/x should not be consumed by arrow markers', () => {
    it('should handle node names starting with "o" after plain arrows', function () {
      const res = flow.parser.parse('graph TD;\ndev---ops;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert.get('dev').id).toBe('dev');
      expect(vert.get('ops').id).toBe('ops');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('dev');
      expect(edges[0].end).toBe('ops');
      expect(edges[0].type).toBe('arrow_open');
      expect(edges[0].stroke).toBe('normal');
    });

    it('should handle node names starting with "x" after plain arrows', function () {
      const res = flow.parser.parse('graph TD;\ndev---xerxes;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert.get('dev').id).toBe('dev');
      expect(vert.get('xerxes').id).toBe('xerxes');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('dev');
      expect(edges[0].end).toBe('xerxes');
      expect(edges[0].type).toBe('arrow_open');
      expect(edges[0].stroke).toBe('normal');
    });

    it('should still support circle arrows with spaces', function () {
      const res = flow.parser.parse('graph TD;\nA --o B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert.get('A').id).toBe('A');
      expect(vert.get('B').id).toBe('B');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('A');
      expect(edges[0].end).toBe('B');
      expect(edges[0].type).toBe('arrow_circle');
      expect(edges[0].stroke).toBe('normal');
    });

    it('should still support cross arrows with spaces', function () {
      const res = flow.parser.parse('graph TD;\nC --x D;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert.get('C').id).toBe('C');
      expect(vert.get('D').id).toBe('D');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('C');
      expect(edges[0].end).toBe('D');
      expect(edges[0].type).toBe('arrow_cross');
      expect(edges[0].stroke).toBe('normal');
    });

    it('should support circle arrows to uppercase nodes without spaces', function () {
      const res = flow.parser.parse('graph TD;\nA--oB;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert.get('A').id).toBe('A');
      expect(vert.get('B').id).toBe('B');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('A');
      expect(edges[0].end).toBe('B');
      expect(edges[0].type).toBe('arrow_circle');
      expect(edges[0].stroke).toBe('normal');
    });

    it('should support cross arrows to uppercase nodes without spaces', function () {
      const res = flow.parser.parse('graph TD;\nA--xBar;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert.get('A').id).toBe('A');
      expect(vert.get('Bar').id).toBe('Bar');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('A');
      expect(edges[0].end).toBe('Bar');
      expect(edges[0].type).toBe('arrow_cross');
      expect(edges[0].stroke).toBe('normal');
    });

    it('should handle thick arrows with lowercase node names starting with "o"', function () {
      const res = flow.parser.parse('graph TD;\nalpha===omega;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert.get('alpha').id).toBe('alpha');
      expect(vert.get('omega').id).toBe('omega');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('alpha');
      expect(edges[0].end).toBe('omega');
      expect(edges[0].type).toBe('arrow_open');
      expect(edges[0].stroke).toBe('thick');
    });

    it('should handle dotted arrows with lowercase node names starting with "o"', function () {
      const res = flow.parser.parse('graph TD;\nfoo-.-opus;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert.get('foo').id).toBe('foo');
      expect(vert.get('opus').id).toBe('opus');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('foo');
      expect(edges[0].end).toBe('opus');
      expect(edges[0].type).toBe('arrow_open');
      expect(edges[0].stroke).toBe('dotted');
    });

    it('should still support dotted circle arrows with spaces', function () {
      const res = flow.parser.parse('graph TD;\nB -.-o C;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert.get('B').id).toBe('B');
      expect(vert.get('C').id).toBe('C');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('B');
      expect(edges[0].end).toBe('C');
      expect(edges[0].type).toBe('arrow_circle');
      expect(edges[0].stroke).toBe('dotted');
    });

    it('should still support thick cross arrows with spaces', function () {
      const res = flow.parser.parse('graph TD;\nC ==x D;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert.get('C').id).toBe('C');
      expect(vert.get('D').id).toBe('D');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('C');
      expect(edges[0].end).toBe('D');
      expect(edges[0].type).toBe('arrow_cross');
      expect(edges[0].stroke).toBe('thick');
    });
  });
});
