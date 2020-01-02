import flowDb from '../flowDb';
import flow from './flow';
import { setConfig } from '../../../config';

setConfig({
  securityLevel: 'strict'
});

describe('when parsing subgraphs', function() {
  beforeEach(function() {
    flow.parser.yy = flowDb;
    flow.parser.yy.clear();
  });
  it('should handle subgraph with tab indentation', function() {
    const res = flow.parser.parse('graph TB\nsubgraph One\n\ta1-->a2\nend');
    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.nodes.length).toBe(2);
    expect(subgraph.nodes[0]).toBe('a2');
    expect(subgraph.nodes[1]).toBe('a1');
    expect(subgraph.title).toBe('One');
    expect(subgraph.id).toBe('One');
  });
  it('should handle subgraph with chaining nodes indentation', function() {
    const res = flow.parser.parse('graph TB\nsubgraph One\n\ta1-->a2-->a3\nend');
    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];
    expect(subgraph.nodes.length).toBe(3);
    expect(subgraph.nodes[0]).toBe('a3');
    expect(subgraph.nodes[1]).toBe('a2');
    expect(subgraph.nodes[2]).toBe('a1');
    expect(subgraph.title).toBe('One');
    expect(subgraph.id).toBe('One');
  });

  it('should handle subgraph with multiple words in title', function() {
    const res = flow.parser.parse('graph TB\nsubgraph "Some Title"\n\ta1-->a2\nend');
    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];
    expect(subgraph.nodes.length).toBe(2);
    expect(subgraph.nodes[0]).toBe('a2');
    expect(subgraph.nodes[1]).toBe('a1');
    expect(subgraph.title).toBe('Some Title');
    expect(subgraph.id).toBe('subGraph0');
  });

  it('should handle subgraph with id and title notation', function() {
    const res = flow.parser.parse('graph TB\nsubgraph some-id[Some Title]\n\ta1-->a2\nend');
    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];
    expect(subgraph.nodes.length).toBe(2);
    expect(subgraph.nodes[0]).toBe('a2');
    expect(subgraph.nodes[1]).toBe('a1');
    expect(subgraph.title).toBe('Some Title');
    expect(subgraph.id).toBe('some-id');
  });

  xit('should handle subgraph without id and space in title', function() {
    const res = flow.parser.parse('graph TB\nsubgraph Some Title\n\ta1-->a2\nend');
    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];
    expect(subgraph.nodes.length).toBe(2);
    expect(subgraph.nodes[0]).toBe('a1');
    expect(subgraph.nodes[1]).toBe('a2');
    expect(subgraph.title).toBe('Some Title');
    expect(subgraph.id).toBe('some-id');
  });

  it('should handle subgraph id starting with a number', function() {
    const res = flow.parser.parse(`graph TD
    A[Christmas] -->|Get money| B(Go shopping)
    subgraph 1test
    A
    end`);

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];
    expect(subgraph.nodes.length).toBe(1);
    expect(subgraph.nodes[0]).toBe('A');
    expect(subgraph.id).toBe('1test');
  });

  it('should handle subgraphs1', function() {
    const res = flow.parser.parse('graph TD;A-->B;subgraph myTitle;c-->d;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow');
  });
  it('should handle subgraphs with title in quotes', function() {
    const res = flow.parser.parse('graph TD;A-->B;subgraph "title in quotes";c-->d;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.title).toBe('title in quotes');

    expect(edges[0].type).toBe('arrow');
  });
  it('should handle subgraphs in old style that was broken', function() {
    const res = flow.parser.parse('graph TD;A-->B;subgraph old style that is broken;c-->d;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.title).toBe('old style that is broken');

    expect(edges[0].type).toBe('arrow');
  });
  it('should handle subgraphs with dashes in the title', function() {
    const res = flow.parser.parse('graph TD;A-->B;subgraph a-b-c;c-->d;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.title).toBe('a-b-c');

    expect(edges[0].type).toBe('arrow');
  });
  it('should handle subgraphs with id and title in brackets', function() {
    const res = flow.parser.parse('graph TD;A-->B;subgraph uid1[text of doom];c-->d;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.title).toBe('text of doom');
    expect(subgraph.id).toBe('uid1');

    expect(edges[0].type).toBe('arrow');
  });
  it('should handle subgraphs with id and title in brackets and quotes', function() {
    const res = flow.parser.parse('graph TD;A-->B;subgraph uid2["text of doom"];c-->d;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.title).toBe('text of doom');
    expect(subgraph.id).toBe('uid2');

    expect(edges[0].type).toBe('arrow');
  });
  it('should handle subgraphs with id and title in brackets without spaces', function() {
    const res = flow.parser.parse('graph TD;A-->B;subgraph uid2[textofdoom];c-->d;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.title).toBe('textofdoom');
    expect(subgraph.id).toBe('uid2');

    expect(edges[0].type).toBe('arrow');
  });

  it('should handle subgraphs2', function() {
    const res = flow.parser.parse('graph TD\nA-->B\nsubgraph myTitle\n\n c-->d \nend\n');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow');
  });

  it('should handle subgraphs3', function() {
    const res = flow.parser.parse('graph TD\nA-->B\nsubgraph myTitle   \n\n    c-->d \nend\n');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow');
  });

  it('should handle nested subgraphs', function() {
    const str =
      'graph TD\n' +
      'A-->B\n' +
      'subgraph myTitle\n\n' +
      ' c-->d \n\n' +
      ' subgraph inner\n\n   e-->f \n end \n\n' +
      ' subgraph inner\n\n   h-->i \n end \n\n' +
      'end\n';
    const res = flow.parser.parse(str);
  });

  it('should handle subgraphs4', function() {
    const res = flow.parser.parse('graph TD\nA-->B\nsubgraph myTitle\nc-->d\nend;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow');
  });

  it('should handle subgraphs5', function() {
    const res = flow.parser.parse('graph TD\nA-->B\nsubgraph myTitle\nc-- text -->d\nd-->e\n end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow');
  });
  it('should handle subgraphs with multi node statements in it', function() {
    const res = flow.parser.parse('graph TD\nA-->B\nsubgraph myTitle\na & b --> c & e\n end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow');
  });
});
