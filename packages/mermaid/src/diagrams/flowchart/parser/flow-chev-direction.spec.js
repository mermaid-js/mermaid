import { FlowDB } from '../flowDb.js';
import flow from './flowParserAdapter.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('when parsing directions with Chevrotain', function () {
  beforeEach(function () {
    flow.yy = new FlowDB();
    flow.yy.clear();
    flow.yy.setGen('gen-2');
  });

  it('should use default direction from top level', function () {
    const res = flow.parse(`flowchart TB
    subgraph A
      a --> b
    end`);

    const subgraphs = flow.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];
    expect(subgraph.nodes.length).toBe(2);
    // Chevrotain parser now produces nodes in the correct order: a --> b means ['a', 'b']
    expect(subgraph.nodes[0]).toBe('a');
    expect(subgraph.nodes[1]).toBe('b');
    expect(subgraph.id).toBe('A');
    expect(subgraph.dir).toBe(undefined);
  });
  it('should handle a subgraph with a direction', function () {
    const res = flow.parse(`flowchart TB
    subgraph A
      direction BT
      a --> b
    end`);

    const subgraphs = flow.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];
    expect(subgraph.nodes.length).toBe(2);
    // Chevrotain parser now produces nodes in the correct order: a --> b means ['a', 'b']
    expect(subgraph.nodes[0]).toBe('a');
    expect(subgraph.nodes[1]).toBe('b');
    expect(subgraph.id).toBe('A');
    expect(subgraph.dir).toBe('BT');
  });
  it('should use the last defined direction', function () {
    const res = flow.parse(`flowchart TB
    subgraph A
      direction BT
      a --> b
      direction RL
    end`);

    const subgraphs = flow.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];
    expect(subgraph.nodes.length).toBe(2);
    // Chevrotain parser now produces nodes in the correct order: a --> b means ['a', 'b']
    expect(subgraph.nodes[0]).toBe('a');
    expect(subgraph.nodes[1]).toBe('b');
    expect(subgraph.id).toBe('A');
    expect(subgraph.dir).toBe('RL');
  });

  it('should handle nested subgraphs 1', function () {
    const res = flow.parse(`flowchart TB
    subgraph A
      direction RL
      b-->B
      a
    end
    a-->c
    subgraph B
      direction LR
      c
    end`);

    const subgraphs = flow.yy.getSubGraphs();
    expect(subgraphs.length).toBe(2);

    const subgraphA = subgraphs.find((o) => o.id === 'A');
    const subgraphB = subgraphs.find((o) => o.id === 'B');

    expect(subgraphB.nodes[0]).toBe('c');
    expect(subgraphB.dir).toBe('LR');
    expect(subgraphA.nodes).toContain('B');
    expect(subgraphA.nodes).toContain('b');
    expect(subgraphA.nodes).toContain('a');
    expect(subgraphA.nodes).not.toContain('c');
    expect(subgraphA.dir).toBe('RL');
  });
});
