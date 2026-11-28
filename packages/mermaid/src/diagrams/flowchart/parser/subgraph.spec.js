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

  describe('subgraph shape metadata', function () {
    const shapeOf = (id) => flow.parser.yy.getData().nodes.find((n) => n.id === id)?.shape;

    it('should accept an @{ shape } block after a bare id', function () {
      flow.parser.parse('graph TB\nsubgraph core@{ shape: hex }\n  a1-->a2\nend');
      const subgraphs = flow.parser.yy.getSubGraphs();
      expect(subgraphs.length).toBe(1);
      expect(subgraphs[0].id).toBe('core');
      expect(subgraphs[0].title).toBe('core');
      expect(subgraphs[0].nodes.sort()).toEqual(['a1', 'a2']);
      expect(shapeOf('core')).toBe('hexagon');
    });

    it('should accept an @{ shape } block after a bracketed title', function () {
      flow.parser.parse('graph TB\nsubgraph core["Application core"]@{ shape: hex }\n  a1\nend');
      const [subgraph] = flow.parser.yy.getSubGraphs();
      expect(subgraph.id).toBe('core');
      expect(subgraph.title).toBe('Application core');
      expect(shapeOf('core')).toBe('hexagon');
    });

    it('should accept a space between a bracketed title and the @{ shape } block', function () {
      flow.parser.parse('graph TB\nsubgraph core["Application core"] @{ shape: hex }\n  a1\nend');
      const [subgraph] = flow.parser.yy.getSubGraphs();
      expect(subgraph.id).toBe('core');
      expect(subgraph.title).toBe('Application core');
      expect(shapeOf('core')).toBe('hexagon');
    });

    it('should keep the id of a bare header followed by a space and an @{ shape } block', function () {
      flow.parser.parse('graph TB\nsubgraph core @{ shape: hex }\n  a1\nend\nx --> core');
      const [subgraph] = flow.parser.yy.getSubGraphs();
      expect(subgraph.id).toBe('core');
      expect(shapeOf('core')).toBe('hexagon');
      // The edge targets the subgraph, not a new node named `core`.
      const cores = flow.parser.yy.getData().nodes.filter((n) => n.id === 'core');
      expect(cores).toHaveLength(1);
    });

    it('should accept the same aliases a node does for the hexagon', function () {
      for (const alias of ['hex', 'hexagon', 'prepare']) {
        flow.parser.yy.clear();
        flow.parser.yy.setGen('gen-2');
        flow.parser.parse(`graph TB\nsubgraph s@{ shape: ${alias} }\n  a1\nend`);
        expect(shapeOf('s')).toBe('hexagon');
      }
    });

    it('should nest shaped subgraphs', function () {
      flow.parser.parse(
        'graph TB\nsubgraph outer@{ shape: hex }\n subgraph inner@{ shape: hex }\n  a1\n end\nend'
      );
      expect(shapeOf('outer')).toBe('hexagon');
      expect(shapeOf('inner')).toBe('hexagon');
      const { nodes } = flow.parser.yy.getData();
      expect(nodes.find((n) => n.id === 'inner')?.parentId).toBe('outer');
    });

    it('should apply a shape given after the subgraph closes', function () {
      flow.parser.parse('graph TB\nsubgraph core\n  a1\nend\ncore@{ shape: hex }');
      expect(shapeOf('core')).toBe('hexagon');
    });

    it('should keep drawing a subgraph without a shape as a rectangle', function () {
      flow.parser.parse('graph TB\nsubgraph core\n  a1\nend');
      expect(shapeOf('core')).toBe('rect');
    });

    it('should draw rect explicitly as a rectangle', function () {
      flow.parser.parse('graph TB\nsubgraph core@{ shape: rect }\n  a1\nend');
      expect(shapeOf('core')).toBe('rect');
    });

    it('should reject a shape that is not a subgraph shape', function () {
      expect(() => flow.parser.parse('graph TB\nsubgraph core@{ shape: cyl }\n  a1\nend')).toThrow(
        'No such subgraph shape: cyl.'
      );
    });

    it('should reject an unknown shape given after the subgraph closes', function () {
      expect(() =>
        flow.parser.parse('graph TB\nsubgraph core\n  a1\nend\ncore@{ shape: nope }')
      ).toThrow('No such subgraph shape: nope.');
    });
  });
});
