import type { Edge, LayoutData, Node } from '../../../types.js';

/** A node taking part in the layout, with its measured size. */
export interface LayoutVariable {
  id: string;
  node: Node;
  width: number;
  height: number;
}

/** A deduplicated, non-reflexive edge between two layout variables. */
export interface LayoutLink {
  source: number;
  target: number;
}

export interface IpsepColaGraph {
  variables: LayoutVariable[];
  /** Index of each participating node id in {@link variables}. */
  indexById: Map<string, number>;
  links: LayoutLink[];
  /** Undirected adjacency, used for the graph-distance model. */
  neighbors: number[][];
  /** Edges whose endpoints are both laid out, in `data4Layout.edges` order. */
  routableEdges: Edge[];
  /** Edges from a node to itself, routed separately. */
  selfLoops: Edge[];
}

/**
 * Turn `LayoutData` into the flat, index-based graph the solver works on.
 *
 * Group nodes are excluded: this implementation lays out the leaf nodes only
 * and sizes group frames around the result afterwards (see `writeBack.ts`).
 * Parallel edges collapse to a single link so a doubled connection does not
 * silently double its pull in the stress model.
 */
export function buildIpsepColaGraph(data4Layout: LayoutData): IpsepColaGraph {
  const variables: LayoutVariable[] = [];
  const indexById = new Map<string, number>();

  for (const node of data4Layout.nodes ?? []) {
    if (node.isGroup) {
      continue;
    }
    indexById.set(node.id, variables.length);
    variables.push({
      id: node.id,
      node,
      width: node.width ?? 0,
      height: node.height ?? 0,
    });
  }

  const links: LayoutLink[] = [];
  const seenLinks = new Set<string>();
  const routableEdges: Edge[] = [];
  const selfLoops: Edge[] = [];

  for (const edge of data4Layout.edges ?? []) {
    if (edge.isLayoutOnly) {
      continue;
    }
    const source = edge.start === undefined ? undefined : indexById.get(edge.start);
    const target = edge.end === undefined ? undefined : indexById.get(edge.end);
    if (source === undefined || target === undefined) {
      continue;
    }

    if (source === target) {
      selfLoops.push(edge);
      continue;
    }

    routableEdges.push(edge);

    const key = source < target ? `${source}|${target}` : `${target}|${source}`;
    if (seenLinks.has(key)) {
      continue;
    }
    seenLinks.add(key);
    links.push({ source, target });
  }

  const neighbors: number[][] = variables.map(() => []);
  for (const link of links) {
    neighbors[link.source].push(link.target);
    neighbors[link.target].push(link.source);
  }

  return { variables, indexById, links, neighbors, routableEdges, selfLoops };
}
