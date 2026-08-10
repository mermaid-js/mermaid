/**
 * Weakly connected components and left-to-right packing (guide §9.2, §9.3).
 *
 * Splitting happens *before* HOLA runs, not after a decomposition notices a
 * disconnected core (invariant 3). Each component then gets its own constraint
 * system, stress model, router and face set, so no component can exert stress,
 * obstacle, alignment or routing influence on another (invariant 20).
 */

import type { Bounds, HolaGraph, Point } from '../model.js';
import { addEdge, addNode, createGraph, unionBounds } from '../model.js';

export interface ComponentGraph {
  id: string;
  graph: HolaGraph;
  /** Input order of the earliest node, used to order components. */
  firstInputOrder: number;
}

export function weaklyConnectedComponents(graph: HolaGraph): ComponentGraph[] {
  const seen = new Set<string>();
  const components: ComponentGraph[] = [];

  const ordered = [...graph.nodes.values()].sort((a, b) => a.inputOrder - b.inputOrder);

  for (const seed of ordered) {
    if (seen.has(seed.id)) {
      continue;
    }
    const memberIds: string[] = [];
    const stack = [seed.id];
    seen.add(seed.id);
    while (stack.length > 0) {
      const current = stack.pop()!;
      memberIds.push(current);
      for (const neighbour of graph.adjacency.get(current) ?? []) {
        if (!seen.has(neighbour)) {
          seen.add(neighbour);
          stack.push(neighbour);
        }
      }
    }

    const members = new Set(memberIds);
    const sub = createGraph();
    for (const id of memberIds.sort(
      (a, b) => graph.nodes.get(a)!.inputOrder - graph.nodes.get(b)!.inputOrder
    )) {
      addNode(sub, { ...graph.nodes.get(id)! });
    }
    for (const edge of graph.edges.values()) {
      if (members.has(edge.source) && members.has(edge.target)) {
        addEdge(sub, {
          ...edge,
          originalEdgeIds: [...edge.originalEdgeIds],
          route: [],
          mandatoryWaypoints: [],
        });
      }
    }

    components.push({
      id: `component:${components.length}`,
      graph: sub,
      firstInputOrder: seed.inputOrder,
    });
  }

  // Stable order by the first node each component contributes.
  return components.sort((a, b) => a.firstInputOrder - b.firstInputOrder);
}

export interface PackableComponent {
  /** Everything that must move rigidly with the component. */
  points: Point[][];
  nodes: { x: number; y: number; width: number; height: number }[];
  translate: (dx: number, dy: number) => void;
}

/**
 * Rigid translation only. Nothing is re-routed or re-optimised across
 * components (guide §9.3).
 */
export function packComponentsLeftToRight(
  components: { bounds: Bounds; translate: (dx: number, dy: number) => void }[],
  gap: number
): Bounds | undefined {
  let cursorX = 0;
  const placed: Bounds[] = [];

  for (const component of components) {
    const dx = cursorX - component.bounds.minX;
    const dy = -component.bounds.minY;
    component.translate(dx, dy);
    const moved: Bounds = {
      minX: component.bounds.minX + dx,
      maxX: component.bounds.maxX + dx,
      minY: component.bounds.minY + dy,
      maxY: component.bounds.maxY + dy,
    };
    placed.push(moved);
    cursorX = moved.maxX + gap;
  }

  return unionBounds(placed);
}
