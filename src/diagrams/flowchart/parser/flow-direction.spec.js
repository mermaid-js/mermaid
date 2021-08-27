import flowDb from '../flowDb';
import flow from './flow';
import filter from 'lodash/filter';
import { setConfig } from '../../../config';
// import DOMPurify from 'dompurify';

// const domPurify = DOMPurify.createDOMPurify(window);

// const clean = DOMPurify.sanitize(dirty);
setConfig({
  securityLevel: 'strict'
});

describe('when parsing directions', function() {
  beforeEach(function() {
    flow.parser.yy = flowDb;
    flow.parser.yy.clear();
    flow.parser.yy.setGen('gen-2');
  });


  it('should use default direction from top level', function() {
    const res = flow.parser.parse(`flowchart TB
    subgraph A
      a --> b
    end`);

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];
    expect(subgraph.nodes.length).toBe(2);
    expect(subgraph.nodes[0]).toBe('b');
    expect(subgraph.nodes[1]).toBe('a');
    expect(subgraph.id).toBe('A');
    expect(subgraph.dir).toBe(undefined);
  });
  it('should handle a subgraph with a direction', function() {
    const res = flow.parser.parse(`flowchart TB
    subgraph A
      direction BT
      a --> b
    end`);

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];
    expect(subgraph.nodes.length).toBe(2);
    expect(subgraph.nodes[0]).toBe('b');
    expect(subgraph.nodes[1]).toBe('a');
    expect(subgraph.id).toBe('A');
    expect(subgraph.dir).toBe('BT');
  });
  it('should use the last defined direction', function() {
    const res = flow.parser.parse(`flowchart TB
    subgraph A
      direction BT
      a --> b
      direction RL
    end`);

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];
    expect(subgraph.nodes.length).toBe(2);
    expect(subgraph.nodes[0]).toBe('b');
    expect(subgraph.nodes[1]).toBe('a');
    expect(subgraph.id).toBe('A');
    expect(subgraph.dir).toBe('RL');
  });

  it('should handle nested subgraphs 1', function() {
    const res = flow.parser.parse(`flowchart TB
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

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(2);

    const subgraphA = filter(subgraphs,o => o.id === 'A')[0];
    const subgraphB = filter(subgraphs,o => o.id === 'B')[0];

    expect(subgraphB.nodes[0]).toBe('c');
    expect(subgraphB.dir).toBe('LR');
    expect(subgraphA.nodes).toContain('B');
    expect(subgraphA.nodes).toContain('b');
    expect(subgraphA.nodes).toContain('a');
    expect(subgraphA.nodes).not.toContain('c');
    expect(subgraphA.dir).toBe('RL');
  });

});
