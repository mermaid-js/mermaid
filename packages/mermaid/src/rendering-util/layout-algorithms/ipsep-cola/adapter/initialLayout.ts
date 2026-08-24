import type { Position } from '../solver/stress.js';
import type { IpsepColaOptions } from '../options.js';
import { X_AXIS, Y_AXIS, type FlowAxis } from './constraints.js';
import type { IpsepColaGraph } from './graph.js';

/**
 * §1 INITIAL_LAYOUT — a deterministic starting point for the majorisation.
 *
 * Stress majorisation is a local method: it descends from wherever it starts,
 * so the initial layout decides which minimum it finds. Reference
 * implementations randomise, which would make every render of the same diagram
 * differ; instead the nodes are laid out by BFS rank along the flow axis and by
 * discovery order across it. That is both reproducible and already close to the
 * shape the flow constraints will insist on, so the solver spends its
 * iterations refining rather than untangling.
 *
 * Disconnected components are stacked one after another across the flow axis so
 * they do not start on top of each other.
 */
export function computeInitialLayout(
  graph: IpsepColaGraph,
  flow: FlowAxis,
  options: IpsepColaOptions
): Position[] {
  const count = graph.variables.length;
  const positions: Position[] = Array.from({ length: count }, () => [0, 0]);

  const crossAxis = flow.axis === Y_AXIS ? X_AXIS : Y_AXIS;
  const spacing = options.idealEdgeLength;

  const rank = new Array<number>(count).fill(-1);
  let crossCursor = 0;

  for (let seed = 0; seed < count; seed++) {
    if (rank[seed] !== -1) {
      continue;
    }

    // BFS over the whole component, recording rank and the order within it.
    const componentByRank: number[][] = [];
    rank[seed] = 0;
    const queue = [seed];
    // `for...of` sees nodes appended below, making this a BFS queue.
    for (const current of queue) {
      (componentByRank[rank[current]] ??= []).push(current);
      for (const neighbor of graph.neighbors[current]) {
        if (rank[neighbor] === -1) {
          rank[neighbor] = rank[current] + 1;
          queue.push(neighbor);
        }
      }
    }

    let widest = 0;
    for (const members of componentByRank) {
      for (const [index, member] of members.entries()) {
        positions[member][flow.axis] = (flow.forward ? rank[member] : -rank[member]) * spacing;
        positions[member][crossAxis] = crossCursor + (index - (members.length - 1) / 2) * spacing;
      }
      widest = Math.max(widest, members.length);
    }

    crossCursor += (widest + 1) * spacing;
  }

  return positions;
}
