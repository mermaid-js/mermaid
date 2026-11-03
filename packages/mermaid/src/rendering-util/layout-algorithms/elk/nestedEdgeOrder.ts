import type { TreeData } from './find-common-ancestor.js';
import type { EdgeEnds } from './subgraphFeedbackEdges.js';

/** Whether `id` sits inside the subgraph `ancestorId`, at any depth. */
function isInside(id: string, ancestorId: string, { parentById }: TreeData): boolean {
  let current = parentById[id];
  while (current !== undefined) {
    if (current === ancestorId) {
      return true;
    }
    current = parentById[current];
  }
  return false;
}

/**
 * The order to hand ELK the edges in, so that an edge from inside a subgraph does not cross the
 * edge from that subgraph's border.
 *
 * With `considerModelOrder` set, ELK 0.10 and later line up the edges that share an end in
 * declaration order, even where that adds a crossing. An edge declared from a subgraph's border
 * and a later one from a node inside it, into the same target, then cross on the way there
 * (`outer --> a`, then `da --> a` with `da` inside `outer`). The same happens at the other end
 * (`a --> outer`, then `a --> da`). Each such edge therefore moves in front of the first edge
 * declared before it that leaves the subgraph around its source for the same target, or that
 * enters the subgraph around its target from the same source. All other edges keep their order.
 *
 * @param edges - the edges as ELK is given them, after any feedback edge is reversed
 * @param tree - the subgraph parent lookup
 * @returns the edge indexes in the order to hand them to ELK
 */
export function orderNestedEdgeEnds(edges: readonly EdgeEnds[], tree: TreeData): number[] {
  const order = edges.map((_, index) => index);
  edges.forEach(({ source, target }, index) => {
    const from = order.indexOf(index);
    const to = order.findIndex((other, position) => {
      const earlier = edges[other];
      return (
        position < from &&
        ((earlier.target === target && isInside(source, earlier.source, tree)) ||
          (earlier.source === source && isInside(target, earlier.target, tree)))
      );
    });
    if (to !== -1) {
      order.splice(from, 1);
      order.splice(to, 0, index);
    }
  });
  return order;
}
