import type { ClusterNode, LayoutData, Node } from '../../types.js';

type Edge = LayoutData['edges'][number];

export type PortKind = 'driving' | 'driven';

export interface OnionPort {
  readonly id: string;
  readonly kind: PortKind;
}

export interface OnionStructure {
  /** Nested groups, outermost first: adapters, core, then the inner rings. */
  readonly rings: readonly ClusterNode[];
  /** Leaf children of the core ring, split by whether edges enter from or leave to outside the core. */
  readonly ports: readonly OnionPort[];
  /** Leaf children of each inner ring (`rings[2..]`), same order as `rings.slice(2)`. */
  readonly innerLeafIds: readonly (readonly string[])[];
  /** Leaves inside the outermost ring but outside the core. */
  readonly adapterIds: readonly string[];
  /** Leaves with no parent group. */
  readonly externalIds: readonly string[];
  /** Groups that only list adapters of one side; they have no frame. */
  readonly sideGroupIds: ReadonlySet<string>;
  readonly neighbours: ReadonlyMap<string, readonly string[]>;
  readonly edges: readonly Edge[];
}

function childGroups(nodes: readonly Node[], parentId: string | undefined): ClusterNode[] {
  return nodes.filter((n): n is ClusterNode => n.isGroup === true && n.parentId === parentId);
}

/**
 * The chain of nested groups that forms the rings, plus the sibling groups that only hold leaves
 * beside a ring (side hints, not rings).
 */
function findRings(nodes: readonly Node[]): { rings: ClusterNode[]; sideGroupIds: Set<string> } {
  const roots = childGroups(nodes, undefined);
  if (roots.length !== 1) {
    throw new Error(`onion layout needs exactly one outermost group, found ${roots.length}`);
  }
  const rings: ClusterNode[] = [roots[0]];
  const sideGroupIds = new Set<string>();
  for (;;) {
    const candidates = childGroups(nodes, rings.at(-1)!.id);
    if (candidates.length === 0) {
      break;
    }
    const nesting = candidates.filter((c) => childGroups(nodes, c.id).length > 0);
    const ring = candidates.length === 1 ? candidates[0] : nesting[0];
    if (!ring || (candidates.length > 1 && nesting.length !== 1)) {
      throw new Error('onion layout cannot tell which child group continues the ring chain');
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
  const { rings, sideGroupIds } = findRings(data.nodes);
  if (rings.length < 3) {
    throw new Error('onion layout needs at least three nested groups: adapters, core, inner ring');
  }
  const core = rings[1];
  const insideCore = descendantIds(data.nodes, core.id);
  insideCore.add(core.id);
  const insideOuter = descendantIds(data.nodes, rings[0].id);

  const neighbours = new Map<string, string[]>();
  const link = (a: string, b: string) => {
    neighbours.set(a, [...(neighbours.get(a) ?? []), b]);
  };
  for (const e of data.edges) {
    if (e.start && e.end) {
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

  return {
    rings,
    ports,
    innerLeafIds: rings
      .slice(2)
      .map((ring) =>
        data.nodes.filter((n) => !n.isGroup && n.parentId === ring.id).map((n) => n.id)
      ),
    adapterIds: data.nodes
      .filter((n) => !n.isGroup && insideOuter.has(n.id) && !insideCore.has(n.id))
      .map((n) => n.id),
    externalIds: data.nodes.filter((n) => !n.isGroup && n.parentId === undefined).map((n) => n.id),
    sideGroupIds,
    neighbours,
    edges: data.edges,
  };
}
