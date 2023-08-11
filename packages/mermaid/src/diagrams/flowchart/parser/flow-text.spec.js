import flowDb from '../flowDb.js';
import flow from './flow.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('[Text] when parsing', () => {
  beforeEach(function () {
    flow.parser.yy = flowDb;
    flow.parser.yy.clear();
  });

  describe('it should handle text on edges', function () {
    it('should handle text without space', function () {
      const res = flow.parser.parse('graph TD;A--x|textNoSpace|B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_cross');
    });

    it('should handle with space', function () {
      const res = flow.parser.parse('graph TD;A--x|text including space|B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_cross');
    });

    it('should handle text with /', function () {
      const res = flow.parser.parse('graph TD;A--x|text with / should work|B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].text).toBe('text with / should work');
    });

    it('should handle space and space between vertices and link', function () {
      const res = flow.parser.parse('graph TD;A --x|textNoSpace| B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_cross');
    });

    it('should handle space and CAPS', function () {
      const res = flow.parser.parse('graph TD;A--x|text including CAPS space|B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_cross');
    });

    it('should handle space and dir', function () {
      const res = flow.parser.parse('graph TD;A--x|text including URL space|B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_cross');
      expect(edges[0].text).toBe('text including URL space');
    });

    it('should handle space and send', function () {
      const res = flow.parser.parse('graph TD;A--text including URL space and send-->B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_point');
      expect(edges[0].text).toBe('text including URL space and send');
    });
    it('should handle space and send', function () {
      const res = flow.parser.parse('graph TD;A-- text including URL space and send -->B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_point');
      expect(edges[0].text).toBe('text including URL space and send');
    });

    it('should handle space and dir (TD)', function () {
      const res = flow.parser.parse('graph TD;A--x|text including R TD space|B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_cross');
      expect(edges[0].text).toBe('text including R TD space');
    });
    it('should handle `', function () {
      const res = flow.parser.parse('graph TD;A--x|text including `|B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_cross');
      expect(edges[0].text).toBe('text including `');
    });
    it('should handle v in node ids only v', function () {
      // only v
      const res = flow.parser.parse('graph TD;A--xv(my text);');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_cross');
      expect(vert['v'].text).toBe('my text');
    });
    it('should handle v in node ids v at end', function () {
      // v at end
      const res = flow.parser.parse('graph TD;A--xcsv(my text);');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_cross');
      expect(vert['csv'].text).toBe('my text');
    });
    it('should handle v in node ids v in middle', function () {
      // v in middle
      const res = flow.parser.parse('graph TD;A--xava(my text);');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_cross');
      expect(vert['ava'].text).toBe('my text');
    });
    it('should handle v in node ids, v at start', function () {
      // v at start
      const res = flow.parser.parse('graph TD;A--xva(my text);');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_cross');
      expect(vert['va'].text).toBe('my text');
    });
    it('should handle keywords', function () {
      const res = flow.parser.parse('graph TD;A--x|text including graph space|B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].text).toBe('text including graph space');
    });
    it('should handle keywords', function () {
      const res = flow.parser.parse('graph TD;V-->a[v]');
      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();
      expect(vert['a'].text).toBe('v');
    });
    it('should handle quoted text', function () {
      const res = flow.parser.parse('graph TD;V-- "test string()" -->a[v]');
      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();
      expect(edges[0].text).toBe('test string()');
    });
  });

  describe('it should handle text on lines', () => {
    it('should handle normal text on lines', function () {
      const res = flow.parser.parse('graph TD;A-- test text with == -->B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].stroke).toBe('normal');
    });
    it('should handle dotted text on lines (TD3)', function () {
      const res = flow.parser.parse('graph TD;A-. test text with == .->B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].stroke).toBe('dotted');
    });
    it('should handle thick text on lines', function () {
      const res = flow.parser.parse('graph TD;A== test text with - ==>B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].stroke).toBe('thick');
    });
  });

  describe('it should handle text on edges using the new notation', function () {
    it('should handle text without space', function () {
      const res = flow.parser.parse('graph TD;A-- textNoSpace --xB;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_cross');
    });

    it('should handle text with multiple leading space', function () {
      const res = flow.parser.parse('graph TD;A--    textNoSpace --xB;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_cross');
    });

    it('should handle with space', function () {
      const res = flow.parser.parse('graph TD;A-- text including space --xB;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_cross');
    });

    it('should handle text with /', function () {
      const res = flow.parser.parse('graph TD;A -- text with / should work --x B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].text).toBe('text with / should work');
    });

    it('should handle space and space between vertices and link', function () {
      const res = flow.parser.parse('graph TD;A -- textNoSpace --x B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_cross');
    });

    it('should handle space and CAPS', function () {
      const res = flow.parser.parse('graph TD;A-- text including CAPS space --xB;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_cross');
    });

    it('should handle space and dir', function () {
      const res = flow.parser.parse('graph TD;A-- text including URL space --xB;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_cross');
      expect(edges[0].text).toBe('text including URL space');
    });

    it('should handle space and dir (TD2)', function () {
      const res = flow.parser.parse('graph TD;A-- text including R TD space --xB;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_cross');
      expect(edges[0].text).toBe('text including R TD space');
    });
    it('should handle keywords', function () {
      const res = flow.parser.parse('graph TD;A-- text including graph space and v --xB;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].text).toBe('text including graph space and v');
    });
    it('should handle keywords', function () {
      const res = flow.parser.parse('graph TD;A-- text including graph space and v --xB[blav]');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].text).toBe('text including graph space and v');
    });
    // it.skip('should handle text on open links',function(){
    //    const res = flow.parser.parse('graph TD;A-- text including graph space --B');
    //
    //    const vert = flow.parser.yy.getVertices();
    //    const edges = flow.parser.yy.getEdges();
    //
    //    expect(edges[0].text).toBe('text including graph space');
    //
    // });
  });

  describe('it should handle text in vertices, ', function () {
    it('should handle space', function () {
      const res = flow.parser.parse('graph TD;A-->C(Chimpansen hoppar);');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert['C'].type).toBe('round');
      expect(vert['C'].text).toBe('Chimpansen hoppar');
    });

    const keywords = [
      'graph',
      'flowchart',
      'flowchart-elk',
      'style',
      'default',
      'linkStyle',
      'interpolate',
      'classDef',
      'class',
      'href',
      'call',
      'click',
      '_self',
      '_blank',
      '_parent',
      '_top',
      'end',
      'subgraph',
      'kitty',
    ];

    const shapes = [
      { start: '[', end: ']', name: 'square' },
      { start: '(', end: ')', name: 'round' },
      { start: '{', end: '}', name: 'diamond' },
      { start: '(-', end: '-)', name: 'ellipse' },
      { start: '([', end: '])', name: 'stadium' },
      { start: '>', end: ']', name: 'odd' },
      { start: '[(', end: ')]', name: 'cylinder' },
      { start: '(((', end: ')))', name: 'doublecircle' },
      { start: '[/', end: '\\]', name: 'trapezoid' },
      { start: '[\\', end: '/]', name: 'inv_trapezoid' },
      { start: '[/', end: '/]', name: 'lean_right' },
      { start: '[\\', end: '\\]', name: 'lean_left' },
      { start: '[[', end: ']]', name: 'subroutine' },
      { start: '{{', end: '}}', name: 'hexagon' },
    ];

    shapes.forEach((shape) => {
      it.each(keywords)(`should handle %s keyword in ${shape.name} vertex`, function (keyword) {
        const rest = flow.parser.parse(
          `graph TD;A_${keyword}_node-->B${shape.start}This node has a ${keyword} as text${shape.end};`
        );

        const vert = flow.parser.yy.getVertices();
        const edges = flow.parser.yy.getEdges();
        expect(vert['B'].type).toBe(`${shape.name}`);
        expect(vert['B'].text).toBe(`This node has a ${keyword} as text`);
      });
    });

    it.each(keywords)('should handle %s keyword in rect vertex', function (keyword) {
      const rest = flow.parser.parse(
        `graph TD;A_${keyword}_node-->B[|borders:lt|This node has a ${keyword} as text];`
      );

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();
      expect(vert['B'].type).toBe('rect');
      expect(vert['B'].text).toBe(`This node has a ${keyword} as text`);
    });

    it('should handle edge case for odd vertex with node id ending with minus', function () {
      const res = flow.parser.parse('graph TD;A_node-->odd->Vertex Text];');
      const vert = flow.parser.yy.getVertices();

      expect(vert['odd-'].type).toBe('odd');
      expect(vert['odd-'].text).toBe('Vertex Text');
    });
    it('should allow forward slashes in lean_right vertices', function () {
      const rest = flow.parser.parse(`graph TD;A_node-->B[/This node has a / as text/];`);

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();
      expect(vert['B'].type).toBe('lean_right');
      expect(vert['B'].text).toBe(`This node has a / as text`);
    });

    it('should allow back slashes in lean_left vertices', function () {
      const rest = flow.parser.parse(`graph TD;A_node-->B[\\This node has a \\ as text\\];`);

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();
      expect(vert['B'].type).toBe('lean_left');
      expect(vert['B'].text).toBe(`This node has a \\ as text`);
    });

    it('should handle åäö and minus', function () {
      const res = flow.parser.parse('graph TD;A-->C{Chimpansen hoppar åäö-ÅÄÖ};');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert['C'].type).toBe('diamond');
      expect(vert['C'].text).toBe('Chimpansen hoppar åäö-ÅÄÖ');
    });

    it('should handle with åäö, minus and space and br', function () {
      const res = flow.parser.parse('graph TD;A-->C(Chimpansen hoppar åäö  <br> -  ÅÄÖ);');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert['C'].type).toBe('round');
      expect(vert['C'].text).toBe('Chimpansen hoppar åäö  <br> -  ÅÄÖ');
    });
    // it.skip('should handle åäö, minus and space and br',function(){
    //    const res = flow.parser.parse('graph TD; A[Object&#40;foo,bar&#41;]-->B(Thing);');
    //
    //    const vert = flow.parser.yy.getVertices();
    //    const edges = flow.parser.yy.getEdges();
    //
    //    expect(vert['C'].type).toBe('round');
    //    expect(vert['C'].text).toBe(' A[Object&#40;foo,bar&#41;]-->B(Thing);');
    // });
    it('should handle unicode chars', function () {
      const res = flow.parser.parse('graph TD;A-->C(Начало);');

      const vert = flow.parser.yy.getVertices();

      expect(vert['C'].text).toBe('Начало');
    });
    it('should handle backslask', function () {
      const res = flow.parser.parse('graph TD;A-->C(c:\\windows);');

      const vert = flow.parser.yy.getVertices();

      expect(vert['C'].text).toBe('c:\\windows');
    });
    it('should handle CAPS', function () {
      const res = flow.parser.parse('graph TD;A-->C(some CAPS);');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert['C'].type).toBe('round');
      expect(vert['C'].text).toBe('some CAPS');
    });
    it('should handle directions', function () {
      const res = flow.parser.parse('graph TD;A-->C(some URL);');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(vert['C'].type).toBe('round');
      expect(vert['C'].text).toBe('some URL');
    });
  });

  it('should handle multi-line text', function () {
    const res = flow.parser.parse('graph TD;A--o|text space|B;\n B-->|more text with space|C;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_circle');
    expect(edges[1].type).toBe('arrow_point');
    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(vert['C'].id).toBe('C');
    expect(edges.length).toBe(2);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    // expect(edges[0].text).toBe('text space');
    expect(edges[1].start).toBe('B');
    expect(edges[1].end).toBe('C');
    expect(edges[1].text).toBe('more text with space');
  });

  it('should handle text in vertices with space', function () {
    const res = flow.parser.parse('graph TD;A[chimpansen hoppar]-->C;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].type).toBe('square');
    expect(vert['A'].text).toBe('chimpansen hoppar');
  });

  it('should handle text in vertices with space with spaces between vertices and link', function () {
    const res = flow.parser.parse('graph TD;A[chimpansen hoppar] --> C;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].type).toBe('square');
    expect(vert['A'].text).toBe('chimpansen hoppar');
  });
  it('should handle text including _ in vertices', function () {
    const res = flow.parser.parse('graph TD;A[chimpansen_hoppar] --> C;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].type).toBe('square');
    expect(vert['A'].text).toBe('chimpansen_hoppar');
  });

  it('should handle quoted text in vertices ', function () {
    const res = flow.parser.parse('graph TD;A["chimpansen hoppar ()[]"] --> C;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].type).toBe('square');
    expect(vert['A'].text).toBe('chimpansen hoppar ()[]');
  });

  it('should handle text in circle vertices with space', function () {
    const res = flow.parser.parse('graph TD;A((chimpansen hoppar))-->C;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].type).toBe('circle');
    expect(vert['A'].text).toBe('chimpansen hoppar');
  });

  it('should handle text in ellipse vertices', function () {
    const res = flow.parser.parse('graph TD\nA(-this is an ellipse-)-->B');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].type).toBe('ellipse');
    expect(vert['A'].text).toBe('this is an ellipse');
  });

  it('should handle text in diamond vertices with space', function () {
    const res = flow.parser.parse('graph TD;A(chimpansen hoppar)-->C;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].type).toBe('round');
    expect(vert['A'].text).toBe('chimpansen hoppar');
  });

  it('should handle text in with ?', function () {
    const res = flow.parser.parse('graph TD;A(?)-->|?|C;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].text).toBe('?');
    expect(edges[0].text).toBe('?');
  });
  it('should handle text in with éèêàçô', function () {
    const res = flow.parser.parse('graph TD;A(éèêàçô)-->|éèêàçô|C;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].text).toBe('éèêàçô');
    expect(edges[0].text).toBe('éèêàçô');
  });

  it('should handle text in with ,.?!+-*', function () {
    const res = flow.parser.parse('graph TD;A(,.?!+-*)-->|,.?!+-*|C;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].text).toBe(',.?!+-*');
    expect(edges[0].text).toBe(',.?!+-*');
  });

  it('should throw error at nested set of brackets', function () {
    const str = 'graph TD; A[This is a () in text];';
    expect(() => flow.parser.parse(str)).toThrowError("got 'PS'");
  });

  it('should throw error for strings and text at the same time', function () {
    const str = 'graph TD;A(this node has "string" and text)-->|this link has "string" and text|C;';

    expect(() => flow.parser.parse(str)).toThrowError("got 'STR'");
  });

  it('should throw error for escaping quotes in text state', function () {
    //prettier-ignore
    const str = 'graph TD; A[This is a \"()\" in text];'; //eslint-disable-line no-useless-escape

    expect(() => flow.parser.parse(str)).toThrowError("got 'STR'");
  });

  it('should throw error for nested quoatation marks', function () {
    const str = 'graph TD; A["This is a "()" in text"];';

    expect(() => flow.parser.parse(str)).toThrowError("Expecting 'SQE'");
  });

  it('should throw error', function () {
    const str = `graph TD; node[hello ) world] --> works`;
    expect(() => flow.parser.parse(str)).toThrowError("got 'PE'");
  });
});
