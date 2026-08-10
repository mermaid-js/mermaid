/**
 * Chain identification (guide §13.1).
 *
 * A *link* is a core node of undirected degree 2. A chain is a maximal
 * connected run of links; an open chain is bounded by two non-link anchors,
 * a closed chain is a cycle made entirely of links and has no anchor at all.
 */

import type { HolaGraph } from '../model.js';
import { degree } from '../model.js';

export interface OpenChain {
  kind: 'open';
  /** Non-link node at the start. */
  startAnchor: string;
  /** Non-link node at the end. */
  endAnchor: string;
  /** Links in order from `startAnchor` to `endAnchor`. */
  links: string[];
}

export interface ClosedChain {
  kind: 'closed';
  /** Links in cycle order. */
  links: string[];
}

export type Chain = OpenChain | ClosedChain;

export function isLink(graph: HolaGraph, id: string): boolean {
  return degree(graph, id) === 2;
}

export function findChains(graph: HolaGraph): Chain[] {
  const links = [...graph.nodes.keys()].filter((id) => isLink(graph, id));
  const linkSet = new Set(links);
  const visited = new Set<string>();
  const chains: Chain[] = [];

  const byInput = (a: string, b: string): number =>
    (graph.nodes.get(a)?.inputOrder ?? 0) - (graph.nodes.get(b)?.inputOrder ?? 0);

  for (const seed of [...links].sort(byInput)) {
    if (visited.has(seed)) {
      continue;
    }

    // Walk both ways from the seed to collect the maximal run of links.
    const [first, second] = [...(graph.adjacency.get(seed) ?? [])];
    const backward = walk(graph, seed, first, linkSet);
    const forward = walk(graph, seed, second, linkSet);

    if (backward.closed || forward.closed) {
      const cycle = [seed, ...forward.links];
      cycle.forEach((id) => visited.add(id));
      chains.push({ kind: 'closed', links: cycle });
      continue;
    }

    const ordered = [...backward.links.reverse(), seed, ...forward.links];
    ordered.forEach((id) => visited.add(id));

    const startAnchor = backward.anchor;
    const endAnchor = forward.anchor;
    if (startAnchor === undefined || endAnchor === undefined) {
      // Degenerate: an isolated link run with a missing anchor cannot occur in
      // a core (every core node has degree ≥ 2), but stay defensive.
      continue;
    }

    chains.push({ kind: 'open', startAnchor, endAnchor, links: ordered });
  }

  return chains;
}

interface WalkResult {
  links: string[];
  anchor?: string;
  closed: boolean;
}

function walk(
  graph: HolaGraph,
  from: string,
  towards: string | undefined,
  linkSet: Set<string>
): WalkResult {
  const links: string[] = [];
  let previous = from;
  let current = towards;

  while (current !== undefined && linkSet.has(current)) {
    if (current === from) {
      return { links, closed: true };
    }
    links.push(current);
    const next = [...(graph.adjacency.get(current) ?? [])].find((n) => n !== previous);
    previous = current;
    current = next;
  }

  return { links, anchor: current, closed: false };
}
