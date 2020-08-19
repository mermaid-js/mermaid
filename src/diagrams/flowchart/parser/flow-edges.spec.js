import flowDb from '../flowDb';
import flow from './flow';
import { setConfig } from '../../../config';

setConfig({
  securityLevel: 'strict'
});

describe('[Edges] when parsing', () => {
  beforeEach(function() {
    flow.parser.yy = flowDb;
    flow.parser.yy.clear();
  });

  it('should handle open ended edges', function() {
    const res = flow.parser.parse('graph TD;A---B;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_open');
  });

  it('should handle cross ended edges', function() {
    const res = flow.parser.parse('graph TD;A--xB;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_cross');
  });

  it('should handle open ended edges', function() {
    const res = flow.parser.parse('graph TD;A--oB;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_circle');
  });

  describe('cross', function() {
    it('should handle double edged nodes and edges', function() {
      const res = flow.parser.parse('graph TD;\nA x--x B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert['A'].id).toBe('A');
      expect(vert['B'].id).toBe('B');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('A');
      expect(edges[0].end).toBe('B');
      expect(edges[0].type).toBe('double_arrow_cross');
      expect(edges[0].text).toBe('');
      expect(edges[0].stroke).toBe('normal');
      expect(edges[0].length).toBe(1);
    });

    it('should handle double edged nodes with text', function() {
      const res = flow.parser.parse('graph TD;\nA x-- text --x B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert['A'].id).toBe('A');
      expect(vert['B'].id).toBe('B');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('A');
      expect(edges[0].end).toBe('B');
      expect(edges[0].type).toBe('double_arrow_cross');
      expect(edges[0].text).toBe('text');
      expect(edges[0].stroke).toBe('normal');
      expect(edges[0].length).toBe(1);
    });

    it('should handle double edged nodes and edges on thick arrows', function() {
      const res = flow.parser.parse('graph TD;\nA x==x B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert['A'].id).toBe('A');
      expect(vert['B'].id).toBe('B');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('A');
      expect(edges[0].end).toBe('B');
      expect(edges[0].type).toBe('double_arrow_cross');
      expect(edges[0].text).toBe('');
      expect(edges[0].stroke).toBe('thick');
      expect(edges[0].length).toBe(1);
    });

    it('should handle double edged nodes with text on thick arrows', function() {
      const res = flow.parser.parse('graph TD;\nA x== text ==x B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert['A'].id).toBe('A');
      expect(vert['B'].id).toBe('B');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('A');
      expect(edges[0].end).toBe('B');
      expect(edges[0].type).toBe('double_arrow_cross');
      expect(edges[0].text).toBe('text');
      expect(edges[0].stroke).toBe('thick');
      expect(edges[0].length).toBe(1);
    });

    it('should handle double edged nodes and edges on dotted arrows', function() {
      const res = flow.parser.parse('graph TD;\nA x-.-x B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert['A'].id).toBe('A');
      expect(vert['B'].id).toBe('B');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('A');
      expect(edges[0].end).toBe('B');
      expect(edges[0].type).toBe('double_arrow_cross');
      expect(edges[0].text).toBe('');
      expect(edges[0].stroke).toBe('dotted');
      expect(edges[0].length).toBe(1);
    });

    it('should handle double edged nodes with text on dotted arrows', function() {
      const res = flow.parser.parse('graph TD;\nA x-. text .-x B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert['A'].id).toBe('A');
      expect(vert['B'].id).toBe('B');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('A');
      expect(edges[0].end).toBe('B');
      expect(edges[0].type).toBe('double_arrow_cross');
      expect(edges[0].text).toBe('text');
      expect(edges[0].stroke).toBe('dotted');
      expect(edges[0].length).toBe(1);
    });
  });

  describe('circle', function() {
    it('should handle double edged nodes and edges', function() {
      const res = flow.parser.parse('graph TD;\nA o--o B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert['A'].id).toBe('A');
      expect(vert['B'].id).toBe('B');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('A');
      expect(edges[0].end).toBe('B');
      expect(edges[0].type).toBe('double_arrow_circle');
      expect(edges[0].text).toBe('');
      expect(edges[0].stroke).toBe('normal');
      expect(edges[0].length).toBe(1);
    });

    it('should handle double edged nodes with text', function() {
      const res = flow.parser.parse('graph TD;\nA o-- text --o B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert['A'].id).toBe('A');
      expect(vert['B'].id).toBe('B');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('A');
      expect(edges[0].end).toBe('B');
      expect(edges[0].type).toBe('double_arrow_circle');
      expect(edges[0].text).toBe('text');
      expect(edges[0].stroke).toBe('normal');
      expect(edges[0].length).toBe(1);
    });

    it('should handle double edged nodes and edges on thick arrows', function() {
      const res = flow.parser.parse('graph TD;\nA o==o B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert['A'].id).toBe('A');
      expect(vert['B'].id).toBe('B');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('A');
      expect(edges[0].end).toBe('B');
      expect(edges[0].type).toBe('double_arrow_circle');
      expect(edges[0].text).toBe('');
      expect(edges[0].stroke).toBe('thick');
      expect(edges[0].length).toBe(1);
    });

    it('should handle double edged nodes with text on thick arrows', function() {
      const res = flow.parser.parse('graph TD;\nA o== text ==o B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert['A'].id).toBe('A');
      expect(vert['B'].id).toBe('B');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('A');
      expect(edges[0].end).toBe('B');
      expect(edges[0].type).toBe('double_arrow_circle');
      expect(edges[0].text).toBe('text');
      expect(edges[0].stroke).toBe('thick');
      expect(edges[0].length).toBe(1);
    });

    it('should handle double edged nodes and edges on dotted arrows', function() {
      const res = flow.parser.parse('graph TD;\nA o-.-o B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert['A'].id).toBe('A');
      expect(vert['B'].id).toBe('B');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('A');
      expect(edges[0].end).toBe('B');
      expect(edges[0].type).toBe('double_arrow_circle');
      expect(edges[0].text).toBe('');
      expect(edges[0].stroke).toBe('dotted');
      expect(edges[0].length).toBe(1);
    });

    it('should handle double edged nodes with text on dotted arrows', function() {
      const res = flow.parser.parse('graph TD;\nA o-. text .-o B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert['A'].id).toBe('A');
      expect(vert['B'].id).toBe('B');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('A');
      expect(edges[0].end).toBe('B');
      expect(edges[0].type).toBe('double_arrow_circle');
      expect(edges[0].text).toBe('text');
      expect(edges[0].stroke).toBe('dotted');
      expect(edges[0].length).toBe(1);
    });
  });

  it('should handle multiple edges', function() {
    const res = flow.parser.parse(
      'graph TD;A---|This is the 123 s text|B;\nA---|This is the second edge|B;'
    );
    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(edges.length).toBe(2);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_open');
    expect(edges[0].text).toBe('This is the 123 s text');
    expect(edges[0].stroke).toBe('normal');
    expect(edges[0].length).toBe(1);
    expect(edges[1].start).toBe('A');
    expect(edges[1].end).toBe('B');
    expect(edges[1].type).toBe('arrow_open');
    expect(edges[1].text).toBe('This is the second edge');
    expect(edges[1].stroke).toBe('normal');
    expect(edges[1].length).toBe(1);
  });

  describe('edge length', function() {
    for (let length = 1; length <= 3; ++length) {
      it(`should handle normal edges with length ${length}`, function() {
        const res = flow.parser.parse(`graph TD;\nA -${'-'.repeat(length)}- B;`);

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_open');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle normal labelled edges with length ${length}`, function() {
        const res = flow.parser.parse(`graph TD;\nA -- Label -${'-'.repeat(length)}- B;`);

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_open');
        expect(edges[0].text).toBe('Label');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle normal edges with arrows with length ${length}`, function() {
        const res = flow.parser.parse(`graph TD;\nA -${'-'.repeat(length)}> B;`);

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_point');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle normal labelled edges with arrows with length ${length}`, function() {
        const res = flow.parser.parse(`graph TD;\nA -- Label -${'-'.repeat(length)}> B;`);

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_point');
        expect(edges[0].text).toBe('Label');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle normal edges with double arrows with length ${length}`, function() {
        const res = flow.parser.parse(`graph TD;\nA <-${'-'.repeat(length)}> B;`);

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle normal labelled edges with double arrows with length ${length}`, function() {
        const res = flow.parser.parse(`graph TD;\nA <-- Label -${'-'.repeat(length)}> B;`);

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('Label');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle thick edges with length ${length}`, function() {
        const res = flow.parser.parse(`graph TD;\nA =${'='.repeat(length)}= B;`);

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_open');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('thick');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle thick labelled edges with length ${length}`, function() {
        const res = flow.parser.parse(`graph TD;\nA == Label =${'='.repeat(length)}= B;`);

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_open');
        expect(edges[0].text).toBe('Label');
        expect(edges[0].stroke).toBe('thick');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle thick edges with arrows with length ${length}`, function() {
        const res = flow.parser.parse(`graph TD;\nA =${'='.repeat(length)}> B;`);

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_point');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('thick');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle thick labelled edges with arrows with length ${length}`, function() {
        const res = flow.parser.parse(`graph TD;\nA == Label =${'='.repeat(length)}> B;`);

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_point');
        expect(edges[0].text).toBe('Label');
        expect(edges[0].stroke).toBe('thick');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle thick edges with double arrows with length ${length}`, function() {
        const res = flow.parser.parse(`graph TD;\nA <=${'='.repeat(length)}> B;`);

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('thick');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle thick labelled edges with double arrows with length ${length}`, function() {
        const res = flow.parser.parse(`graph TD;\nA <== Label =${'='.repeat(length)}> B;`);

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('Label');
        expect(edges[0].stroke).toBe('thick');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle dotted edges with length ${length}`, function() {
        const res = flow.parser.parse(`graph TD;\nA -${'.'.repeat(length)}- B;`);

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_open');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('dotted');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle dotted labelled edges with length ${length}`, function() {
        const res = flow.parser.parse(`graph TD;\nA -. Label ${'.'.repeat(length)}- B;`);

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_open');
        expect(edges[0].text).toBe('Label');
        expect(edges[0].stroke).toBe('dotted');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle dotted edges with arrows with length ${length}`, function() {
        const res = flow.parser.parse(`graph TD;\nA -${'.'.repeat(length)}-> B;`);

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_point');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('dotted');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle dotted labelled edges with arrows with length ${length}`, function() {
        const res = flow.parser.parse(`graph TD;\nA -. Label ${'.'.repeat(length)}-> B;`);

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_point');
        expect(edges[0].text).toBe('Label');
        expect(edges[0].stroke).toBe('dotted');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle dotted edges with double arrows with length ${length}`, function() {
        const res = flow.parser.parse(`graph TD;\nA <-${'.'.repeat(length)}-> B;`);

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('dotted');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle dotted edges with double arrows with length ${length}`, function() {
        const res = flow.parser.parse(`graph TD;\nA <-. Label ${'.'.repeat(length)}-> B;`);

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('Label');
        expect(edges[0].stroke).toBe('dotted');
        expect(edges[0].length).toBe(length);
      });
    }
  });
});
