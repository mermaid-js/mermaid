import flowDb from '../flowDb';
import flow from './flow';
import { setConfig } from '../../../config';

setConfig({
  securityLevel: 'strict'
});

describe('when parsing ', function() {
  beforeEach(function() {
    flow.parser.yy = flowDb;
    flow.parser.yy.clear();
  });

  it('it should handle a trailing whitespaces after statememnts', function() {
    const res = flow.parser.parse('graph TD;\n\n\n %% Comment\n A-->B; \n B-->C;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(edges.length).toBe(2);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow');
    expect(edges[0].text).toBe('');
  });

  it('should handle node names with "end" substring', function() {
    const res = flow.parser.parse('graph TD\nendpoint --> sender');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['endpoint'].id).toBe('endpoint');
    expect(vert['sender'].id).toBe('sender');
    expect(edges[0].start).toBe('endpoint');
    expect(edges[0].end).toBe('sender');
  });

  it('should handle node names ending with keywords', function() {
    const res = flow.parser.parse('graph TD\nblend --> monograph');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['blend'].id).toBe('blend');
    expect(vert['monograph'].id).toBe('monograph');
    expect(edges[0].start).toBe('blend');
    expect(edges[0].end).toBe('monograph');
  });

  describe('special characters should be be handled.', function() {
    const charTest = function(char, result) {
      const res = flow.parser.parse('graph TD;A(' + char + ')-->B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert['A'].id).toBe('A');
      expect(vert['B'].id).toBe('B');
      if (result) {
        expect(vert['A'].text).toBe(result);
      } else {
        expect(vert['A'].text).toBe(char);
      }
      flow.parser.yy.clear();
    };

    it("it should be able to parse a '.'", function() {
      charTest('.');
      charTest('Start 103a.a1');
    });

    // it('it should be able to parse text containing \'_\'', function () {
    //   charTest('_')
    // })

    it("it should be able to parse a ':'", function() {
      charTest(':');
    });

    it("it should be able to parse a ','", function() {
      charTest(',');
    });

    it("it should be able to parse text containing '-'", function() {
      charTest('a-b');
    });

    it("it should be able to parse a '+'", function() {
      charTest('+');
    });

    it("it should be able to parse a '*'", function() {
      charTest('*');
    });

    it("it should be able to parse a '<'", function() {
      charTest('<', '&lt;');
    });

    it("it should be able to parse a '>'", function() {
      charTest('>', '&gt;');
    });

    it("it should be able to parse a '='", function() {
      charTest('=', '&equals;');
    });
    it("it should be able to parse a '&'", function() {
      charTest('&');
    });
  });

  it('should be possible to use direction in node ids', function() {
    let statement = '';

    statement = statement + 'graph TD;' + '\n';
    statement = statement + '  node1TB\n';

    const res = flow.parser.parse(statement);
    const vertices = flow.parser.yy.getVertices();
    console.log(vertices);
    const classes = flow.parser.yy.getClasses();
    expect(vertices['node1TB'].id).toBe('node1TB');
  });

  it('should be possible to use direction in node ids', function() {
    let statement = '';

    statement = statement + 'graph TD;A--x|text including URL space|B;';
    const res = flow.parser.parse(statement);
    const vertices = flow.parser.yy.getVertices();
    console.log(vertices);
    const classes = flow.parser.yy.getClasses();
    expect(vertices['A'].id).toBe('A');
  });
});
