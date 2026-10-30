import type { LayoutData } from '../../types.js';

/**
 * The documented default of `nodeSpacing` and `rankSpacing` in every diagram that has them.
 *
 * ELK's own gaps are not 50, so the configured values are read against this figure as a ratio:
 * the default leaves ELK's gaps alone, half of it halves them and twice of it doubles them.
 */
export const DEFAULT_SPACING = 50;

/** How much wider (above 1) or tighter (below 1) than ELK's own gaps the diagram asked for. */
export interface SpacingScales {
  /** Gap between two nodes of one layer. */
  node: number;
  /** Gap between two layers. */
  rank: number;
}

/** The scale that leaves ELK's gaps as they are. */
export const UNCHANGED_SPACING: SpacingScales = { node: 1, rank: 1 };

/**
 * The smallest spacing that is read as asked. Below it ELK has no room left to route an edge into
 * a node and draw its arrowhead, and the frames of neighbouring subgraphs overlap.
 */
export const MIN_SPACING = 10;

/**
 * Ratio of a configured spacing to the default, never below that of `MIN_SPACING`. A value that is
 * not a positive number, which every other layout also treats as unset, leaves the gaps alone.
 */
export function spacingScale(configured: unknown): number {
  return typeof configured === 'number' && Number.isFinite(configured) && configured > 0
    ? Math.max(configured, MIN_SPACING) / DEFAULT_SPACING
    : 1;
}

/**
 * Read the spacing the diagram's own renderer put on the layout data.
 *
 * Only that: the flowchart config always has a default, and the ER renderer even writes its own,
 * different defaults into it, so falling back to it would resize diagrams that asked for nothing.
 * A diagram whose renderer does not state a spacing keeps ELK's gaps.
 */
export function resolveSpacingScales(data4Layout: LayoutData): SpacingScales {
  return {
    node: spacingScale(data4Layout.nodeSpacing),
    rank: spacingScale(data4Layout.rankSpacing),
  };
}

/** Whether the diagram asked for gaps other than ELK's own. */
export function changesSpacing(scales: SpacingScales): boolean {
  return scales.node !== 1 || scales.rank !== 1;
}
