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
      expect(edges[0].stroke).toBe('normal');
      expect(edges[0].text).toBe('text');
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
      expect(edges[0].stroke).toBe('thick');
      expect(edges[0].text).toBe('');
    });

    it('should handle double edged nodes with text on thick arrows XYZ1', function() {
      const res = flow.parser.parse('graph TD;\nA x== text ==x B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert['A'].id).toBe('A');
      expect(vert['B'].id).toBe('B');
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('A');
      expect(edges[0].end).toBe('B');
      expect(edges[0].type).toBe('double_arrow_cross');
      expect(edges[0].stroke).toBe('thick');
      expect(edges[0].text).toBe('text');
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
      expect(edges[0].stroke).toBe('dotted');
      expect(edges[0].text).toBe('');
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
      expect(edges[0].stroke).toBe('dotted');
      expect(edges[0].text).toBe('text');
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
      expect(edges[0].stroke).toBe('normal');
      expect(edges[0].text).toBe('text');
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
      expect(edges[0].stroke).toBe('thick');
      expect(edges[0].text).toBe('');
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
      expect(edges[0].stroke).toBe('thick');
      expect(edges[0].text).toBe('text');
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
      expect(edges[0].stroke).toBe('dotted');
      expect(edges[0].text).toBe('');
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
      expect(edges[0].stroke).toBe('dotted');
      expect(edges[0].text).toBe('text');
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
    expect(edges[0].text).toBe('This is the 123 s text');
    expect(edges[1].start).toBe('A');
    expect(edges[1].end).toBe('B');
    expect(edges[1].text).toBe('This is the second edge');
  });
});
