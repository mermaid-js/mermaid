import { describe, expect, it } from 'vitest';
import type { TreeData } from '../find-common-ancestor.js';
import { orderNestedEdgeEnds } from '../nestedEdgeOrder.js';

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

describe('orderNestedEdgeEnds', () => {
  it('moves an edge from inside a subgraph in front of the edge from its border', () => {
    // outer --> a, then da --> a with da nested in outer
    const order = orderNestedEdgeEnds(
      edges(['outer', 'a'], ['da', 'a']),
      tree({ da: 'inner', inner: 'middle', middle: 'outer' })
    );
    expect(order).toEqual([1, 0]);
  });

  it('moves an edge into a subgraph member in front of the edge into its border', () => {
    const order = orderNestedEdgeEnds(edges(['a', 'outer'], ['a', 'da']), tree({ da: 'outer' }));
    expect(order).toEqual([1, 0]);
  });

  it('applies to a feedback edge as ELK is given it, reversed', () => {
    // three --> two, then two --> c2 with c2 inside three, handed to ELK as c2 -> two
    const order = orderNestedEdgeEnds(
      edges(['three', 'two'], ['c2', 'two']),
      tree({ b1: 'two', c2: 'three' })
    );
    expect(order).toEqual([1, 0]);
  });

  it('keeps the order when the inner edge is already declared first', () => {
    const order = orderNestedEdgeEnds(edges(['da', 'a'], ['outer', 'a']), tree({ da: 'outer' }));
    expect(order).toEqual([0, 1]);
  });

  it('keeps the order of edges whose other ends differ', () => {
    const order = orderNestedEdgeEnds(
      edges(['outer', 'a'], ['da', 'b'], ['x', 'outer']),
      tree({ da: 'outer' })
    );
    expect(order).toEqual([0, 1, 2]);
  });

  it('keeps the order of edges from sibling subgraphs', () => {
    const order = orderNestedEdgeEnds(edges(['A', 't'], ['b1', 't']), tree({ a1: 'A', b1: 'B' }));
    expect(order).toEqual([0, 1]);
  });

  it('moves only past the edges declared before it', () => {
    const order = orderNestedEdgeEnds(
      edges(['x', 'y'], ['S', 't'], ['x', 'z'], ['s1', 't'], ['S', 'u']),
      tree({ s1: 'S' })
    );
    expect(order).toEqual([0, 3, 1, 2, 4]);
  });
});
