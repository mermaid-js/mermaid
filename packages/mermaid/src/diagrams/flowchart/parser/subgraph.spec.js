import { FlowDB } from '../flowDb.js';
import flow from './flowParser.ts';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('when parsing subgraphs', function () {
  beforeEach(function () {
    flow.parser.yy = new FlowDB();
    flow.parser.yy.clear();
    flow.parser.yy.setGen('gen-2');
  });
  it('should handle subgraph with tab indentation', function () {
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
  it('should handle subgraph with chaining nodes indentation', function () {
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

  it('should handle subgraph with multiple words in title', function () {
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

  it('should handle subgraph with id and title notation', function () {
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

  it.skip('should handle subgraph without id and space in title', function () {
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

  it('should handle subgraph id starting with a number', function () {
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

  it('should handle subgraphs1', function () {
    const res = flow.parser.parse('graph TD;A-->B;subgraph myTitle;c-->d;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_point');
  });
  it('should handle subgraphs with title in quotes', function () {
    const res = flow.parser.parse('graph TD;A-->B;subgraph "title in quotes";c-->d;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.title).toBe('title in quotes');

    expect(edges[0].type).toBe('arrow_point');
  });
  it('should handle subgraphs in old style that was broken', function () {
    const res = flow.parser.parse('graph TD;A-->B;subgraph old style that is broken;c-->d;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.title).toBe('old style that is broken');

    expect(edges[0].type).toBe('arrow_point');
  });
  it('should handle subgraphs with dashes in the title', function () {
    const res = flow.parser.parse('graph TD;A-->B;subgraph a-b-c;c-->d;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.title).toBe('a-b-c');

    expect(edges[0].type).toBe('arrow_point');
  });
  it('should handle subgraphs with id and title in brackets', function () {
    const res = flow.parser.parse('graph TD;A-->B;subgraph uid1[text of doom];c-->d;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.title).toBe('text of doom');
    expect(subgraph.id).toBe('uid1');

    expect(edges[0].type).toBe('arrow_point');
  });
  it('should handle subgraphs with id and title in brackets and quotes', function () {
    const res = flow.parser.parse('graph TD;A-->B;subgraph uid2["text of doom"];c-->d;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.title).toBe('text of doom');
    expect(subgraph.id).toBe('uid2');

    expect(edges[0].type).toBe('arrow_point');
  });
  it('should handle subgraphs with id and title in brackets without spaces', function () {
    const res = flow.parser.parse('graph TD;A-->B;subgraph uid2[textofdoom];c-->d;end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.title).toBe('textofdoom');
    expect(subgraph.id).toBe('uid2');

    expect(edges[0].type).toBe('arrow_point');
  });

  it('should handle subgraphs2', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nsubgraph myTitle\n\n c-->d \nend\n');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_point');
  });

  it('should handle subgraphs3', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nsubgraph myTitle   \n\n    c-->d \nend\n');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_point');
  });

  it('should handle nested subgraphs', function () {
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

  it('should handle subgraphs4', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nsubgraph myTitle\nc-->d\nend;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_point');
  });

  it('should handle subgraphs5', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nsubgraph myTitle\nc-- text -->d\nd-->e\n end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_point');
  });
  it('should handle subgraphs with multi node statements in it', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nsubgraph myTitle\na & b --> c & e\n end;');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_point');
  });
  it('should handle nested subgraphs 1', function () {
    const res = flow.parser.parse(`flowchart TB
    subgraph A
    b-->B
    a
    end
    a-->c
    subgraph B
      c
    end`);

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(2);

    const subgraphA = subgraphs.find((o) => o.id === 'A');
    const subgraphB = subgraphs.find((o) => o.id === 'B');

    expect(subgraphB.nodes[0]).toBe('c');
    expect(subgraphA.nodes).toContain('B');
    expect(subgraphA.nodes).toContain('b');
    expect(subgraphA.nodes).toContain('a');
    expect(subgraphA.nodes).not.toContain('c');
  });
  it('should handle nested subgraphs 2', function () {
    const res = flow.parser.parse(`flowchart TB
    b-->B
    a-->c
    subgraph B
      c
    end
    subgraph A
        a
        b
        B
    end`);

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(2);

    const subgraphA = subgraphs.find((o) => o.id === 'A');
    const subgraphB = subgraphs.find((o) => o.id === 'B');

    expect(subgraphB.nodes[0]).toBe('c');
    expect(subgraphA.nodes).toContain('B');
    expect(subgraphA.nodes).toContain('b');
    expect(subgraphA.nodes).toContain('a');
    expect(subgraphA.nodes).not.toContain('c');
  });
  it('should handle nested subgraphs 3', function () {
    const res = flow.parser.parse(`flowchart TB
    subgraph B
      c
    end
    a-->c
    subgraph A
      b-->B
      a
    end`);

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(2);

    const subgraphA = subgraphs.find((o) => o.id === 'A');
    const subgraphB = subgraphs.find((o) => o.id === 'B');
    expect(subgraphB.nodes[0]).toBe('c');
    expect(subgraphA.nodes).toContain('B');
    expect(subgraphA.nodes).toContain('b');
    expect(subgraphA.nodes).toContain('a');
    expect(subgraphA.nodes).not.toContain('c');
  });
  it('should correctly parse direction TD inside a subgraph', function () {
    const res = flow.parser.parse(`
      graph LR
        subgraph WithTD
          direction TD
          A1 --> A2
        end
    `);

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.dir).toBe('TD');
    expect(subgraph.nodes).toContain('A1');
    expect(subgraph.nodes).toContain('A2');
  });

  it('should attach `@{ view: collapsed }` metadata to a subgraph and collapse it', function () {
    flow.parser.parse(`
      graph TD
        subgraph one [My Group]
          A --> B
        end
        C --> A
        one@{ view: collapsed }
    `);

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    expect(subgraphs[0].metadata?.view).toBe('collapsed');

    const { nodes, edges } = flow.parser.yy.getData();
    const collapsed = nodes.find((n) => n.id === 'one');
    expect(collapsed?.shape).toBe('collapsedGroup');
    expect(collapsed?.isGroup).toBe(false);
    // Internal members are hidden
    expect(nodes.find((n) => n.id === 'A')).toBeUndefined();
    expect(nodes.find((n) => n.id === 'B')).toBeUndefined();
    // C --> A is redirected to the collapsed node, A --> B is dropped
    expect(edges.find((e) => e.start === 'C' && e.end === 'one')).toBeDefined();
    expect(edges.find((e) => e.end === 'A')).toBeUndefined();
  });
  it('should handle a subgraph without an id or a title', function () {
    flow.parser.parse('graph TB\nsubgraph\n\ta1-->a2\nend');
    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    expect(subgraphs[0].id).toMatch(/^subGraph\d+$/);
    expect(subgraphs[0].title).toBe('');
    expect(subgraphs[0].nodes).toEqual(['a2', 'a1']);
  });
  it('should handle an empty subgraph without an id or a title', function () {
    flow.parser.parse('graph TB\nsubgraph\nend');
    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    expect(subgraphs[0].title).toBe('');
    expect(subgraphs[0].nodes).toEqual([]);
  });
  it('should not merge a subgraph without an id into an explicit subGraph<N>', function () {
    flow.parser.parse('graph TB\nsubgraph subGraph1\n\ta1\nend\nsubgraph\n\tb1\nend');
    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(2);
    expect(new Set(subgraphs.map((subgraph) => subgraph.id)).size).toBe(2);
    expect(subgraphs.find((subgraph) => subgraph.id === 'subGraph1').nodes).toEqual(['a1']);
    expect(subgraphs.flatMap((subgraph) => subgraph.nodes).sort()).toEqual(['a1', 'b1']);
  });
  it('should not merge a subgraph whose title has spaces into an explicit subGraph<N>', function () {
    flow.parser.parse('graph TB\nsubgraph subGraph1\n\ta1\nend\nsubgraph Some Title\n\tb1\nend');
    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(2);
    expect(subgraphs.find((subgraph) => subgraph.id === 'subGraph1').nodes).toEqual(['a1']);
    expect(subgraphs.find((subgraph) => subgraph.title === 'Some Title').nodes).toEqual(['b1']);
  });
  it('should not give a subgraph without an id the id of a node', function () {
    flow.parser.parse('graph TB\nsubGraph0 --> b1\nsubgraph\n\tc1\nend');
    const [subgraph] = flow.parser.yy.getSubGraphs();
    expect(subgraph.id).not.toBe('subGraph0');
    expect(subgraph.nodes).toEqual(['c1']);
  });
  it('should not merge an explicit subGraph<N> into an earlier subgraph without an id', function () {
    flow.parser.parse(
      'graph TB\nsubgraph\n\ta1\nend\nsubgraph subGraph0\n\tb1\nend\nc --> subGraph0'
    );
    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(2);
    expect(new Set(subgraphs.map((subgraph) => subgraph.id)).size).toBe(2);
    expect(subgraphs.find((subgraph) => subgraph.id === 'subGraph0').nodes).toEqual(['b1']);
    expect(subgraphs.find((subgraph) => subgraph.id !== 'subGraph0').nodes).toEqual(['a1']);
  });
  it('should keep a subgraph without an id inside an enclosing explicit subGraph<N>', function () {
    flow.parser.parse('graph TB\nsubgraph subGraph0\n\tsubgraph\n\t\ta1\n\tend\n\tb1\nend');
    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(2);
    const inner = subgraphs.find((subgraph) => subgraph.id !== 'subGraph0');
    expect(inner.nodes).toEqual(['a1']);
    expect(subgraphs.find((subgraph) => subgraph.id === 'subGraph0').nodes).toEqual([
      inner.id,
      'b1',
    ]);
  });
  it('should rename a generated id inside every subgraph that lists it', function () {
    flow.parser.parse(
      'graph TB\nsubgraph\n\tsubgraph\n\t\ta1\n\tend\nend\nsubgraph subGraph0\n\tb1\nend'
    );
    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(3);
    expect(new Set(subgraphs.map((subgraph) => subgraph.id)).size).toBe(3);
    const inner = subgraphs.find((subgraph) => subgraph.nodes.includes('a1'));
    const outer = subgraphs.find((subgraph) => subgraph.nodes.includes(inner.id));
    expect(outer.id).not.toBe('subGraph0');
    expect(subgraphs.find((subgraph) => subgraph.id === 'subGraph0').nodes).toEqual(['b1']);
  });
  it('should keep the generated ids when no explicit id collides', function () {
    flow.parser.parse('graph TB\nsubgraph\n\ta1\nend\nsubgraph subGraph5\n\tb1\nend');
    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.map((subgraph) => subgraph.id)).toEqual(['subGraph0', 'subGraph5']);
  });
  it('should give a subgraph without an id the next free subGraph<N>', function () {
    flow.parser.parse('graph TB\nsubGraph0 --> b1\nsubgraph\n\tc1\nend');
    expect(flow.parser.yy.getSubGraphs().map((subgraph) => subgraph.id)).toEqual(['subGraph1']);
  });
  it('should move a generated id again when a later explicit id claims the new one', function () {
    flow.parser.parse(
      'graph TB\nsubgraph\n\ta1\nend\nsubgraph subGraph0\n\tb1\nend\nsubgraph subGraph1\n\tc1\nend'
    );
    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(3);
    expect(subgraphs.find((subgraph) => subgraph.id === 'subGraph0').nodes).toEqual(['b1']);
    expect(subgraphs.find((subgraph) => subgraph.id === 'subGraph1').nodes).toEqual(['c1']);
    const anonymous = subgraphs.find((subgraph) => subgraph.nodes.includes('a1'));
    expect(anonymous.id).toMatch(/^subGraph\d+$/);
    expect(['subGraph0', 'subGraph1']).not.toContain(anonymous.id);
  });
  it('should merge a repeated explicit subGraph<N> into itself, not rename it', function () {
    flow.parser.parse(
      'graph TB\nsubgraph\n\ta1\nend\nsubgraph subGraph0\n\tb1\nend\nsubgraph subGraph0\n\tc1\nend'
    );
    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(2);
    expect(subgraphs.find((subgraph) => subgraph.id === 'subGraph0').nodes).toEqual(['b1', 'c1']);
  });
  it('should hide a renamed subgraph inside a collapsed explicit subGraph<N>', function () {
    flow.parser.parse(
      'graph TB\nsubgraph subGraph0\n\tsubgraph\n\t\ta1\n\tend\n\tb1\nend\nsubGraph0@{ view: collapsed }\nc --> a1'
    );
    const inner = flow.parser.yy.getSubGraphs().find((subgraph) => subgraph.nodes.includes('a1'));
    const { nodes, edges } = flow.parser.yy.getData();
    expect(nodes.find((node) => node.id === 'subGraph0')?.shape).toBe('collapsedGroup');
    expect(nodes.find((node) => node.id === inner.id)).toBeUndefined();
    expect(edges.find((edge) => edge.start === 'c' && edge.end === 'subGraph0')).toBeDefined();
  });
  const parentOf = (subgraphs, id) => subgraphs.find((subgraph) => subgraph.nodes.includes(id))?.id;
  it('should keep a renamed subgraph in its open parent when an explicit sibling claims its id', function () {
    flow.parser.parse(
      'graph TB\nsubgraph Outer\n\tsubgraph\n\t\ta\n\tend\n\tsubgraph subGraph0\n\t\tb\n\tend\nend'
    );
    const subgraphs = flow.parser.yy.getSubGraphs();
    const anonymous = subgraphs.find((subgraph) => subgraph.nodes.includes('a'));
    expect(anonymous.id).not.toBe('subGraph0');
    expect(parentOf(subgraphs, anonymous.id)).toBe('Outer');
    expect(parentOf(subgraphs, 'subGraph0')).toBe('Outer');
  });
  it('should keep a renamed subgraph in its open parent when the explicit id is nested deeper', function () {
    flow.parser.parse(
      'graph TB\nsubgraph Outer\n\tsubgraph\n\t\ta\n\tend\n\tsubgraph Mid\n\t\tsubgraph subGraph0\n\t\t\tb\n\t\tend\n\tend\nend'
    );
    const subgraphs = flow.parser.yy.getSubGraphs();
    const anonymous = subgraphs.find((subgraph) => subgraph.nodes.includes('a'));
    expect(anonymous.id).not.toBe('subGraph0');
    expect(parentOf(subgraphs, anonymous.id)).toBe('Outer');
    expect(parentOf(subgraphs, 'subGraph0')).toBe('Mid');
    expect(parentOf(subgraphs, 'Mid')).toBe('Outer');
  });
  it('should leave an explicit child alone when the renamed subgraph sits outside its parent', function () {
    flow.parser.parse(
      'graph TB\nsubgraph Outer\n\tsubgraph\n\t\ta\n\tend\n\tsubgraph Mid\n\t\tsubgraph subGraph0\n\t\t\tb\n\t\tend\n\t\tsubgraph subGraph1\n\t\t\tc\n\t\tend\n\tend\nend'
    );
    const subgraphs = flow.parser.yy.getSubGraphs();
    const anonymous = subgraphs.find((subgraph) => subgraph.nodes.includes('a'));
    expect(['subGraph0', 'subGraph1']).not.toContain(anonymous.id);
    expect(parentOf(subgraphs, anonymous.id)).toBe('Outer');
    expect(parentOf(subgraphs, 'subGraph0')).toBe('Mid');
    expect(parentOf(subgraphs, 'subGraph1')).toBe('Mid');
  });
  it('should keep a renamed subgraph in its open parent after an unrelated sibling closes', function () {
    flow.parser.parse(
      'graph TB\nsubgraph Outer\n\tsubgraph\n\t\ta\n\tend\n\tsubgraph Mid\n\t\tsubgraph subGraph0\n\t\t\tb\n\t\tend\n\tend\n\tsubgraph Other\n\t\tc\n\tend\nend'
    );
    const subgraphs = flow.parser.yy.getSubGraphs();
    const anonymous = subgraphs.find((subgraph) => subgraph.nodes.includes('a'));
    expect(anonymous.id).not.toBe('subGraph0');
    expect(parentOf(subgraphs, anonymous.id)).toBe('Outer');
    expect(parentOf(subgraphs, 'Other')).toBe('Outer');
  });
  it('should keep an explicit direct child when the renamed subgraph is outside the parent', function () {
    flow.parser.parse(
      'graph TB\nsubgraph\n\ta\nend\nsubgraph Outer\n\tsubgraph subGraph0\n\t\tb\n\tend\nend'
    );
    const subgraphs = flow.parser.yy.getSubGraphs();
    const anonymous = subgraphs.find((subgraph) => subgraph.nodes.includes('a'));
    expect(parentOf(subgraphs, anonymous.id)).toBeUndefined();
    expect(subgraphs.find((subgraph) => subgraph.id === 'Outer').nodes).toEqual(['subGraph0']);
  });
});
