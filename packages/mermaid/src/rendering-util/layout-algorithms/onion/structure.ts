import type { ClusterNode, LayoutData, Node } from '../../types.js';

type Edge = LayoutData['edges'][number];

export type PortKind = 'driving' | 'driven';

/** Raised when the graph does not have the nested-group shape the onion layout needs. */
export class OnionLayoutError extends Error {
  constructor(message: string) {
    super(`onion layout: ${message}`);
    this.name = 'OnionLayoutError';
  }
}

export interface OnionPort {
  readonly id: string;
  readonly kind: PortKind;
}

export interface OnionStructure {
  /** The adapters ring around the core; absent when the diagram starts at the core with side groups beside it. */
  readonly outer: ClusterNode | undefined;
  readonly core: ClusterNode;
  /** Rings inside the core, outermost first. The last one is packed on the centre. */
  readonly innerRings: readonly ClusterNode[];
  /** Leaf children of the core ring, split by whether edges enter from or leave to outside the core. */
  readonly ports: readonly OnionPort[];
  /** Leaf children of each inner ring, same order as `innerRings`. */
  readonly innerLeafIds: readonly (readonly string[])[];
  /** Leaves outside the core that sit in a group: the adapters. */
  readonly adapterIds: readonly string[];
  /** Leaves with no parent group. */
  readonly externalIds: readonly string[];
  /** Groups that only list the leaves of one side; they have no frame. */
  readonly sideGroupIds: ReadonlySet<string>;
  readonly neighbours: ReadonlyMap<string, readonly string[]>;
  readonly edges: readonly Edge[];
}

function childGroups(nodes: readonly Node[], parentId: string | undefined): ClusterNode[] {
  return nodes.filter((n): n is ClusterNode => n.isGroup && n.parentId === parentId);
}

/** Chain of nested groups starting at `first`, plus the leaf-only siblings met along the way. */
function followChain(
  nodes: readonly Node[],
  first: ClusterNode
): { rings: ClusterNode[]; sideGroupIds: Set<string> } {
  const rings: ClusterNode[] = [first];
  const sideGroupIds = new Set<string>();
  for (;;) {
    const candidates = childGroups(nodes, rings.at(-1)!.id);
    if (candidates.length === 0) {
      break;
    }
    const nesting = candidates.filter((c) => childGroups(nodes, c.id).length > 0);
    const ring = candidates.length === 1 ? candidates[0] : nesting[0];
    if (!ring || (candidates.length > 1 && nesting.length !== 1)) {
      throw new OnionLayoutError(
        `cannot tell which child group of "${rings.at(-1)!.id}" continues the ring chain`
      );
    }
    for (const c of candidates) {
      if (c !== ring) {
        sideGroupIds.add(c.id);
      }
    }
    rings.push(ring);
  }
  return { rings, sideGroupIds };
}

function findRings(nodes: readonly Node[]): {
  outer: ClusterNode | undefined;
  rings: ClusterNode[];
  sideGroupIds: Set<string>;
} {
  const roots = childGroups(nodes, undefined);
  if (roots.length === 0) {
    throw new OnionLayoutError(
      'the diagram has no subgraphs; nest the rings as subgraphs (adapters > core > application > domain)'
    );
  }
  if (roots.length === 1) {
    const { rings, sideGroupIds } = followChain(nodes, roots[0]);
    if (rings.length < 3) {
      throw new OnionLayoutError(
        `found ${rings.length} nested subgraph(s) under "${roots[0].id}"; need an adapters ring, a core and at least one ring inside it`
      );
    }
    return { outer: rings[0], rings, sideGroupIds };
  }
  const nesting = roots.filter((r) => childGroups(nodes, r.id).length > 0);
  if (nesting.length !== 1) {
    throw new OnionLayoutError(
      `${roots.length} top-level subgraphs and ${nesting.length} of them contain further subgraphs; expected one core ring beside leaf-only side groups`
    );
  }
  const { rings, sideGroupIds } = followChain(nodes, nesting[0]);
  for (const r of roots) {
    if (r !== nesting[0]) {
      sideGroupIds.add(r.id);
    }
  }
  return { outer: undefined, rings, sideGroupIds };
}

export function findSideGroupIds(nodes: readonly Node[]): ReadonlySet<string> {
  return findRings(nodes).sideGroupIds;
}

function descendantIds(nodes: readonly Node[], groupId: string): Set<string> {
  const found = new Set<string>();
  const queue = [groupId];
  while (queue.length > 0) {
    const current = queue.pop()!;
    for (const n of nodes) {
      if (n.parentId === current && !found.has(n.id)) {
        found.add(n.id);
        queue.push(n.id);
      }
    }
  }
  return found;
}

export function analyseOnion(data: LayoutData): OnionStructure {
  const { outer, rings, sideGroupIds } = findRings(data.nodes);
  const core = outer ? rings[1] : rings[0];
  const innerRings = rings.slice(outer ? 2 : 1);
  const insideCore = descendantIds(data.nodes, core.id);
  insideCore.add(core.id);

  const neighbours = new Map<string, string[]>();
  const link = (a: string, b: string) => {
    neighbours.set(a, [...(neighbours.get(a) ?? []), b]);
  };
  for (const e of data.edges) {
    if (e.start && e.end && e.start !== e.end) {
      link(e.start, e.end);
      link(e.end, e.start);
    }
  }

  const ports: OnionPort[] = [];
  for (const n of data.nodes) {
    if (n.isGroup || n.parentId !== core.id) {
      continue;
    }
    let entering = 0;
    let leaving = 0;
    for (const e of data.edges) {
      if (e.start === n.id && e.end && !insideCore.has(e.end)) {
        leaving++;
      } else if (e.end === n.id && e.start && !insideCore.has(e.start)) {
        entering++;
      }
    }
    ports.push({ id: n.id, kind: entering >= leaving ? 'driving' : 'driven' });
  }

  const leaves = data.nodes.filter((n) => !n.isGroup);
  return {
    outer,
    core,
    innerRings,
    ports,
    innerLeafIds: innerRings.map((ring) =>
      leaves.filter((n) => n.parentId === ring.id).map((n) => n.id)
    ),
    adapterIds: leaves
      .filter((n) => n.parentId !== undefined && !insideCore.has(n.id))
      .map((n) => n.id),
    externalIds: leaves.filter((n) => n.parentId === undefined).map((n) => n.id),
    sideGroupIds,
    neighbours,
    edges: data.edges,
  };
}
