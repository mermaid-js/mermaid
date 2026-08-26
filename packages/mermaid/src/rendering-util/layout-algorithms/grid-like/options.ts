import type { LayoutData } from '../../types.js';
import type { IpsepColaOptions } from '../ipsep-cola/options.js';
import { resolveIpsepColaOptions } from '../ipsep-cola/options.js';

/**
 * Which of the paper's phase-2 mechanisms to run (§2).
 *
 * `aca-grid-snap` is the default: it produced the strongest edge-obliqueness
 * result in the paper's own evaluation (§23).
 */
export type GridLikeMode =
  | 'node-snap'
  | 'grid-snap'
  | 'node-and-grid-snap'
  | 'aca'
  | 'aca-grid-snap';

/** Cost function `K(u,v,D)` used by `CHOOSE_SA` (§13). */
export type AcaHeuristic = 'obliqueness' | 'stress-change';

/**
 * Snap radius for the Node-Snap term.
 *
 * `snap-distance` is the batch variant of §5: one common `τ` for every edge.
 * `node-size` is the interactive variant of §24, where the radius is `α(u,v)` /
 * `β(u,v)` — the paper switched to it because a `τ` larger than typical node
 * dimensions made *dragged* nodes clump. A once-off Mermaid layout has no
 * dragging, and a radius smaller than the offsets the layout actually produces
 * leaves the whole term at zero, so the batch variant is the default.
 */
export type NodeSnapRadius = 'node-size' | 'snap-distance';

/**
 * Tunables for the Mermaid adaptation of Kieffer et al.'s grid-like layout.
 *
 * The IPSEP-COLA options are inherited because phase 1 (§26 step 1) and every
 * CFDL call inside ACA (§11) *are* IPSEP-COLA; only the fields below are new.
 */
export interface GridLikeOptions extends IpsepColaOptions {
  mode: GridLikeMode;
  /**
   * Model subgraph containers as frames with their own boundary variables, so
   * containment and sibling separation become constraints the solve honours.
   *
   * Off by default, and the default is the behaviour this layout has always had:
   * every leaf a top-level sibling, no group variables, and frames fitted to
   * whatever the layout produced. Turning it on changes where nodes end up — the
   * members of a container are pulled together and held inside a frame — so it is
   * a caller's decision, not something derived from the diagram.
   */
  modelGroups: boolean;
  /** `σ` — spacing of the virtual grid (§6). */
  gridSpacing: number;
  /** `τ` — snap radius of the quadratic penalty `q_σ` (§4). Defaults to `σ/2` (§6.2). */
  snapDistance: number;
  /** `k_ns` — weight of the Node-Snap term (§5). */
  nodeSnapWeight: number;
  /** `k_gs` — weight of the Grid-Snap term (§6.2). */
  gridSnapWeight: number;
  /** `k_en` — weight of the edge-node separation term (§8). */
  edgeNodeSeparationWeight: number;
  nodeSnapRadius: NodeSnapRadius;
  heuristic: AcaHeuristic;
  /** §14 — added to a candidate that would turn a degree-2 node into a bend point. */
  degreeTwoBendPenalty: number;
  /**
   * Cap on accepted alignments. `Infinity` leaves the paper's own bound of
   * `|E|` (§27) as the only limit.
   */
  maxAlignments: number;
  /**
   * Cap on majorisation iterations for the CFDL call inside one ACA round
   * (§11). Each round starts from the previous round's layout and adds one
   * constraint, so it needs far fewer iterations than a layout from scratch;
   * a full solve runs once after the loop.
   */
  acaIterations: number;
  /** Cap on projected-gradient iterations in the snap phase. */
  snapIterations: number;
  /** Snap phase stops once a full iteration moves every node less than this. */
  snapTolerance: number;
  /**
   * How far a tentative alignment may end up violated before ACA rejects it
   * (§21). In pixels: below half a pixel the alignment is visually exact.
   */
  alignmentTolerance: number;
}

export const DEFAULT_GRID_LIKE_OPTIONS: Omit<GridLikeOptions, keyof IpsepColaOptions> = {
  mode: 'aca-grid-snap',
  modelGroups: false,
  gridSpacing: 120,
  snapDistance: 60,
  nodeSnapWeight: 200,
  gridSnapWeight: 200,
  edgeNodeSeparationWeight: 50,
  nodeSnapRadius: 'snap-distance',
  heuristic: 'obliqueness',
  degreeTwoBendPenalty: 1000,
  maxAlignments: Number.POSITIVE_INFINITY,
  acaIterations: 3,
  snapIterations: 60,
  snapTolerance: 0.05,
  alignmentTolerance: 0.5,
};

/**
 * Merge the diagram's flowchart spacing configuration with any explicit
 * overrides, then derive the grid parameters from the measured nodes.
 *
 * `σ` is derived rather than configured because a fixed grid spacing is only
 * meaningful for a fixed node size. Mermaid nodes are text-sized, so the grid
 * has to be at least as coarse as the largest node plus its spacing — otherwise
 * §6.3's "one node centre per grid point" rule and the non-overlap constraints
 * ask for contradictory things and the projection has to drop one of them.
 *
 * `dL = σ` follows §6.4: the stress model and the grid must agree on what one
 * step of the drawing is worth, or every edge pulls its endpoints off the grid.
 */
export function resolveGridLikeOptions(
  data4Layout: LayoutData,
  overrides?: Partial<GridLikeOptions>
): GridLikeOptions {
  const base = resolveIpsepColaOptions(data4Layout, overrides);
  const gridSpacing = overrides?.gridSpacing ?? deriveGridSpacing(data4Layout, base);
  const mode = overrides?.mode ?? DEFAULT_GRID_LIKE_OPTIONS.mode;

  return {
    ...base,
    ...DEFAULT_GRID_LIKE_OPTIONS,
    gridSpacing,
    // §6.2 pins `τ = σ/2`, but only for Grid-Snap; §5 leaves the Node-Snap
    // radius free. A radius below the offsets the layout actually produces
    // makes `q_σ` zero everywhere and the term inert, so without Grid-Snap the
    // radius is one grid step.
    snapDistance: usesGridSnap(mode) ? gridSpacing / 2 : gridSpacing,
    // §6.4 / §26 step 1: with Grid-Snap in play the ideal edge length is the
    // grid spacing, so one edge spans one grid step.
    idealEdgeLength: usesGridSnap(mode) ? gridSpacing : base.idealEdgeLength,
    ...overrides,
  };
}

export function usesGridSnap(mode: GridLikeMode): boolean {
  return mode === 'grid-snap' || mode === 'node-and-grid-snap' || mode === 'aca-grid-snap';
}

export function usesNodeSnap(mode: GridLikeMode): boolean {
  return mode === 'node-snap' || mode === 'node-and-grid-snap';
}

export function usesAca(mode: GridLikeMode): boolean {
  return mode === 'aca' || mode === 'aca-grid-snap';
}

function deriveGridSpacing(data4Layout: LayoutData, base: IpsepColaOptions): number {
  let widest = 0;
  let tallest = 0;

  for (const node of data4Layout.nodes ?? []) {
    if (node.isGroup) {
      continue;
    }
    widest = Math.max(widest, node.width ?? 0);
    tallest = Math.max(tallest, node.height ?? 0);
  }

  return Math.max(
    base.idealEdgeLength,
    widest + base.nodeSpacing,
    tallest + base.rankSpacing,
    DEFAULT_GRID_LIKE_OPTIONS.gridSpacing
  );
}
