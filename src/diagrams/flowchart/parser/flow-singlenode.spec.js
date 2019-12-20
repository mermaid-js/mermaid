import flowDb from '../flowDb';
import flow from './flow';
import { setConfig } from '../../../config';

setConfig({
  securityLevel: 'strict'
});

describe('[Singlenodes] when parsing', () => {
  beforeEach(function() {
    flow.parser.yy = flowDb;
    flow.parser.yy.clear();
  });

  it('should handle a single node', function() {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;A;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['A'].styles.length).toBe(0);
  });
  it('should handle a single node with white space after it (SN1)', function() {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;A ;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['A'].styles.length).toBe(0);
  });

  it('should handle a single square node', function() {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a[A];');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].styles.length).toBe(0);
    expect(vert['a'].type).toBe('square');
  });

  it('should handle a single round square node', function() {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a[A];');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].styles.length).toBe(0);
    expect(vert['a'].type).toBe('square');
  });

  it('should handle a single circle node', function() {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a((A));');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].type).toBe('circle');
  });

  it('should handle a single round node', function() {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a(A);');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].type).toBe('round');
  });

  it('should handle a single odd node', function() {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a>A];');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].type).toBe('odd');
  });

  it('should handle a single diamond node', function() {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a{A};');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].type).toBe('diamond');
  });

  it('should handle a single diamond node with whitespace after it', function() {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a{A}   ;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].type).toBe('diamond');
  });

  it('should handle a single diamond node with html in it', function() {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a{A <br> end};');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].type).toBe('diamond');
    expect(vert['a'].text).toBe('A <br/> end');
  });

  it('should handle a single hexagon node', function() {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a{{A}};');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].type).toBe('hexagon');
  });

  it('should handle a single hexagon node with html in it', function() {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a{{A <br> end}};');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].type).toBe('hexagon');
    expect(vert['a'].text).toBe('A <br/> end');
  });

  it('should handle a single round node with html in it', function() {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a(A <br> end);');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['a'].type).toBe('round');
    expect(vert['a'].text).toBe('A <br/> end');
  });

  it('should handle a single node with alphanumerics starting on a char', function() {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;id1;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['id1'].styles.length).toBe(0);
  });

  it('should handle a single node with a single digit', function() {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;1;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['1'].text).toBe('1');
  });

  it('should handle a single node with a single digit in a subgraph', function() {
    // Silly but syntactically correct

    const res = flow.parser.parse('graph TD;subgraph "hello";1;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['1'].text).toBe('1');
  });

  it('should handle a single node with alphanumerics starting on a num', function() {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;1id;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['1id'].styles.length).toBe(0);
  });

  it('should handle a single node with alphanumerics containing a minus sign', function() {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;i-d;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['i-d'].styles.length).toBe(0);
  });

  it('should handle a single node with alphanumerics containing a underscore sign', function() {
    // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;i_d;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.length).toBe(0);
    expect(vert['i_d'].styles.length).toBe(0);
  });
});
