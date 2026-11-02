import type { TreeData } from './find-common-ancestor.js';
import { findCommonAncestor } from './find-common-ancestor.js';

/** An edge as far as cycle detection is concerned: the ids of its two ends. */
export interface EdgeEnds {
  source: string;
  target: string;
}

const ROOT = 'root';

/** The ancestor of `id` that is a direct child of `ancestorId` (or `id` itself). */
function childOnPath(id: string, ancestorId: string, { parentById }: TreeData): string {
  let current = id;
  while ((parentById[current] ?? ROOT) !== ancestorId) {
    current = parentById[current];
  }
  return current;
}

/**
 * Find the edges that close a cycle only because a subgraph is laid out as one node.
 *
 * With `INCLUDE_CHILDREN`, ELK lays out each subgraph as a single node of its parent graph. A node
 * outside a subgraph that both receives an edge from it and sends one into it therefore forms a
 * cycle there, even when the nodes inside do not (`A -> B` inside `G`, then `B -> X -> C` with `C`
 * inside `G`). ELK breaks that cycle by reversing one of the edges and routes it into the
 * subgraph's input side, around the outside of the subgraph.
 *
 * Each edge is looked at on the graph of its lowest common subgraph, with every subgraph below
 * that collapsed. A depth-first search from the sources, in declaration order, marks an edge that
 * points at a node still on the stack as a feedback edge. Only feedback edges with at least one
 * end inside a collapsed subgraph are returned, and ELK lays each of them out downstream of its
 * original target. A feedback edge between plain nodes is left to ELK's own cycle breaking, even
 * when its cycle runs through a subgraph: ELK can then reverse that plain edge, and the edges into
 * the subgraph keep pointing downstream.
 *
 * @param edges - the edges in declaration order
 * @param tree - the subgraph parent lookup
 * @returns one flag per edge, true where the edge should be laid out reversed
 */
export function findSubgraphFeedbackEdges(edges: readonly EdgeEnds[], tree: TreeData): boolean[] {
  const flags = edges.map(() => false);
  // lowest common subgraph -> edges between its direct children
  const levels = new Map<
    string,
    { index: number; from: string; to: string; collapsed: boolean }[]
  >();

  edges.forEach(({ source, target }, index) => {
    if (source === target) {
      return;
    }
    const ancestor = findCommonAncestor(source, target, tree);
    if (ancestor === source || ancestor === target) {
      // an edge between a subgraph and its own member crosses no boundary of the parent graph
      return;
    }
    const from = childOnPath(source, ancestor, tree);
    const to = childOnPath(target, ancestor, tree);
    const level = levels.get(ancestor) ?? [];
    level.push({ index, from, to, collapsed: from !== source || to !== target });
    levels.set(ancestor, level);
  });

  for (const level of levels.values()) {
    const successors = new Map<string, typeof level>();
    const nodes: string[] = [];
    const inDegree = new Map<string, number>();
    for (const edge of level) {
      for (const node of [edge.from, edge.to]) {
        if (!successors.has(node)) {
          successors.set(node, []);
          nodes.push(node);
          inDegree.set(node, 0);
        }
      }
      successors.get(edge.from)!.push(edge);
      inDegree.set(edge.to, inDegree.get(edge.to)! + 1);
    }

    const ON_STACK = 1;
    const DONE = 2;
    const state = new Map<string, number>();
    const roots = [...nodes.filter((node) => inDegree.get(node) === 0), ...nodes];
    for (const root of roots) {
      if (state.has(root)) {
        continue;
      }
      state.set(root, ON_STACK);
      const stack = [{ node: root, next: 0 }];
      while (stack.length > 0) {
        const frame = stack[stack.length - 1];
        const out = successors.get(frame.node)!;
        if (frame.next >= out.length) {
          state.set(frame.node, DONE);
          stack.pop();
          continue;
        }
        const edge = out[frame.next++];
        const seen = state.get(edge.to);
        if (seen === ON_STACK) {
          flags[edge.index] = edge.collapsed;
        } else if (seen === undefined) {
          state.set(edge.to, ON_STACK);
          stack.push({ node: edge.to, next: 0 });
        }
      }
    }
  }

  return flags;
}

/**
 * The order to hand ELK the edges in once the feedback edges are reversed.
 *
 * With `considerModelOrder` set, ELK 0.10 and later line up the edges that enter one node in
 * declaration order, even where that adds a crossing. A reversed edge into a subgraph leaves the
 * subgraph it really points into, and kept after an edge declared from that same subgraph's
 * border, the two cross in the gap between the subgraphs (`three --> two`, then `two --> c2` with
 * `c2` inside `three`). Each reversed edge into a subgraph therefore moves in front of the first
 * forward edge declared before it that enters the same subgraph. Edges into plain nodes keep their
 * order.
 *
 * @param targets - the target of each edge as ELK is given it, after reversal
 * @param reversed - one flag per edge, true where the edge is laid out reversed
 * @param tree - the subgraph parent lookup
 * @returns the edge indexes in the order to hand them to ELK
 */
export function orderReversedSubgraphEntries(
  targets: readonly string[],
  reversed: readonly boolean[],
  tree: TreeData
): number[] {
  const order = targets.map((_, index) => index);
  targets.forEach((target, index) => {
    if (!reversed[index] || !tree.childrenById[target]?.length) {
      return;
    }
    const to = order.findIndex((other) => !reversed[other] && targets[other] === target);
    const from = order.indexOf(index);
    if (to !== -1 && to < from) {
      order.splice(from, 1);
      order.splice(to, 0, index);
    }
  });
  return order;
}
