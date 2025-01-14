import flowDb from '../flowDb.js';
import flow from './flowParser.ts';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('[Style] when parsing', () => {
  beforeEach(function () {
    flow.parser.yy = flowDb;
    flow.parser.yy.clear();
    flow.parser.yy.setGen('gen-2');
  });

  // log.debug(flow.parser.parse('graph TD;style Q background:#fff;'));
  it('should handle styles for vertices', function () {
    const res = flow.parser.parse('graph TD;style Q background:#fff;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert.get('Q').styles.length).toBe(1);
    expect(vert.get('Q').styles[0]).toBe('background:#fff');
  });

  it('should handle multiple styles for a vortex', function () {
    const res = flow.parser.parse('graph TD;style R background:#fff,border:1px solid red;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert.get('R').styles.length).toBe(2);
    expect(vert.get('R').styles[0]).toBe('background:#fff');
    expect(vert.get('R').styles[1]).toBe('border:1px solid red');
  });

  it('should handle multiple styles in a graph', function () {
    const res = flow.parser.parse(
      'graph TD;style S background:#aaa;\nstyle T background:#bbb,border:1px solid red;'
    );

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert.get('S').styles.length).toBe(1);
    expect(vert.get('T').styles.length).toBe(2);
    expect(vert.get('S').styles[0]).toBe('background:#aaa');
    expect(vert.get('T').styles[0]).toBe('background:#bbb');
    expect(vert.get('T').styles[1]).toBe('border:1px solid red');
  });

  it('should handle styles and graph definitions in a graph', function () {
    const res = flow.parser.parse(
      'graph TD;S-->T;\nstyle S background:#aaa;\nstyle T background:#bbb,border:1px solid red;'
    );

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert.get('S').styles.length).toBe(1);
    expect(vert.get('T').styles.length).toBe(2);
    expect(vert.get('S').styles[0]).toBe('background:#aaa');
    expect(vert.get('T').styles[0]).toBe('background:#bbb');
    expect(vert.get('T').styles[1]).toBe('border:1px solid red');
  });

  it('should handle styles and graph definitions in a graph', function () {
    const res = flow.parser.parse('graph TD;style T background:#bbb,border:1px solid red;');
    // const res = flow.parser.parse('graph TD;style T background: #bbb;');

    const vert = flow.parser.yy.getVertices();

    expect(vert.get('T').styles.length).toBe(2);
    expect(vert.get('T').styles[0]).toBe('background:#bbb');
    expect(vert.get('T').styles[1]).toBe('border:1px solid red');
  });

  it('should keep node label text (if already defined) when a style is applied', function () {
    const res = flow.parser.parse(
      'graph TD;A(( ));B((Test));C;style A background:#fff;style D border:1px solid red;'
    );

    const vert = flow.parser.yy.getVertices();

    expect(vert.get('A').text).toBe('');
    expect(vert.get('B').text).toBe('Test');
    expect(vert.get('C').text).toBe('C');
    expect(vert.get('D').text).toBe('D');
  });

  it('should be possible to declare a class', function () {
    const res = flow.parser.parse(
      'graph TD;classDef exClass background:#bbb,border:1px solid red;'
    );
    // const res = flow.parser.parse('graph TD;style T background: #bbb;');

    const classes = flow.parser.yy.getClasses();

    expect(classes.get('exClass').styles.length).toBe(2);
    expect(classes.get('exClass').styles[0]).toBe('background:#bbb');
    expect(classes.get('exClass').styles[1]).toBe('border:1px solid red');
  });

  it('should be possible to declare multiple classes', function () {
    const res = flow.parser.parse(
      'graph TD;classDef firstClass,secondClass background:#bbb,border:1px solid red;'
    );

    const classes = flow.parser.yy.getClasses();

    expect(classes.get('firstClass').styles.length).toBe(2);
    expect(classes.get('firstClass').styles[0]).toBe('background:#bbb');
    expect(classes.get('firstClass').styles[1]).toBe('border:1px solid red');

    expect(classes.get('secondClass').styles.length).toBe(2);
    expect(classes.get('secondClass').styles[0]).toBe('background:#bbb');
    expect(classes.get('secondClass').styles[1]).toBe('border:1px solid red');
  });

  it('should be possible to declare a class with a dot in the style', function () {
    const res = flow.parser.parse(
      'graph TD;classDef exClass background:#bbb,border:1.5px solid red;'
    );
    // const res = flow.parser.parse('graph TD;style T background: #bbb;');

    const classes = flow.parser.yy.getClasses();

    expect(classes.get('exClass').styles.length).toBe(2);
    expect(classes.get('exClass').styles[0]).toBe('background:#bbb');
    expect(classes.get('exClass').styles[1]).toBe('border:1.5px solid red');
  });
  it('should be possible to declare a class with a space in the style', function () {
    const res = flow.parser.parse(
      'graph TD;classDef exClass background:  #bbb,border:1.5px solid red;'
    );
    // const res = flow.parser.parse('graph TD;style T background  :  #bbb;');

    const classes = flow.parser.yy.getClasses();

    expect(classes.get('exClass').styles.length).toBe(2);
    expect(classes.get('exClass').styles[0]).toBe('background:  #bbb');
    expect(classes.get('exClass').styles[1]).toBe('border:1.5px solid red');
  });
  it('should be possible to apply a class to a vertex', function () {
    let statement = '';

    statement = statement + 'graph TD;' + '\n';
    statement = statement + 'classDef exClass background:#bbb,border:1px solid red;' + '\n';
    statement = statement + 'a-->b;' + '\n';
    statement = statement + 'class a exClass;';

    const res = flow.parser.parse(statement);

    const classes = flow.parser.yy.getClasses();

    expect(classes.get('exClass').styles.length).toBe(2);
    expect(classes.get('exClass').styles[0]).toBe('background:#bbb');
    expect(classes.get('exClass').styles[1]).toBe('border:1px solid red');
  });
  it('should be possible to apply a class to a vertex with an id containing _', function () {
    let statement = '';

    statement = statement + 'graph TD;' + '\n';
    statement = statement + 'classDef exClass background:#bbb,border:1px solid red;' + '\n';
    statement = statement + 'a_a-->b_b;' + '\n';
    statement = statement + 'class a_a exClass;';

    const res = flow.parser.parse(statement);

    const classes = flow.parser.yy.getClasses();

    expect(classes.get('exClass').styles.length).toBe(2);
    expect(classes.get('exClass').styles[0]).toBe('background:#bbb');
    expect(classes.get('exClass').styles[1]).toBe('border:1px solid red');
  });
  it('should be possible to apply a class to a vertex directly', function () {
    let statement = '';

    statement = statement + 'graph TD;' + '\n';
    statement = statement + 'classDef exClass background:#bbb,border:1px solid red;' + '\n';
    statement = statement + 'a-->b[test]:::exClass;' + '\n';

    const res = flow.parser.parse(statement);
    const vertices = flow.parser.yy.getVertices();
    const classes = flow.parser.yy.getClasses();

    expect(classes.get('exClass').styles.length).toBe(2);
    expect(vertices.get('b').classes[0]).toBe('exClass');
    expect(classes.get('exClass').styles[0]).toBe('background:#bbb');
    expect(classes.get('exClass').styles[1]).toBe('border:1px solid red');
  });

  it('should be possible to apply a class to a vertex directly : usecase A[text].class ', function () {
    let statement = '';

    statement = statement + 'graph TD;' + '\n';
    statement = statement + 'classDef exClass background:#bbb,border:1px solid red;' + '\n';
    statement = statement + 'b[test]:::exClass;' + '\n';

    const res = flow.parser.parse(statement);
    const vertices = flow.parser.yy.getVertices();
    const classes = flow.parser.yy.getClasses();

    expect(classes.get('exClass').styles.length).toBe(2);
    expect(vertices.get('b').classes[0]).toBe('exClass');
    expect(classes.get('exClass').styles[0]).toBe('background:#bbb');
    expect(classes.get('exClass').styles[1]).toBe('border:1px solid red');
  });

  it('should be possible to apply a class to a vertex directly : usecase A[text].class-->B[test2] ', function () {
    let statement = '';

    statement = statement + 'graph TD;' + '\n';
    statement = statement + 'classDef exClass background:#bbb,border:1px solid red;' + '\n';
    statement = statement + 'A[test]:::exClass-->B[test2];' + '\n';

    const res = flow.parser.parse(statement);
    const vertices = flow.parser.yy.getVertices();
    const classes = flow.parser.yy.getClasses();

    expect(classes.get('exClass').styles.length).toBe(2);
    expect(vertices.get('A').classes[0]).toBe('exClass');
    expect(classes.get('exClass').styles[0]).toBe('background:#bbb');
    expect(classes.get('exClass').styles[1]).toBe('border:1px solid red');
  });

  it('should be possible to apply a class to a vertex directly 2', function () {
    let statement = '';

    statement = statement + 'graph TD;' + '\n';
    statement = statement + 'classDef exClass background:#bbb,border:1px solid red;' + '\n';
    statement = statement + 'a-->b[1 a a text!.]:::exClass;' + '\n';

    const res = flow.parser.parse(statement);
    const vertices = flow.parser.yy.getVertices();
    const classes = flow.parser.yy.getClasses();

    expect(classes.get('exClass').styles.length).toBe(2);
    expect(vertices.get('b').classes[0]).toBe('exClass');
    expect(classes.get('exClass').styles[0]).toBe('background:#bbb');
    expect(classes.get('exClass').styles[1]).toBe('border:1px solid red');
  });
  it('should be possible to apply a class to a comma separated list of vertices', function () {
    let statement = '';

    statement = statement + 'graph TD;' + '\n';
    statement = statement + 'classDef exClass background:#bbb,border:1px solid red;' + '\n';
    statement = statement + 'a-->b;' + '\n';
    statement = statement + 'class a,b exClass;';

    const res = flow.parser.parse(statement);

    const classes = flow.parser.yy.getClasses();
    const vertices = flow.parser.yy.getVertices();

    expect(classes.get('exClass').styles.length).toBe(2);
    expect(classes.get('exClass').styles[0]).toBe('background:#bbb');
    expect(classes.get('exClass').styles[1]).toBe('border:1px solid red');
    expect(vertices.get('a').classes[0]).toBe('exClass');
    expect(vertices.get('b').classes[0]).toBe('exClass');
  });

  it('should handle style definitions with more then 1 digit in a row', function () {
    const res = flow.parser.parse(
      'graph TD\n' +
        'A-->B1\n' +
        'A-->B2\n' +
        'A-->B3\n' +
        'A-->B4\n' +
        'A-->B5\n' +
        'A-->B6\n' +
        'A-->B7\n' +
        'A-->B8\n' +
        'A-->B9\n' +
        'A-->B10\n' +
        'A-->B11\n' +
        'linkStyle 10 stroke-width:1px;'
    );

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_point');
  });

  it('should handle style definitions within number of edges', function () {
    expect(() =>
      flow.parser
        .parse(
          `graph TD
    A-->B
    linkStyle 1 stroke-width:1px;`
        )
        .toThrow(
          'The index 1 for linkStyle is out of bounds. Valid indices for linkStyle are between 0 and 0. (Help: Ensure that the index is within the range of existing edges.)'
        )
    );
  });

  it('should handle style definitions within number of edges', function () {
    const res = flow.parser.parse(`graph TD
    A-->B
    linkStyle 0 stroke-width:1px;`);

    const edges = flow.parser.yy.getEdges();

    expect(edges[0].style[0]).toBe('stroke-width:1px');
  });

  it('should handle multi-numbered style definitions with more then 1 digit in a row', function () {
    const res = flow.parser.parse(
      'graph TD\n' +
        'A-->B1\n' +
        'A-->B2\n' +
        'A-->B3\n' +
        'A-->B4\n' +
        'A-->B5\n' +
        'A-->B6\n' +
        'A-->B7\n' +
        'A-->B8\n' +
        'A-->B9\n' +
        'A-->B10\n' +
        'A-->B11\n' +
        'A-->B12\n' +
        'linkStyle 10,11 stroke-width:1px;'
    );

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_point');
  });

  it('should handle classDefs with style in classes', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nclassDef exClass font-style:bold;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_point');
  });

  it('should handle classDefs with % in classes', function () {
    const res = flow.parser.parse(
      'graph TD\nA-->B\nclassDef exClass fill:#f96,stroke:#333,stroke-width:4px,font-size:50%,font-style:bold;'
    );

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_point');
  });

  it('should handle multiple vertices with style', function () {
    const res = flow.parser.parse(`
    graph TD
      classDef C1 stroke-dasharray:4
      classDef C2 stroke-dasharray:6
      A & B:::C1 & D:::C1 --> E:::C2
    `);

    const vert = flow.parser.yy.getVertices();

    expect(vert.get('A').classes.length).toBe(0);
    expect(vert.get('B').classes[0]).toBe('C1');
    expect(vert.get('D').classes[0]).toBe('C1');
    expect(vert.get('E').classes[0]).toBe('C2');
  });
});
