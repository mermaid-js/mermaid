import { describe, expect, it } from 'vitest';
import type { TreeData } from '../find-common-ancestor.js';
import { findSubgraphFeedbackEdges } from '../subgraphFeedbackEdges.js';

/** Build the parent lookup the renderer derives from `node.parentId`. */
function tree(parents: Record<string, string>): TreeData {
  const childrenById: Record<string, string[]> = {};
  for (const [child, parent] of Object.entries(parents)) {
    (childrenById[parent] ??= []).push(child);
  }
  return { parentById: parents, childrenById };
}

const edges = (...pairs: [string, string][]) =>
  pairs.map(([source, target]) => ({ source, target }));

describe('findSubgraphFeedbackEdges', () => {
  it('flags the edge that re-enters a subgraph from a node fed by it', () => {
    // A -> B inside G, then B -> X -> C with C inside G: G -> X -> G is a cycle once G is collapsed
    const flags = findSubgraphFeedbackEdges(
      edges(['S', 'A'], ['A', 'B'], ['B', 'X'], ['X', 'C']),
      tree({ A: 'G', B: 'G', C: 'G' })
    );
    expect(flags).toEqual([false, false, false, true]);
  });

  it('leaves a cycle between plain nodes to ELK', () => {
    const flags = findSubgraphFeedbackEdges(edges(['A', 'B'], ['B', 'C'], ['C', 'A']), tree({}));
    expect(flags).toEqual([false, false, false]);
  });

  it('leaves a cycle inside one subgraph to ELK', () => {
    const flags = findSubgraphFeedbackEdges(
      edges(['A', 'B'], ['B', 'A']),
      tree({ A: 'G', B: 'G' })
    );
    expect(flags).toEqual([false, false]);
  });

  it('flags nothing when the collapsed graph is acyclic', () => {
    const flags = findSubgraphFeedbackEdges(
      edges(['S', 'A'], ['A', 'B'], ['B', 'X'], ['S', 'C']),
      tree({ A: 'G', B: 'G', C: 'G' })
    );
    expect(flags).toEqual([false, false, false, false]);
  });

  it('looks at each edge on the graph of its lowest common subgraph', () => {
    // inside OUTER: G -> Y -> G is a cycle once G is collapsed; the root level sees none
    const flags = findSubgraphFeedbackEdges(
      edges(['S', 'A'], ['A', 'Y'], ['Y', 'B']),
      tree({ A: 'G', B: 'G', G: 'OUTER', Y: 'OUTER' })
    );
    expect(flags).toEqual([false, false, true]);
  });

  it('ignores edges between a subgraph and its own members, and self loops', () => {
    const flags = findSubgraphFeedbackEdges(
      edges(['G', 'A'], ['A', 'G'], ['A', 'A']),
      tree({ A: 'G' })
    );
    expect(flags).toEqual([false, false, false]);
  });

  it('leaves a cycle through a subgraph to ELK when a plain edge closes it', () => {
    // X -> G -> Y -> X once G is collapsed, closed by the plain Y -> X. ELK then reverses Y -> X,
    // and X -> B drops straight into G; reversing X -> B instead routes it around the diagram.
    const flags = findSubgraphFeedbackEdges(
      edges(['S', 'X'], ['X', 'B'], ['A', 'Y'], ['Y', 'X']),
      tree({ A: 'G', B: 'G' })
    );
    expect(flags).toEqual([false, false, false, false]);
  });

  it('keeps the earlier-declared direction when two subgraphs feed each other', () => {
    const flags = findSubgraphFeedbackEdges(
      edges(['A', 'C'], ['D', 'B']),
      tree({ A: 'G', B: 'G', C: 'H', D: 'H' })
    );
    expect(flags).toEqual([false, true]);
  });
});
