import { Y_AXIS, type FlowAxis } from '../../ipsep-cola/adapter/constraints.js';
import type { IpsepColaGraph } from '../../ipsep-cola/adapter/graph.js';
import type { Matrix } from '../../ipsep-cola/solver/linalg.js';
import type { Axis, Position } from '../../ipsep-cola/solver/stress.js';
import type { GridLikeOptions } from '../options.js';
import { pStress } from '../snap/penalties.js';
import type { AlignmentFlags } from './alignmentFlags.js';
import { createsCoincidence } from './alignmentFlags.js';
import type { AlignmentDirection, SeparatedAlignment } from './separatedAlignment.js';
import {
  ALIGNMENT_DIRECTIONS,
  alignmentAxisOf,
  makeSeparatedAlignment,
  separationAxisOf,
} from './separatedAlignment.js';

/** Everything `CHOOSE_SA` needs to know about alignments accepted so far. */
export interface AcaState {
  flags: AlignmentFlags;
  /** Links already aligned — each edge is aligned at most once (§27). */
  alignedLinks: Set<number>;
  /** Alignment axis of each aligned link, for the degree-2 test (§14). */
  linkAxis: Map<number, Axis>;
  /**
   * Candidates a projection has already rejected (§22). Re-proposing one would
   * make the outer loop cycle, so a rejected candidate stays out for good.
   */
  blocked: Set<string>;
}

export function candidateKey(linkIndex: number, direction: AlignmentDirection): string {
  return `${linkIndex}|${direction}`;
}

/**
 * §12 CHOOSE_SA — the cheapest separated alignment that creates no coincidence,
 * or `undefined` when none is left and ACA should stop (§27).
 */
export function chooseSeparatedAlignment(
  graph: IpsepColaGraph,
  positions: readonly Position[],
  distances: Matrix,
  flow: FlowAxis,
  state: AcaState,
  options: GridLikeOptions
): SeparatedAlignment | undefined {
  let best: SeparatedAlignment | undefined;
  let bestCost = Number.POSITIVE_INFINITY;

  for (const [linkIndex, link] of graph.links.entries()) {
    if (state.alignedLinks.has(linkIndex)) {
      continue;
    }

    for (const direction of feasibleDirections(link, positions, flow, options)) {
      if (state.blocked.has(candidateKey(linkIndex, direction))) {
        continue;
      }

      const alignmentAxis = alignmentAxisOf(direction);
      const separationAxis = separationAxisOf(direction);

      // Already equal on the axis the alignment would order them by: the two
      // nodes would be forced onto the same point.
      if (state.flags.isAligned(separationAxis, link.source, link.target)) {
        continue;
      }
      // Already equal on the alignment axis: nothing to impose.
      if (state.flags.isAligned(alignmentAxis, link.source, link.target)) {
        continue;
      }

      const [low, high] =
        direction === 'south' || direction === 'east'
          ? [link.source, link.target]
          : [link.target, link.source];

      if (
        createsCoincidence(
          state.flags,
          positions,
          graph.variables.length,
          low,
          high,
          alignmentAxis,
          separationAxis
        )
      ) {
        continue;
      }

      const cost =
        alignmentCost(graph, positions, distances, link, alignmentAxis, options) +
        bendPenalty(graph, state, link, alignmentAxis, options);

      if (cost < bestCost) {
        bestCost = cost;
        best = makeSeparatedAlignment(
          graph,
          linkIndex,
          link.source,
          link.target,
          direction,
          options
        );
      }
    }
  }

  return best;
}

/**
 * The directions worth proposing for one link.
 *
 * With `respectDirection` on, the definite constraint set already fixes an
 * ordering along the flow axis, so an alignment equalising that axis is
 * infeasible by construction and §19 would have it rejected on sight — leaving
 * exactly the flow-consistent direction. That is the useful one anyway: it is
 * what makes a `TB` diagram's edges perfectly vertical.
 *
 * With `respectDirection` off, all four directions are candidates, minus those
 * that contradict the current layout: reversing a pair would fight §13's first
 * principle, preserving the shape of the initial force-directed layout.
 */
function feasibleDirections(
  link: { source: number; target: number },
  positions: readonly Position[],
  flow: FlowAxis,
  options: GridLikeOptions
): AlignmentDirection[] {
  if (options.respectDirection) {
    if (flow.axis === Y_AXIS) {
      return [flow.forward ? 'south' : 'north'];
    }
    return [flow.forward ? 'east' : 'west'];
  }

  return ALIGNMENT_DIRECTIONS.filter((direction) => {
    const separationAxis = separationAxisOf(direction);
    const delta = positions[link.target][separationAxis] - positions[link.source][separationAxis];
    return direction === 'south' || direction === 'east' ? delta >= 0 : delta <= 0;
  });
}

/**
 * §13 `K(u,v,D)` — how much imposing the alignment would cost the drawing.
 *
 * Neither heuristic is given a formula in the paper (§30.4), so both are stated
 * concretely here:
 *
 * - `obliqueness` (§13.2) measures how oblique the edge currently is, as the
 *   perpendicular displacement the alignment forces, in units of the ideal edge
 *   length. An edge that is already almost axis-aligned costs almost nothing,
 *   which is the paper's stated intent: constrain first the edges whose
 *   geometry already reads as axis-aligned.
 * - `stress-change` (§13.1) is the exact P-stress delta of that displacement —
 *   the smallest move that satisfies the equality, both endpoints meeting at
 *   their midpoint on the alignment axis. It costs `O(|V|²)` per candidate
 *   against the other's `O(1)`, which is why it is not the default.
 */
function alignmentCost(
  graph: IpsepColaGraph,
  positions: readonly Position[],
  distances: Matrix,
  link: { source: number; target: number },
  alignmentAxis: Axis,
  options: GridLikeOptions
): number {
  const offset = positions[link.source][alignmentAxis] - positions[link.target][alignmentAxis];

  if (options.heuristic === 'obliqueness') {
    return Math.abs(offset) / Math.max(options.idealEdgeLength, 1);
  }

  const before = pStress(graph, distances, positions, options.idealEdgeLength);

  const moved = positions.map((position): Position => [position[0], position[1]]);
  const midpoint =
    (positions[link.source][alignmentAxis] + positions[link.target][alignmentAxis]) / 2;
  moved[link.source][alignmentAxis] = midpoint;
  moved[link.target][alignmentAxis] = midpoint;

  return pStress(graph, distances, moved, options.idealEdgeLength) - before;
}

/**
 * §14 — a large but finite penalty for turning a degree-2 node into a bend
 * point, which postpones such alignments rather than forbidding them. It is
 * what makes chains of degree-2 nodes come out straight and cycles of them
 * rectangular.
 */
function bendPenalty(
  graph: IpsepColaGraph,
  state: AcaState,
  link: { source: number; target: number },
  alignmentAxis: Axis,
  options: GridLikeOptions
): number {
  for (const node of [link.source, link.target]) {
    if (graph.neighbors[node].length !== 2) {
      continue;
    }
    for (const [otherIndex, other] of graph.links.entries()) {
      if (other.source !== node && other.target !== node) {
        continue;
      }
      const otherAxis = state.linkAxis.get(otherIndex);
      if (otherAxis !== undefined && otherAxis !== alignmentAxis) {
        return options.degreeTwoBendPenalty;
      }
    }
  }

  return 0;
}
