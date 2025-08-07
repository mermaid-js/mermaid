/**
 * Lezer-based flowchart parser tests for direction handling
 * Migrated from flow-direction.spec.js to test Lezer parser compatibility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import flowParser from './flowParser.ts';
import { FlowDB } from '../flowDb.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('[Lezer Direction] when parsing directions', () => {
  beforeEach(() => {
    flowParser.parser.yy = new FlowDB();
    flowParser.parser.yy.clear();
    flowParser.parser.yy.setGen('gen-2');
  });

  it('should use default direction from top level', () => {
    const result = flowParser.parser.parse(`flowchart TB
    subgraph A
      a --> b
    end`);

    const subgraphs = flowParser.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];
    expect(subgraph.nodes.length).toBe(2);
    // Check that both nodes are present (order may vary)
    expect(subgraph.nodes).toContain('a');
    expect(subgraph.nodes).toContain('b');
    expect(subgraph.id).toBe('A');
    expect(subgraph.dir).toBe(undefined);
  });

  it('should handle a subgraph with a direction', () => {
    const result = flowParser.parser.parse(`flowchart TB
    subgraph A
      direction BT
      a --> b
    end`);

    const subgraphs = flowParser.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];
    expect(subgraph.nodes.length).toBe(2);
    // Check that both nodes are present (order may vary)
    expect(subgraph.nodes).toContain('a');
    expect(subgraph.nodes).toContain('b');
    expect(subgraph.id).toBe('A');
    expect(subgraph.dir).toBe('BT');
  });

  it('should use the last defined direction', () => {
    const result = flowParser.parser.parse(`flowchart TB
    subgraph A
      direction BT
      a --> b
      direction RL
    end`);

    const subgraphs = flowParser.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];
    expect(subgraph.nodes.length).toBe(2);
    // Check that both nodes are present (order may vary)
    expect(subgraph.nodes).toContain('a');
    expect(subgraph.nodes).toContain('b');
    expect(subgraph.id).toBe('A');
    expect(subgraph.dir).toBe('RL');
  });

  it('should handle nested subgraphs 1', () => {
    const result = flowParser.parser.parse(`flowchart TB
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

    const subgraphs = flowParser.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(2);

    const subgraphA = subgraphs.find((o) => o.id === 'A');
    const subgraphB = subgraphs.find((o) => o.id === 'B');

    expect(subgraphB?.nodes[0]).toBe('c');
    expect(subgraphB?.dir).toBe('LR');
    expect(subgraphA?.nodes).toContain('B');
    expect(subgraphA?.nodes).toContain('b');
    expect(subgraphA?.nodes).toContain('a');
    expect(subgraphA?.nodes).not.toContain('c');
    expect(subgraphA?.dir).toBe('RL');
  });
});
