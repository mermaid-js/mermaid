/**
 * Configuration constants for the Swimlanes layout algorithm.
 * Centralizes all magic numbers and default values for maintainability.
 */

/** Clear space kept between two arrowheads that land side by side on one face (px) */
const ARROWHEAD_GAP = 4;

/** Stroke width of an edge line (px); the flowchart `.flowchart-link` style default */
const EDGE_STROKE_WIDTH = 2;

/**
 * Edge routing and spacing constants
 */
export const EDGE_ROUTING = {
  /** Spacing between parallel edges in the same corridor (px) */
  EDGE_GAP: 12,

  /** Horizontal offset from lane boundary to corridor center (px) */
  LANE_MARGIN: 20,

  /** Edge of the square the point marker draws an arrowhead in (px); see markers.js */
  ARROWHEAD_SIZE: 8,

  ARROWHEAD_GAP,

  /** Closest two edges may end on one face of a node: an arrowhead and the gap beside it (px) */
  MIN_ARROWHEAD_SPACING: 12,

  EDGE_STROKE_WIDTH,

  /**
   * Distance under which a bend of one route and another route read as one stroke (px): the
   * gap kept between arrowheads plus the stroke width, the least a reader can see between two lines
   */
  ROUTE_TOUCH_TOLERANCE: ARROWHEAD_GAP + EDGE_STROKE_WIDTH,
} as const;

/**
 * Numerical precision constants
 */
export const PRECISION = {
  /** Epsilon for floating-point comparisons */
  EPSILON: 1e-6,
} as const;

/**
 * Layer assignment constants
 */
export const LAYERING = {
  /** Default number of iterations for gravity-based layering */
  GRAVITY_ITERATIONS: 8,

  /** Maximum number of passes for crossing-based rank optimization */
  MAX_CROSSING_OPTIMIZATION_PASSES: 4,

  /** Whether to compact single-input nodes by default */
  DEFAULT_COMPACT_SINGLE_INPUT: true,
} as const;

/**
 * Coordinate assignment constants
 */
export const COORDINATES = {
  /** Default vertical gap between layers (px) */
  DEFAULT_LAYER_GAP: 100,

  /** Default horizontal gap between nodes (px) */
  DEFAULT_NODE_GAP: 40,

  /**
   * Room kept between an edge label and the nodes the edge joins (px). Anchoring
   * keeps a label 12 from an edge's endpoint and buffers it by 3 from other
   * geometry, so a label reserved between two ranks needs 15 to be anchored there;
   * 16 leaves one pixel to spare.
   */
  EDGE_LABEL_CLEARANCE: 16,
} as const;
