import { X_AXIS, Y_AXIS } from '../../ipsep-cola/adapter/constraints.js';
import type { IpsepColaGraph } from '../../ipsep-cola/adapter/graph.js';
import type { Axis } from '../../ipsep-cola/solver/stress.js';
import type { SeparationConstraint } from '../../ipsep-cola/solver/types.js';
import type { GridLikeOptions } from '../options.js';

/**
 * §10 — separated alignments.
 *
 * A direction names where `v` sits relative to `u` **on screen**. Mermaid's y
 * axis grows downward while the paper's grows upward, so `'south'` here is the
 * paper's `SA(u,v,N)` and `'north'` its `SA(u,v,S)`; `'east'` and `'west'`
 * match the paper exactly.
 */
export type AlignmentDirection = 'north' | 'south' | 'east' | 'west';

export const ALIGNMENT_DIRECTIONS: readonly AlignmentDirection[] = [
  'north',
  'south',
  'east',
  'west',
];

/**
 * An alignment equality plus the ordering inequality that stops adjacent
 * aligned edges collapsing on top of one another (§10).
 */
export interface SeparatedAlignment {
  u: number;
  v: number;
  direction: AlignmentDirection;
  /** Axis on which the two centres are made equal. */
  alignmentAxis: Axis;
  /** Axis carrying the ordering inequality. */
  separationAxis: Axis;
  /** Index into `graph.links` — each link may be aligned at most once (§27). */
  linkIndex: number;
  /**
   * `position(u) = position(v)` on {@link alignmentAxis}, as the two opposing
   * zero-gap separation constraints the solver understands.
   */
  equality: [SeparationConstraint, SeparationConstraint];
  /** `α(u,v)` / `β(u,v)` ordering constraint on {@link separationAxis}. */
  separation: SeparationConstraint;
}

/** Whether `direction` aligns the x coordinates (vertical edge) or the y ones. */
export function alignmentAxisOf(direction: AlignmentDirection): Axis {
  return direction === 'north' || direction === 'south' ? X_AXIS : Y_AXIS;
}

export function separationAxisOf(direction: AlignmentDirection): Axis {
  return alignmentAxisOf(direction) === X_AXIS ? Y_AXIS : X_AXIS;
}

/**
 * §10 MAKE_SEPARATED_ALIGNMENT.
 *
 * Deviation: the ordering gap is `α`/`β` **plus** Mermaid's configured spacing.
 * The paper's gap only makes the boxes touch; every other constraint in this
 * pipeline (flow, non-overlap) already reserves `nodeSpacing`/`rankSpacing`, so
 * a bare `α`/`β` here would be the one constraint asking for less than the rest
 * and would never bind.
 */
export function makeSeparatedAlignment(
  graph: IpsepColaGraph,
  linkIndex: number,
  u: number,
  v: number,
  direction: AlignmentDirection,
  options: GridLikeOptions
): SeparatedAlignment {
  const alignmentAxis = alignmentAxisOf(direction);
  const separationAxis = separationAxisOf(direction);

  // `low` sits on the low side of the separation axis: south/east put `v` there.
  const [low, high] = direction === 'south' || direction === 'east' ? [u, v] : [v, u];

  const spacing = separationAxis === X_AXIS ? options.nodeSpacing : options.rankSpacing;
  const gap =
    halfExtent(graph, low, separationAxis) + halfExtent(graph, high, separationAxis) + spacing;

  return {
    u,
    v,
    direction,
    alignmentAxis,
    separationAxis,
    linkIndex,
    equality: [
      { left: u, right: v, gap: 0 },
      { left: v, right: u, gap: 0 },
    ],
    separation: { left: low, right: high, gap },
  };
}

/** The alignment constraints acting on one axis, ready for the projection. */
export function alignmentConstraintsForAxis(
  alignments: readonly SeparatedAlignment[],
  axis: Axis
): SeparationConstraint[] {
  const constraints: SeparationConstraint[] = [];

  for (const alignment of alignments) {
    if (alignment.alignmentAxis === axis) {
      constraints.push(...alignment.equality);
    } else {
      constraints.push(alignment.separation);
    }
  }

  return constraints;
}

/** How far a finished layout leaves the alignment violated, in pixels (§21). */
export function alignmentResidual(
  alignment: SeparatedAlignment,
  positions: readonly (readonly number[])[]
): number {
  const equalityError = Math.abs(
    positions[alignment.u][alignment.alignmentAxis] -
      positions[alignment.v][alignment.alignmentAxis]
  );
  const { left, right, gap } = alignment.separation;
  const separationError =
    positions[left][alignment.separationAxis] + gap - positions[right][alignment.separationAxis];

  return Math.max(equalityError, separationError);
}

function halfExtent(graph: IpsepColaGraph, index: number, axis: Axis): number {
  const variable = graph.variables[index];
  return (axis === X_AXIS ? variable.width : variable.height) / 2;
}
