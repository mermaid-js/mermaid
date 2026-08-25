import type { Edge, LayoutData, Node } from '../../../types.js';
import type { Entity, GroupModel } from './groups.js';
import { buildGroupModel } from './groups.js';

/** A leaf node taking part in the layout, with its measured size. */
export interface LayoutVariable {
  id: string;
  node: Node;
  width: number;
  height: number;
}

/** A deduplicated, non-reflexive edge between two leaf variables. */
export interface LayoutLink {
  source: number;
  target: number;
}

/**
 * A link that may name a subgraph at either end.
 *
 * Mermaid allows an edge to point at a subgraph, and the flow constraints
 * honour that by ordering against the subgraph's frame rather than dropping the
 * edge on the floor.
 */
export interface EntityLink {
  source: Entity;
  target: Entity;
}

export interface IpsepColaGraph {
  /** Leaf nodes, occupying variable indices `0 .. variables.length - 1`. */
  variables: LayoutVariable[];
  /** Leaf variable index by node id. */
  indexById: Map<string, number>;
  /** Leaf *or* group, by node id. */
  entityById: Map<string, Entity>;
  /** The subgraph hierarchy and its boundary variables; empty unless opted in. */
  groups: GroupModel;
  /** Leaves plus two boundary variables per modelled group. */
  variableCount: number;
  /** Leaf-to-leaf links — the graph the stress model sees. */
  links: LayoutLink[];
  /** Every link, subgraph endpoints included. */
  entityLinks: EntityLink[];
  /** Undirected adjacency over leaves, used for the graph-distance model. */
  neighbors: number[][];
  /** Edges whose endpoints both resolve, in `data4Layout.edges` order. */
  routableEdges: Edge[];
  /** Edges from a node to itself, routed separately. */
  selfLoops: Edge[];
}

export interface BuildGraphOptions {
  /**
   * Model subgraphs as frames with their own boundary variables.
   *
   * Off by default, which reproduces the flat behaviour exactly: no group
   * variables, every leaf a top-level sibling. Callers that do not implement
   * containment (the `grid-like` layout builds on this same adapter) therefore
   * see the graph they already expect.
   */
  groups?: boolean;
  /** Clearance a group's title needs at the top of its frame. */
  titleHeightOf?: (group: Node) => number;
}

/**
 * Turn `LayoutData` into the flat, index-based graph the solver works on.
 *
 * Parallel edges collapse to a single link so a doubled connection does not
 * silently double its pull in the stress model.
 */
export function buildIpsepColaGraph(
  data4Layout: LayoutData,
  options: BuildGraphOptions = {}
): IpsepColaGraph {
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

  const groups = buildGroupModel(data4Layout, indexById, {
    enabled: options.groups ?? false,
    titleHeightOf: options.titleHeightOf ?? (() => 0),
  });

  const entityById = new Map<string, Entity>();
  for (const [id, index] of indexById) {
    entityById.set(id, { kind: 'leaf', index });
  }
  for (const [id, index] of groups.indexById) {
    entityById.set(id, { kind: 'group', index });
  }

  const links: LayoutLink[] = [];
  const entityLinks: EntityLink[] = [];
  const seenLinks = new Set<string>();
  const routableEdges: Edge[] = [];
  const selfLoops: Edge[] = [];

  for (const edge of data4Layout.edges ?? []) {
    if (edge.isLayoutOnly) {
      continue;
    }
    const source = edge.start === undefined ? undefined : entityById.get(edge.start);
    const target = edge.end === undefined ? undefined : entityById.get(edge.end);
    if (!source || !target) {
      continue;
    }

    if (edge.start === edge.end) {
      selfLoops.push(edge);
      continue;
    }

    // An edge between a group and something inside it has no meaningful
    // direction — the frame already contains the node — and ordering against it
    // would fight containment.
    if (enclosedEitherWay(source, target, groups)) {
      continue;
    }

    routableEdges.push(edge);

    const key = linkKey(source, target);
    if (seenLinks.has(key)) {
      continue;
    }
    seenLinks.add(key);
    entityLinks.push({ source, target });
    if (source.kind === 'leaf' && target.kind === 'leaf') {
      links.push({ source: source.index, target: target.index });
    }
  }

  const neighbors: number[][] = variables.map(() => []);
  for (const link of links) {
    neighbors[link.source].push(link.target);
    neighbors[link.target].push(link.source);
  }

  return {
    variables,
    indexById,
    entityById,
    groups,
    variableCount: groups.variableCount,
    links,
    entityLinks,
    neighbors,
    routableEdges,
    selfLoops,
  };
}

function linkKey(a: Entity, b: Entity): string {
  const left = `${a.kind}:${a.index}`;
  const right = `${b.kind}:${b.index}`;
  return left < right ? `${left}|${right}` : `${right}|${left}`;
}

/** Is one endpoint enclosed by the other? */
function enclosedEitherWay(a: Entity, b: Entity, groups: GroupModel): boolean {
  return enclosedBy(a, b, groups) || enclosedBy(b, a, groups);
}

function enclosedBy(inner: Entity, outer: Entity, groups: GroupModel): boolean {
  if (outer.kind !== 'group') {
    return false;
  }
  let parent =
    inner.kind === 'group' ? groups.groups[inner.index].parent : groups.parentOfLeaf(inner.index);
  const seen = new Set<number>();
  while (parent !== -1 && !seen.has(parent)) {
    if (parent === outer.index) {
      return true;
    }
    seen.add(parent);
    parent = groups.groups[parent].parent;
  }
  return false;
}
