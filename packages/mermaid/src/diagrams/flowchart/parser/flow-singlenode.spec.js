import flowDb from '../flowDb.js';
import flow from './flow.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
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
];

const specialChars = ['#', ':', '0', '&', ',', '*', '.', '\\', 'v', '-'];

describe('[Singlenodes] when parsing', () => {
  beforeEach(function () {
    flow.parser.yy = flowDb;
    flow.parser.yy.clear();
  });

  it('should handle a single node', function () {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;A;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['A'].styles.length).toBe(0);
  });
  it('should handle a single node with white space after it (SN1)', function () {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;A ;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['A'].styles.length).toBe(0);
  });

  it('should handle a single square node', function () {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a[A];');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].styles.length).toBe(0);
    expect(vert['a'].type).toBe('square');
  });

  it('should handle a single round square node', function () {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a[A];');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].styles.length).toBe(0);
    expect(vert['a'].type).toBe('square');
  });

  it('should handle a single circle node', function () {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a((A));');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].type).toBe('circle');
  });

  it('should handle a single round node', function () {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a(A);');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].type).toBe('round');
  });

  it('should handle a single odd node', function () {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a>A];');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].type).toBe('odd');
  });

  it('should handle a single diamond node', function () {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a{A};');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].type).toBe('diamond');
  });

  it('should handle a single diamond node with whitespace after it', function () {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a{A}   ;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].type).toBe('diamond');
  });

  it('should handle a single diamond node with html in it (SN3)', function () {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a{A <br> end};');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].type).toBe('diamond');
    expect(vert['a'].text).toBe('A <br> end');
  });

  it('should handle a single hexagon node', function () {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a{{A}};');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].type).toBe('hexagon');
  });

  it('should handle a single hexagon node with html in it', function () {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a{{A <br> end}};');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].type).toBe('hexagon');
    expect(vert['a'].text).toBe('A <br> end');
  });

  it('should handle a single round node with html in it', function () {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a(A <br> end);');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].type).toBe('round');
    expect(vert['a'].text).toBe('A <br> end');
  });

  it('should handle a single double circle node', function () {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a(((A)));');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].type).toBe('doublecircle');
  });

  it('should handle a single double circle node with whitespace after it', function () {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a(((A)))   ;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].type).toBe('doublecircle');
  });

  it('should handle a single double circle node with html in it (SN3)', function () {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a(((A <br> end)));');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].type).toBe('doublecircle');
    expect(vert['a'].text).toBe('A <br> end');
  });

  it('should handle a single node with alphanumerics starting on a char', function () {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;id1;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['id1'].styles.length).toBe(0);
  });

  it('should handle a single node with a single digit', function () {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;1;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['1'].text).toBe('1');
  });

  it('should handle a single node with a single digit in a subgraph', function () {
    // Silly but syntactically correct

    const res = flow.parser.parse('graph TD;subgraph "hello";1;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['1'].text).toBe('1');
  });

  it('should handle a single node with alphanumerics starting on a num', function () {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;1id;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['1id'].styles.length).toBe(0);
  });

  it('should handle a single node with alphanumerics containing a minus sign', function () {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;i-d;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['i-d'].styles.length).toBe(0);
  });

  it('should handle a single node with alphanumerics containing a underscore sign', function () {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;i_d;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['i_d'].styles.length).toBe(0);
  });

  it.each(keywords)('should handle keywords between dashes "-"', function (keyword) {
    const res = flow.parser.parse(`graph TD;a-${keyword}-node;`);
    const vert = flow.parser.yy.getVertices();
    expect(vert[`a-${keyword}-node`].text).toBe(`a-${keyword}-node`);
  });

  it.each(keywords)('should handle keywords between periods "."', function (keyword) {
    const res = flow.parser.parse(`graph TD;a.${keyword}.node;`);
    const vert = flow.parser.yy.getVertices();
    expect(vert[`a.${keyword}.node`].text).toBe(`a.${keyword}.node`);
  });

  it.each(keywords)('should handle keywords between underscores "_"', function (keyword) {
    const res = flow.parser.parse(`graph TD;a_${keyword}_node;`);
    const vert = flow.parser.yy.getVertices();
    expect(vert[`a_${keyword}_node`].text).toBe(`a_${keyword}_node`);
  });

  it.each(keywords)('should handle nodes ending in %s', function (keyword) {
    const res = flow.parser.parse(`graph TD;node_${keyword};node.${keyword};node-${keyword};`);
    const vert = flow.parser.yy.getVertices();
    expect(vert[`node_${keyword}`].text).toBe(`node_${keyword}`);
    expect(vert[`node.${keyword}`].text).toBe(`node.${keyword}`);
    expect(vert[`node-${keyword}`].text).toBe(`node-${keyword}`);
  });

  const errorKeywords = [
    'graph',
    'flowchart',
    'flowchart-elk',
    'style',
    'linkStyle',
    'interpolate',
    'classDef',
    'class',
    '_self',
    '_blank',
    '_parent',
    '_top',
    'end',
    'subgraph',
  ];
  it.each(errorKeywords)('should throw error at nodes beginning with %s', function (keyword) {
    const str = `graph TD;${keyword}.node;${keyword}-node;${keyword}/node`;
    const vert = flow.parser.yy.getVertices();

    expect(() => flow.parser.parse(str)).toThrowError();
  });

  const workingKeywords = ['default', 'href', 'click', 'call'];

  it.each(workingKeywords)('should parse node beginning with %s', function (keyword) {
    flow.parser.parse(`graph TD; ${keyword}.node;${keyword}-node;${keyword}/node;`);
    const vert = flow.parser.yy.getVertices();
    expect(vert[`${keyword}.node`].text).toBe(`${keyword}.node`);
    expect(vert[`${keyword}-node`].text).toBe(`${keyword}-node`);
    expect(vert[`${keyword}/node`].text).toBe(`${keyword}/node`);
  });

  it.each(specialChars)(
    'should allow node ids of single special characters',
    function (specialChar) {
      flow.parser.parse(`graph TD; ${specialChar} --> A`);
      const vert = flow.parser.yy.getVertices();
      expect(vert[`${specialChar}`].text).toBe(`${specialChar}`);
    }
  );

  it.each(specialChars)(
    'should allow node ids with special characters at start of id',
    function (specialChar) {
      flow.parser.parse(`graph TD; ${specialChar}node --> A`);
      const vert = flow.parser.yy.getVertices();
      expect(vert[`${specialChar}node`].text).toBe(`${specialChar}node`);
    }
  );

  it.each(specialChars)(
    'should allow node ids with special characters at end of id',
    function (specialChar) {
      flow.parser.parse(`graph TD; node${specialChar} --> A`);
      const vert = flow.parser.yy.getVertices();
      expect(vert[`node${specialChar}`].text).toBe(`node${specialChar}`);
    }
  );
});
