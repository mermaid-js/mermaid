/**
 * Every tunable in the faithful HOLA pipeline lives here (guide §11.2: "expose
 * tolerances in one HOLA options object rather than scattering constants").
 */

export interface HolaOptions {
  /** Ideal length of one graph edge; all stress distances are multiples of it. */
  baseEdgeLength: number;
  /** Minimum empty space kept between two node rectangles. */
  nodeClearance: number;

  /** Gradient-projection stopping rule: relative stress improvement. */
  stressTolerance: number;
  /** Gradient-projection stopping rule: hard iteration cap. */
  stressMaxIterations: number;

  /** Overlap removal: how many generate/project rounds before giving up. */
  overlapMaxRounds: number;

  /**
   * Opportunistic alignment (guide §18.1) considers a pair aligned-enough when
   * their coordinates differ by less than this fraction of `baseEdgeLength`.
   */
  alignmentToleranceFraction: number;

  /** Neighbour-stress stage iteration cap. */
  neighbourStressMaxIterations: number;

  /** Gap inserted between packed disconnected components (guide §9.3). */
  componentGap: number;

  /** Prefer cardinal tree placements over ordinal ones. */
  favourCardinalPlacement: boolean;
  /** Prefer the external face over internal faces. */
  favourExternalFace: boolean;

  /** Clearance the orthogonal router keeps from node rectangles. */
  routingClearance: number;
  /** A* penalty per bend. */
  routingBendPenalty: number;
  /** A* penalty per crossing of an already routed edge. */
  routingCrossingPenalty: number;
  /** Hard cap on A* expansions per route. */
  routingMaxExpansions: number;
  /**
   * Shortest run the first and last segment of a route may have. Arrowheads are
   * drawn along the terminal segment, so a leg shorter than the marker leaves it
   * pointing in whatever direction the path had before it.
   */
  minTerminalLegLength: number;

  /** Vertical gap between successive tree ranks. */
  treeRankGap: number;
  /** Horizontal gap between sibling subtrees. */
  treeSiblingGap: number;
  /**
   * How far apart the connectors leaving one side of a tree node are spread along
   * that side, when a parent has several children. Capped by the side's length, so
   * a wide fan on a small node simply gets a tighter spread.
   */
  treeFanPortSpacing: number;

  /** Offset of an edge label from the segment it is attached to. */
  edgeLabelOffset: number;

  /**
   * Node configuration enumerates order-valid assignments exhaustively. Above
   * this degree the neighbour set is pre-filtered to the candidates closest to
   * a cardinal direction, and `HOLA_NODE_CONFIG_TRUNCATED` is reported.
   */
  nodeConfigurationExhaustiveDegreeLimit: number;
}

export const DEFAULT_HOLA_OPTIONS: HolaOptions = {
  baseEdgeLength: 110,
  nodeClearance: 24,

  stressTolerance: 1e-4,
  stressMaxIterations: 250,

  overlapMaxRounds: 12,

  alignmentToleranceFraction: 0.2,

  neighbourStressMaxIterations: 120,

  componentGap: 100,

  favourCardinalPlacement: true,
  favourExternalFace: true,

  routingClearance: 12,
  routingBendPenalty: 40,
  routingCrossingPenalty: 200,
  routingMaxExpansions: 40000,
  minTerminalLegLength: 12,

  treeRankGap: 70,
  treeSiblingGap: 40,
  treeFanPortSpacing: 14,

  edgeLabelOffset: 0,

  nodeConfigurationExhaustiveDegreeLimit: 16,
};

export function resolveOptions(overrides?: Partial<HolaOptions>): HolaOptions {
  return { ...DEFAULT_HOLA_OPTIONS, ...overrides };
}

/**
 * `baseEdgeLength` should scale with the drawing: a graph of large nodes needs
 * longer ideal edges or the stress layout packs everything into overlap.
 */
export function deriveBaseEdgeLength(
  sizes: { width: number; height: number }[],
  options: HolaOptions
): number {
  if (sizes.length === 0) {
    return options.baseEdgeLength;
  }
  let maxDimension = 0;
  for (const s of sizes) {
    maxDimension = Math.max(maxDimension, s.width, s.height);
  }
  return Math.max(options.baseEdgeLength, maxDimension + options.nodeClearance);
}
