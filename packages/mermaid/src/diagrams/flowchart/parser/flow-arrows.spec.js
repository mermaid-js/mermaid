import flowDb from '../flowDb';
import flow from './flow';
import { setConfig } from '../../../config';

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

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].reversed).toBe(false);
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

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].reversed).toBe(false);
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

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].reversed).toBe(false);
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

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].length).toBe(1);
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].reversed).toBe(false);
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

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].reversed).toBe(false);
    expect(edges[0].text).toBe('');
    expect(edges[0].stroke).toBe('normal');
    expect(edges[0].length).toBe(1);
  });

  it('should handle a nodes and edges and a space between link and node', function () {
    const res = flow.parser.parse('graph TD;A --> B;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].reversed).toBe(false);
    expect(edges[0].text).toBe('');
    expect(edges[0].stroke).toBe('normal');
    expect(edges[0].length).toBe(1);
  });

  it('should handle a nodes and edges, a space between link and node and each line ending without semicolon', function () {
    const res = flow.parser.parse('graph TD\nA --> B\n style e red');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].reversed).toBe(false);
    expect(edges[0].text).toBe('');
    expect(edges[0].stroke).toBe('normal');
    expect(edges[0].length).toBe(1);
  });

  it('should handle statements ending without semicolon', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nB-->C');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(edges.length).toBe(2);
    expect(edges[1].start).toBe('B');
    expect(edges[1].end).toBe('C');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].reversed).toBe(false);
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

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].reversed).toBe(false);
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(1);
      });

      it('should handle double edged nodes with text', function () {
        const res = flow.parser.parse('graph TD;\nA<-- text -->B;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].reversed).toBe(false);
        expect(edges[0].text).toBe('text');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(1);
      });

      it('should handle double edged nodes and edges on thick arrows', function () {
        const res = flow.parser.parse('graph TD;\nA<==>B;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].reversed).toBe(false);
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('thick');
        expect(edges[0].length).toBe(1);
      });

      it('should handle double edged nodes with text on thick arrows', function () {
        const res = flow.parser.parse('graph TD;\nA<== text ==>B;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].reversed).toBe(false);
        expect(edges[0].text).toBe('text');
        expect(edges[0].stroke).toBe('thick');
        expect(edges[0].length).toBe(1);
      });

      it('should handle double edged nodes and edges on dotted arrows', function () {
        const res = flow.parser.parse('graph TD;\nA<-.->B;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].reversed).toBe(false);
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('dotted');
        expect(edges[0].length).toBe(1);
      });

      it('should handle double edged nodes with text on dotted arrows', function () {
        const res = flow.parser.parse('graph TD;\nA<-. text .->B;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].reversed).toBe(false);
        expect(edges[0].text).toBe('text');
        expect(edges[0].stroke).toBe('dotted');
        expect(edges[0].length).toBe(1);
      });
    });
  });

  describe('it should handle reversed arrows', function () {
    describe('should handle arrow type variations', function () {
      it('should handle reversed point arrow', function () {
        const res = flow.parser.parse('graph TD;\nA-\\->B;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_point');
        expect(edges[0].reversed).toBe(true);
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(1);
      });

      it('should handle reversed point arrow with text', function () {
        const res = flow.parser.parse('graph TD;\nA-- text -\\->B;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_point');
        expect(edges[0].reversed).toBe(true);
        expect(edges[0].text).toBe('text');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(1);
      });

      it('should handle reversed cross arrows', function () {
        const res = flow.parser.parse('graph TD;\nA-\\-xB;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_cross');
        expect(edges[0].reversed).toBe(true);
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(1);
      });

      it('should handle reversed cross arrows with text', function () {
        const res = flow.parser.parse('graph TD;\nA-- text -\\-xB;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_cross');
        expect(edges[0].reversed).toBe(true);
        expect(edges[0].text).toBe('text');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(1);
      });

      it('should handle reversed circle arrow', function () {
        const res = flow.parser.parse('graph TD;\nA-\\-oB;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_circle');
        expect(edges[0].reversed).toBe(true);
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(1);
      });

      it('should handle reversed circle arrow with text', function () {
        const res = flow.parser.parse('graph TD;\nA-- text -\\-oB;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_circle');
        expect(edges[0].reversed).toBe(true);
        expect(edges[0].text).toBe('text');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(1);
      });
    });
    describe('should handle stroke variations', function () {
      it('should handle reversed simple arrow', function () {
        const res = flow.parser.parse('graph TD;\nA-\\->B;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_point');
        expect(edges[0].reversed).toBe(true);
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(1);
      });

      it('should handle reversed double edged nodes with text', function () {
        const res = flow.parser.parse('graph TD;\nA-- text -\\->B;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_point');
        expect(edges[0].reversed).toBe(true);
        expect(edges[0].text).toBe('text');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(1);
      });

      it('should handle reversed thick arrows', function () {
        const res = flow.parser.parse('graph TD;\nA=\\=>B;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_point');
        expect(edges[0].reversed).toBe(true);
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('thick');
        expect(edges[0].length).toBe(1);
      });

      it('should handle reversed thick arrows with text', function () {
        const res = flow.parser.parse('graph TD;\nA== text =\\=>B;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_point');
        expect(edges[0].reversed).toBe(true);
        expect(edges[0].text).toBe('text');
        expect(edges[0].stroke).toBe('thick');
        expect(edges[0].length).toBe(1);
      });

      it('should handle reversed dotted arrow', function () {
        const res = flow.parser.parse('graph TD;\nA.\\->B;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_point');
        expect(edges[0].reversed).toBe(true);
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('dotted');
        expect(edges[0].length).toBe(1);
      });

      it('should handle reversed dotted arrow with text', function () {
        const res = flow.parser.parse('graph TD;\nA-. text .\\->B;');

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_point');
        expect(edges[0].reversed).toBe(true);
        expect(edges[0].text).toBe('text');
        expect(edges[0].stroke).toBe('dotted');
        expect(edges[0].length).toBe(1);
      });
    });
  });
});
