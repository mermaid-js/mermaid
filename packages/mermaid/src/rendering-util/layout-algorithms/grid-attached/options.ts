import type { LayoutData } from '../../types.js';
import type { GridLikeOptions } from '../grid-like/options.js';
import { resolveGridLikeOptions } from '../grid-like/options.js';

/**
 * Tunables for the attached grid-like layout.
 *
 * The core's *layout* is inherited from grid-like and nothing here changes it:
 * every core node stays exactly where grid-like put it, so every ACA alignment
 * and the grid structure survive. Two things about the core are this layout's
 * own — `coreScaleStep`/`maxCoreScale`, which stretch its edges without
 * touching its shape, and the `routing*` fields, which decide how those edges
 * are *drawn*. The rest describe the trees: how each is drawn on its own, and
 * how the placement search around the core is scored.
 */
export interface GridAttachedOptions extends GridLikeOptions {
  /** Clear gap left between two packed connected components. */
  componentGap: number;

  /** Gap between two successive ranks of a tree. */
  treeRankGap: number;
  /** Gap between two sibling subtrees. */
  treeSiblingGap: number;
  /** Clear space kept between a placed tree and anything already drawn. */
  treeClearance: number;
  /**
   * How far apart the connectors leaving one side of a tree node are spread,
   * when a parent has several children. Capped by the side's length, so a wide
   * fan on a small node simply gets a tighter spread.
   */
  treeFanPortSpacing: number;
  /**
   * Clear distance between two levels of a fan's nested comb, and so also between
   * the last level and the rank it arrives at.
   *
   * A rank gap that cannot hold the comb it has to carry is widened to fit, which
   * is the whole reason this is a separate number from `treeRankGap`: a tree with a
   * fan of eight needs more room between its ranks than a chain does, and giving
   * every tree the wide gap would stretch drawings that never needed it. It must
   * stay above the arrowhead's own length, or the last leg of a connector is too
   * short to show which way it points.
   */
  treeBendSpacing: number;

  /** HOLA §17.6, first priority: a cardinal placement beats an ordinal one. */
  favourCardinalPlacement: boolean;
  /** HOLA §17.6, second priority: the external face beats an internal one. */
  favourExternalFace: boolean;

  /** Hard cap on a tree's dead stub: past it a placement counts as relaxed. */
  maxSlide: number;
  /**
   * What one rung of core enlargement costs, against the dead stubs it saves.
   *
   * Both sides of that trade are measured in pixels — a stub by its length, an
   * enlargement by how much wider and taller it makes the core — so a weight of
   * 1 means "a core one pixel bigger is worth one pixel less stub". Raise it to
   * keep drawings tight and live with longer connectors; lower it to spend size
   * on hanging every tree straight off its root.
   */
  enlargementPenaltyWeight: number;
  /**
   * Weight of "how far this tree pushes the drawing's outline out" in the
   * candidate cost, relative to one pixel of dead stub.
   */
  compactnessWeight: number;
  /** Cost of growing a tree against the diagram's declared direction. */
  flowPenalty: number;

  /** One rung of the core-enlargement ladder, as a fraction of the core's size. */
  coreScaleStep: number;
  /** Largest enlargement factor the ladder may reach. */
  maxCoreScale: number;
  /** Rungs without improvement before the ladder gives up and keeps the best. */
  coreScalePatience: number;

  /**
   * Clear space kept around an edge label.
   *
   * Reserved twice over in a tree's rank gap — a label is drawn centred on its
   * connector, so it needs room at both ends or it ends up touching the two ranks
   * it sits between — and used again when a label is placed, to keep it off nodes
   * and off other edges.
   *
   * The default is the shortest run an arrowhead can be drawn along, because that
   * is what the gap between a label and the node it points at has to hold: any less
   * and the label eats the arrow.
   */
  labelClearance: number;
  /**
   * How far a label is kept from a point where two edges cross.
   *
   * A label sitting on a crossing belongs, as far as a reader can tell, to either
   * edge. Moving it along its own route costs nothing else, so the crossing is
   * treated as something to avoid outright rather than as one cost among many.
   */
  labelCrossingClearance: number;

  /** Clearance the core router keeps from node rectangles. */
  routingClearance: number;
  /** A* penalty per bend, so a route with fewer corners wins. */
  routingBendPenalty: number;
  /** A* penalty per crossing of an already routed edge. */
  routingCrossingPenalty: number;
  /** Hard cap on A* expansions per core route. */
  routingMaxExpansions: number;
}

export function resolveGridAttachedOptions(
  data4Layout: LayoutData,
  overrides?: Partial<GridAttachedOptions>
): GridAttachedOptions {
  const base = resolveGridLikeOptions(data4Layout, overrides);

  const treeRankGap = overrides?.treeRankGap ?? base.rankSpacing;
  const treeSiblingGap = overrides?.treeSiblingGap ?? base.nodeSpacing;

  return {
    ...base,
    // The components have to read as separate diagrams, so the gap between two
    // of them must be clearly larger than the spacing *inside* one — which, in a
    // grid-like drawing, is one grid step.
    componentGap: overrides?.componentGap ?? 1.5 * base.gridSpacing,

    treeRankGap,
    treeSiblingGap,
    // A tree must sit at least as far from its neighbours as two core nodes do
    // from each other, or the drawing reads as one blob.
    treeClearance: overrides?.treeClearance ?? base.nodeSpacing,
    treeFanPortSpacing: overrides?.treeFanPortSpacing ?? 14,
    treeBendSpacing: overrides?.treeBendSpacing ?? 16,

    favourCardinalPlacement: overrides?.favourCardinalPlacement ?? true,
    favourExternalFace: overrides?.favourExternalFace ?? true,

    maxSlide: overrides?.maxSlide ?? 4 * base.gridSpacing,
    enlargementPenaltyWeight: overrides?.enlargementPenaltyWeight ?? 1,
    compactnessWeight: overrides?.compactnessWeight ?? 0.25,
    flowPenalty: overrides?.flowPenalty ?? treeRankGap / 2,

    coreScaleStep: overrides?.coreScaleStep ?? 0.25,
    maxCoreScale: overrides?.maxCoreScale ?? 3,
    coreScalePatience: overrides?.coreScalePatience ?? 2,

    labelClearance: overrides?.labelClearance ?? 12,
    labelCrossingClearance: overrides?.labelCrossingClearance ?? 24,

    routingClearance: overrides?.routingClearance ?? 12,
    routingBendPenalty: overrides?.routingBendPenalty ?? 40,
    routingCrossingPenalty: overrides?.routingCrossingPenalty ?? 200,
    routingMaxExpansions: overrides?.routingMaxExpansions ?? 40_000,

    ...overrides,
  };
}
