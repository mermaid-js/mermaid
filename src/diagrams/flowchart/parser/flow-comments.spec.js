import flowDb from '../flowDb';
import flow from './flow';
import { setConfig } from '../../../config';

setConfig({
  securityLevel: 'strict'
});

describe('[Comments] when parsing', () => {
  beforeEach(function() {
    flow.parser.yy = flowDb;
    flow.parser.yy.clear();
  });

  it('should handle comments', function() {
    const res = flow.parser.parse('graph TD;\n%% Comment\n A-->B;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow');
    expect(edges[0].text).toBe('');
  });

  it('should handle comments at the start', function() {
    const res = flow.parser.parse('%% Comment\ngraph TD;\n A-->B;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow');
    expect(edges[0].text).toBe('');
  });

  it('should handle comments at the end', function() {
    const res = flow.parser.parse('graph TD;\n A-->B\n %% Comment at the end\n');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow');
    expect(edges[0].text).toBe('');
  });

  it('should handle comments at the end no trailing newline', function() {
    const res = flow.parser.parse('graph TD;\n A-->B\n%% Commento');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow');
    expect(edges[0].text).toBe('');
  });

  it('should handle comments at the end many trailing newlines', function() {
    const res = flow.parser.parse('graph TD;\n A-->B\n%% Commento\n\n\n');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow');
    expect(edges[0].text).toBe('');
  });

  it('should handle no trailing newlines', function() {
    const res = flow.parser.parse('graph TD;\n A-->B');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow');
    expect(edges[0].text).toBe('');
  });

  it('should handle many trailing newlines', function() {
    const res = flow.parser.parse('graph TD;\n A-->B\n\n');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow');
    expect(edges[0].text).toBe('');
  });

  it('should handle a comment with blank rows in-between', function() {
    const res = flow.parser.parse('graph TD;\n\n\n %% Comment\n A-->B;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow');
    expect(edges[0].text).toBe('');
  });

  it('should handle a comment with mermaid flowchart code in them', function() {
    const res = flow.parser.parse(
      'graph TD;\n\n\n %% Test od>Odd shape]-->|Two line<br>edge comment|ro;\n A-->B;'
    );

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow');
    expect(edges[0].text).toBe('');
  });
});
