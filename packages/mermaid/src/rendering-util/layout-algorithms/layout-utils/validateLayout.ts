import { LAYOUT_COST } from './layoutCost.js';
import type { LayoutData, Node, Edge as _Edge } from '../../types.js';
import { log } from '../../../logger.js';
import { DEBUG_KEY } from './debug.js';
import {
  rectForNode,
  approxEqual,
  polylineIntersectsRect,
  segmentIntersectsRectInterior,
} from './helpers.js';
import type { Point, Rect } from './types.js';

type PortSide = 'N' | 'E' | 'S' | 'W';
import { EPS, normalizePolyline, distance, segmentsCross } from './geometry.js';
import type { Segment, NormalizedPolyline } from './geometry.js';

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic constants (tune later, but keep fixed + documented)
// ─────────────────────────────────────────────────────────────────────────────

/** Distance threshold for corner connection check */
const EPS_CORNER = 3;
/** Distance threshold for "very close" port departures */
const EPS_PORT = 2;
/** Distance threshold for border hugging detection */
const EPS_BORDER = 2;
/** Minimum overlap length to count as shared subpath */
const L_MIN_SHARED = 8;
/** Minimum perpendicular gap between long parallel edge sections. */
const EPS_PARALLEL_EDGE_GAP = 7;
/** Minimum near-border length to count as border hugging */
const L_MIN_BORDER = 12;
/** Exemption corridor near endpoints for certain checks */
const L_ATTACH = 8;

// ─────────────────────────────────────────────────────────────────────────────
// DDLT unified scoring (0–1000 fixed cap, zero on !ok)
// ─────────────────────────────────────────────────────────────────────────────
//
// Penalty curve is **per-edge** and indexed by polyline points (after
// `normalizePolyline`). Crossings are penalised globally with a lighter
// per-event constant. All tunable in this single block — relative ordering
// is what tests assert; magnitudes can be retuned after observing fixture
// distributions.
//
//   Polyline points    Bends (n−2)    Tier label    Penalty
//   2                  0              straight      0
//   3                  1              good          0
//   4                  2              quite okay    BEND_PENALTY_4
//   5                  3              quite okay    BEND_PENALTY_5
//   6                  4              bad           BEND_PENALTY_6
//   ≥7                 ≥5             really bad    BEND_PENALTY_6 × BEND_GROWTH^(n−6)

/** Penalty for a 4-point edge (one extra bend past the "good" threshold). */
const BEND_PENALTY_4 = 5;
/** Penalty for a 5-point edge. */
const BEND_PENALTY_5 = 12;
/** Penalty for a 6-point edge — last "named" tier before exponential growth. */
const BEND_PENALTY_6 = 30;
/** Multiplicative growth past 6 polyline points: BEND_PENALTY_6 × BEND_GROWTH^(n−6). */
const BEND_GROWTH = 2.5;
/** Penalty per crossing event — kept lighter than even a 4-point edge bend. */
const CROSSING_PENALTY = 3;
/** Maximum (perfect) score returned by `validateLayout`. */
const MAX_SCORE = 1000;

/** Final/first segment shorter than this trips `edge-bend-near-endpoint`. */
const EPS_FINAL_APPROACH = 10;
/** Conservative marker body length used for label-vs-arrowhead clearance. */
const EPS_MARKER_CLEARANCE_LENGTH = 10;
/** Half-width of the marker clearance corridor around the terminal segment. */
const EPS_MARKER_CLEARANCE_HALF_WIDTH = 7;
/** A parallel rail closer than this to an endpoint side is still a near-end bend/band. */
const EPS_ENDPOINT_BAND = 18;
/** Two distinct edges sharing an attach point on a node within this distance trips `edge-shared-attachment-point`. */
const EPS_SHARED_ATTACH = 3;
/**
 * A self-loop (start === end) must escape its own node to be visible: its
 * polyline has to reach at least this far outside the node's border. Below it,
 * the loop has been collapsed onto (or inside) the node boundary and renders as
 * a bare arrowhead with no visible loop — `edge-self-loop-not-rendered` fires.
 * A properly-drawn loop (any style) leaves a real outward stub (~nodeSpacing),
 * so this only catches genuinely degenerate/collapsed self-loops.
 */
const EPS_SELF_LOOP_EXTENT = 4;

/**
 * A non-member leaf node should keep at least this much clear air between itself
 * and a foreign group frame it faces. Below it, `node-too-close-to-group` fires
 * as a GRADED SOFT penalty (the closer, the larger), so it never invalidates a
 * layout — it just rewards spacing the node out.
 */
/**
 * Fallback gap between a node and a foreign group frame, used when the diagram
 * does not configure one. The live value comes from
 * `flowchart.nodeGroupClearance` — see {@link nodeGroupClearanceOf}.
 */
const NODE_GROUP_CLEARANCE_DEFAULT = 30;

/**
 * Minimum clear gap between two leaf nodes that face each other.
 *
 * `node-overlap` only ever fired on actual intersection, so two boxes a pixel
 * apart were reported as fine while reading as one shape. Facing pairs only —
 * `rectFacingGap` returns null for boxes that merely meet diagonally, where a
 * small gap is not a legibility problem.
 */
const NODE_NODE_PADDING = 30;

/**
 * The configured node-to-foreign-group gap for this layout.
 *
 * Read from config rather than hardcoded so the checker and the passes that
 * repair against it cannot drift apart. They already had: the validator wanted
 * 20 while a nudger was aiming at 10, so every node it "fixed" landed at half
 * the required gap and was re-flagged immediately.
 */
export function nodeGroupClearanceOf(layout: LayoutData): number {
  const configured = (layout.config as { flowchart?: { nodeGroupClearance?: number } } | undefined)
    ?.flowchart?.nodeGroupClearance;
  return typeof configured === 'number' && configured >= 0
    ? configured
    : NODE_GROUP_CLEARANCE_DEFAULT;
}
/** Soft penalty per crowded node↔group pair: round((CLEARANCE - gap) * SCALE). */
const NODE_GROUP_CROWD_SCALE = 3;
/** Cap a single crowded pair's soft penalty. */
const NODE_GROUP_CROWD_MAX = 60;

/**
 * The clear gap between two non-overlapping rects that FACE each other (their
 * projections overlap on one axis), or null when they overlap on both axes
 * (containment, handled elsewhere) or only meet diagonally (not facing).
 */
function rectFacingGap(a: Rect, b: Rect): number | null {
  const xOverlap = a.left < b.right && b.left < a.right;
  const yOverlap = a.top < b.bottom && b.top < a.bottom;
  if (xOverlap && yOverlap) {
    return null;
  }
  if (xOverlap) {
    return a.top >= b.bottom ? a.top - b.bottom : b.top - a.bottom;
  }
  if (yOverlap) {
    return a.left >= b.right ? a.left - b.right : b.left - a.right;
  }
  return null;
}

/**
 * Which groups tile the drawing into bands?
 *
 * A lane is a group that runs the full width (or height) of the drawing while
 * its siblings occupy disjoint slices of the other axis. That shape is the
 * diagram's structure, not a placement outcome: a lane is SUPPOSED to be a long
 * stripe, it is sparse because it holds only the steps that belong to one
 * actor, and an edge from the first lane to the third has no way to reach it
 * except through the second.
 *
 * So the frame-shape rules and the foreign-crossing rule have to know about
 * lanes, or they charge a lane diagram for being a lane diagram. Measured on
 * the swimlane corpus before this exemption existed: 44 `group-elongation`, 49
 * `group-dead-space` and 93 `edge-crosses-foreign-group` on `14-messy-layout`
 * alone, and 11,033 points of score across 26 fixtures — none of it describing
 * anything a layout engine could or should fix.
 *
 * Detected from geometry rather than taken from the engine on purpose: if a set
 * of ordinary subgraphs happens to tile the drawing into bands, they read as
 * lanes and penalising their shape is just as wrong.
 */
function detectLaneGroups(groupRects: Map<string, Rect>): Set<string> {
  const lanes = new Set<string>();
  if (groupRects.size < 2) {
    return lanes;
  }
  const entries = [...groupRects.entries()];
  const left = Math.min(...entries.map(([, r]) => r.left));
  const right = Math.max(...entries.map(([, r]) => r.right));
  const top = Math.min(...entries.map(([, r]) => r.top));
  const bottom = Math.max(...entries.map(([, r]) => r.bottom));
  const unionW = Math.max(1, right - left);
  const unionH = Math.max(1, bottom - top);

  for (const axis of ['horizontal', 'vertical'] as const) {
    // Horizontal lanes span the full width and stack vertically.
    const spans = (r: Rect) =>
      axis === 'horizontal'
        ? (r.right - r.left) / unionW >= LANE_SPAN_FRACTION
        : (r.bottom - r.top) / unionH >= LANE_SPAN_FRACTION;
    const slice = (r: Rect): [number, number] =>
      axis === 'horizontal' ? [r.top, r.bottom] : [r.left, r.right];

    const candidates = entries.filter(([, r]) => spans(r));
    if (candidates.length < 2) {
      continue;
    }
    // Their slices must not overlap, or they are nested boxes rather than bands.
    const sorted = candidates
      .map(([id, r]) => ({ id, span: slice(r) }))
      .sort((a, b) => a.span[0] - b.span[0]);
    let disjoint = true;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].span[0] < sorted[i - 1].span[1] - EPS_BORDER) {
        disjoint = false;
        break;
      }
    }
    if (disjoint) {
      for (const c of sorted) {
        lanes.add(c.id);
      }
    }
  }
  return lanes;
}

/** Share of the drawing's extent a group must span on one axis to read as a lane. */
const LANE_SPAN_FRACTION = 0.9;

/**
 * How many separate times does a polyline occupy a rect's interior?
 *
 * Counted as runs of consecutive interior-touching segments rather than as
 * inside/outside transitions of the POINTS, because a segment can cross the
 * whole frame with both of its endpoints outside it — the exact shape a
 * re-entering route takes — and a point-based count misses that entirely.
 *
 * Uses the shared `segmentIntersectsRectInterior`, which counts a segment
 * running exactly along the border as inside. That is the right call here: an
 * edge tracing a group's frame is inside that group's space as far as the
 * reader is concerned.
 */
function countInteriorRuns(points: Point[], rect: Rect): number {
  let runs = 0;
  let inRun = false;
  for (let i = 0; i < points.length - 1; i++) {
    const inside = segmentIntersectsRectInterior(points[i], points[i + 1], rect);
    if (inside && !inRun) {
      runs++;
    }
    inRun = inside;
  }
  return runs;
}

/**
 * Shapes whose outline IS their bounding box.
 *
 * Several checks reason about nodes as rectangles, which is exact for these and
 * an over-approximation for everything else. A diamond, stadium or hexagon has
 * an outline strictly inside its box, so an edge that correctly attaches to that
 * outline has an endpoint inside the box and a terminal segment that crosses it
 * — both legitimate, and both indistinguishable from a real defect if the node
 * is treated as a plain rectangle.
 *
 * Listed positively, so a shape nobody has classified is assumed non-rect and
 * merely loses some detection on its own endpoints, rather than being reported
 * as broken for attaching correctly.
 */
const RECT_LIKE_SHAPES = new Set([
  'rect',
  'squareRect',
  'roundedRect',
  'labelRect',
  'classBox',
  'requirementBox',
  'kanbanItem',
  'note',
  'rect_left_inv_arrow',
  'text',
]);

function isRectLikeShape(node: Node | undefined): boolean {
  if (!node) {
    return true;
  }
  const shape = (node as { shape?: string }).shape;
  return shape == null || RECT_LIKE_SHAPES.has(String(shape));
}

/** Shapes whose outline is a diamond, where the vertices are the natural ports. */
const DECISION_SHAPES = new Set(['diam', 'diamond', 'decision', 'question']);

function isDecisionShape(node: Node): boolean {
  const shape = (node as { shape?: string }).shape;
  return shape != null && DECISION_SHAPES.has(String(shape));
}

/**
 * Distance from a port to the nearest diamond vertex. The vertices sit at the
 * midpoints of the bounding rect's sides, which is where the outline actually
 * touches it.
 */
function decisionVertexOffset(port: Point, rect: Rect): number | null {
  const cx = (rect.left + rect.right) / 2;
  const cy = (rect.top + rect.bottom) / 2;
  const vertices: Point[] = [
    { x: cx, y: rect.top },
    { x: rect.right, y: cy },
    { x: cx, y: rect.bottom },
    { x: rect.left, y: cy },
  ];
  let best: number | null = null;
  for (const v of vertices) {
    const d = Math.hypot(port.x - v.x, port.y - v.y);
    if (best == null || d < best) {
      best = d;
    }
  }
  return best;
}

/**
 * How far along its side does a port sit, expressed as the distance to the
 * NEARER corner over the side length — so 0.5 is the centre of the side and 0
 * is the corner itself. Returns null when the point is not on a side, which
 * happens for endpoints the router placed inside the node.
 */
function portSideFraction(port: Point, rect: Rect): number | null {
  const w = rect.right - rect.left;
  const h = rect.bottom - rect.top;
  if (w <= 0 || h <= 0) {
    return null;
  }
  const onLeft = Math.abs(port.x - rect.left) <= EPS_BORDER;
  const onRight = Math.abs(port.x - rect.right) <= EPS_BORDER;
  const onTop = Math.abs(port.y - rect.top) <= EPS_BORDER;
  const onBottom = Math.abs(port.y - rect.bottom) <= EPS_BORDER;

  if (
    (onLeft || onRight) &&
    port.y >= rect.top - EPS_BORDER &&
    port.y <= rect.bottom + EPS_BORDER
  ) {
    return Math.min(port.y - rect.top, rect.bottom - port.y) / h;
  }
  if (
    (onTop || onBottom) &&
    port.x >= rect.left - EPS_BORDER &&
    port.x <= rect.right + EPS_BORDER
  ) {
    return Math.min(port.x - rect.left, rect.right - port.x) / w;
  }
  return null;
}

/**
 * A port closer to a corner than this fraction of the side reads as an
 * accident rather than a choice. Waived for bendless routes: a straight line is
 * worth more than a tidy attachment point.
 */
const PORT_CORNER_FRACTION = 0.15;
/** How near a diamond's vertex a port has to land to count as attached to it. */
const DECISION_VERTEX_TOLERANCE = 8;
/**
 * Share of a group frame its members should cover. HOLA measures compactness
 * the same way — nodes' area over total area — and finds it tracks preference.
 * Half is deliberately undemanding: a frame also holds its title, its padding
 * and the channels its own edges route through, so a "full" group is nowhere
 * near 100%.
 */
const GROUP_FILL_TARGET = 0.5;
/** Penalty per unit of missing fill: a frame at 25% costs (0.5-0.25)*200 = 50. */
const GROUP_FILL_WEIGHT = 200;
/** Aspect ratio past which a frame reads as a stripe rather than a box. */
const GROUP_ASPECT_LIMIT = 3;
/** Penalty per unit of aspect ratio past the limit. */
const GROUP_ASPECT_WEIGHT = 10;
/**
 * Two connected nodes whose centres are within this of sharing a row or column,
 * without sharing it, read as a failed alignment. Beyond it they read as simply
 * being in different places, which is fine.
 */
const GRID_NEAR_MISS = 10;

/** Per-edge bend penalty as a function of polyline POINT count (post-normalize). */
function bendPenaltyForPoints(n: number): number {
  if (n <= 3) {
    return 0;
  }
  if (n === 4) {
    return BEND_PENALTY_4;
  }
  if (n === 5) {
    return BEND_PENALTY_5;
  }
  if (n === 6) {
    return BEND_PENALTY_6;
  }
  return BEND_PENALTY_6 * Math.pow(BEND_GROWTH, n - 6);
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type LayoutIssueType =
  | 'node-overlap'
  | 'edge-missing-points'
  | 'edge-non-orthogonal'
  | 'edge-intersects-node'
  | 'edge-intersects-obstacle'
  | 'edge-intersects-group-title'
  | 'node-overlaps-group-title'
  | 'node-overlaps-foreign-group'
  | 'edge-port-direction-mismatch'
  | 'edge-same-port-departure'
  | 'edge-shared-attachment-point'
  /** Two edges deliberately share a handle on a node: same role, same direction. */
  | 'edge-bundled-attachment-point'
  /** Two edges that meet at a node run together for a stretch, travelling the same way. */
  | 'edge-bundled-subpath'
  /** An edge passes exactly where another edge attaches to a node it has nothing to do with. */
  | 'edge-passes-node-attachment'
  | 'edge-shared-projected-port'
  | 'edge-bend-near-endpoint'
  | 'edge-corner-connection'
  | 'edge-endpoint-detached-from-node'
  | 'edge-self-loop-not-rendered'
  | 'edge-zero-length-segment'
  | 'edge-shared-subpath'
  | 'edge-self-shared-subpath'
  | 'edge-bend-overlaps-arrowhead'
  | 'edge-parallel-segment-too-close'
  | 'edge-border-hugging'
  | 'node-border-hugging'
  | 'node-too-close-to-group'
  | 'edge-label-off-edge'
  | 'edge-endpoint-inside-node'
  | 'edge-label-overlaps-foreign-edge'
  | 'edge-label-overlaps-own-arrowhead'
  | 'edge-label-overlaps-group-border'
  | 'edge-label-overlaps-node'
  // ── Added 2026-08-26. Hard: geometric defects that make a drawing wrong. ──
  /** Edge leaves a group it has an endpoint in, then re-enters it. */
  | 'edge-reenters-own-group'
  /** The whole visible edge is consumed by its own arrowhead marker. */
  | 'edge-invisible-under-marker'
  /** Two leaf nodes closer than the minimum node-to-node padding. */
  | 'node-node-padding'
  // ── Added 2026-08-26. Soft: placement and port-choice quality. ──
  /** Edge routes through a group it has no endpoint in. */
  | 'edge-crosses-foreign-group'
  /** Port on a rectangular node sits near a corner without earning it. */
  | 'port-near-corner'
  /** Port on a diamond sits mid-face when a vertex was available. */
  | 'port-off-diamond-corner'
  /** Group frame is mostly empty. */
  | 'group-dead-space'
  /** Group frame is stretched far beyond its content on one axis. */
  | 'group-elongation'
  /** Node nearly aligns with a connected neighbour, but not quite. */
  | 'grid-misalignment';

export interface Issue {
  type: LayoutIssueType;
  message: string;
  nodeIds?: string[];
  edgeId?: string;
  details?: Record<string, unknown>;
}

/**
 * An algorithm-specific addition to layout validation.
 *
 * `validateLayout` itself stays algorithm-agnostic: every layout engine shares
 * the same core checks and the same 0–1000 scale, so a change made for one
 * engine cannot silently move another's scores. Anything that only makes sense
 * for a particular engine belongs in an extension, wired up at that engine's
 * own entry point (see `domus/validateLayoutProxy.ts`).
 *
 * Both hooks receive the finished core result, so an extension can react to
 * what the core already found rather than recomputing geometry.
 */
export interface LayoutValidationExtension {
  /** Stable identifier; keys this extension's entry in `breakdown.extensions`. */
  readonly id: string;
  /**
   * Extra HARD constraints. Any issue returned here is appended to `issues` and
   * makes the layout invalid, which zeroes the score — same rule as the core.
   */
  check?(layout: LayoutData, core: Readonly<ValidateLayoutResult>): Issue[];
  /**
   * Set when `check` can only ever report issues about nodes, never about an
   * edge. A focused run (see `focusEdgeIds`) skips such checks: their issues are
   * invariant under a change to an edge's geometry, so the caller carries them
   * over from its baseline instead of recomputing them per candidate.
   */
  readonly nodeOnly?: boolean;
  /**
   * Extra GRADED penalty, subtracted from the core score and clamped at 0.
   * Never invalidates a layout. `detail` is echoed into
   * `breakdown.extensions[id]` for debugging and for sweep reporting.
   */
  penalise?(
    layout: LayoutData,
    core: Readonly<ValidateLayoutResult>
  ): { points: number; detail?: Record<string, unknown> };
}

export interface ValidateLayoutOptions {
  /** Applied in order, after the core checks. Omitted = core behaviour exactly. */
  readonly extensions?: readonly LayoutValidationExtension[];
  /**
   * Opt-in fast reject. When set, validation may stop as soon as it has found
   * this many issues and return early with `aborted: true`, `ok: false` and a
   * zeroed `breakdown`.
   *
   * For callers that only need to know whether a candidate layout has FEWER
   * issues than a baseline. Once the count reaches the baseline the answer is
   * already "no", and the remaining work — the pairwise shared-subpath and
   * crossing scans, which are quadratic in edges — cannot change it, because
   * the issue list only ever grows.
   *
   * Omitting this leaves behaviour bit-identical: no abort point can fire, and
   * an aborted result is never a scoring result. `remediateFlaggedEdgesWhenMonotone`
   * spends 35s of `domus/architecture`'s 64s validating 7,374 candidate routes to
   * accept 18 of them; every one of the other 7,356 is a fast reject.
   */
  readonly abortAboveIssueCount?: number;

  /**
   * Build the human-readable `Issue.message` for every issue found. Default true.
   *
   * The messages exist to diagnose a layout, and nothing that consumes a result
   * programmatically reads them — issue identity, the repair passes and the score
   * all work off `type`, `edgeId`, `nodeIds` and `details`. They are not free,
   * though: a single `domus/er-db-model` layout raises ~306k issues across its
   * score-gated passes, and formatting a template literal with `toFixed` calls
   * for each one costs real time on the render path.
   *
   * Set false via {@link checkLayout} to skip that formatting. Every other
   * field, the issue list, and the score are bit-identical either way — this
   * changes what a result can TELL you, never what it says about the layout.
   */
  readonly diagnostics?: boolean;

  /**
   * Validate only what the given edges can affect.
   *
   * Every check here is a pure function of geometry, so when a single edge's
   * polyline (and its label anchor) is the only thing that changed, no issue that
   * does not involve that edge can have changed either. A caller that wants to
   * know whether a rerouted edge is an improvement therefore does not need the
   * whole layout re-validated: it needs this edge's issues before and after.
   *
   * With this set, the validator reports exactly the issues in which one of these
   * edges participates, and skips outright the work that cannot produce one —
   * node overlap, node/group hugging and crowding, other edges' own checks, and
   * every pair where neither side is in the set. `remediateFlaggedEdgesWhenMonotone`
   * tries thousands of candidate routes per render, and a full validation per
   * candidate was 33% of DOMUS layout time.
   *
   * The result is a partial view: `score` and `breakdown` are NOT computed (the
   * crossing pass that feeds them is skipped) and are returned zeroed with
   * `focused: true`. Never compare a focused result's score against anything.
   */
  readonly focusEdgeIds?: ReadonlySet<string>;
}

export interface ValidateLayoutResult {
  ok: boolean;
  issues: Issue[];
  /**
   * Set only when `focusEdgeIds` restricted the run. `score`/`breakdown` are
   * zeroed placeholders on such a result; only `issues` is meaningful.
   */
  readonly focused?: boolean;

  /**
   * Set only when `abortAboveIssueCount` cut the run short. Such a result is a
   * "this has at least N issues" answer, NOT a scored verdict: `score` is 0 and
   * `breakdown` is zeroed. Never store one as a baseline.
   */
  aborted?: boolean;
  /**
   * DDLT headline score in [0, 1000]. **Zero** when `!ok`. When `ok`, starts
   * at 1000 and is reduced by `totalBendPenalty` (per-edge by polyline point
   * count, exponential past 6) plus `crossingPenalty`. Clamped to [0, 1000].
   */
  score: number;
  breakdown: {
    /** Number of leaf nodes (excluding groups). */
    nodeCount: number;
    /** Number of valid edges (with at least 2 points). */
    edgeCount: number;
    /** Crossing events counted globally. */
    crossings: number;
    /**
     * Local crossing number: the most crossings any single edge participates
     * in. REPORTED ONLY — no penalty is charged for it. Formally independent
     * of `crossings`: a drawing can have a low total with one badly-crossed
     * edge, or a high total spread thinly.
     */
    maxCrossingsOnAnyEdge: number;
    /**
     * How many edges participate in 0, 1, 2, 3 and 4+ crossings. REPORTED ONLY.
     */
    crossingsHistogram: Record<'0' | '1' | '2' | '3' | '4+', number>;
    /** Total points across all edges (for sanity / debugging). */
    totalPoints: number;
    /** Sum of per-edge bend penalties. */
    totalBendPenalty: number;
    /** Crossings * CROSSING_PENALTY. */
    crossingPenalty: number;
    /**
     * Per-edge breakdown sorted DESC by `bendPenalty` (worst offenders first).
     * `crossings` is how many crossing events this edge participates in and is
     * REPORTED ONLY — it carries no penalty.
     */
    edges: { id: string; points: number; bendPenalty: number; crossings: number }[];
    /** Histogram of polyline point counts: keys '2','3','4','5','6','7+'. */
    pointsHistogram: Record<'2' | '3' | '4' | '5' | '6' | '7+', number>;
    /**
     * Per-extension detail, keyed by extension id. Absent when no extension
     * ran, so core-only callers see the same shape they always did.
     */
    extensions?: Record<string, { points: number; detail?: Record<string, unknown> }>;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Node classification helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Check if a node is a label dummy node (edge label placeholder) */
function isLabelDummy(node: Node): boolean {
  // Check isEdgeLabel field (from types.ts)
  if (node.isEdgeLabel === true) {
    return true;
  }
  // Check isDummy field
  if ((node as { isDummy?: boolean }).isDummy === true) {
    return true;
  }
  // Check if id starts with edge-label- (common pattern)
  if (typeof node.id === 'string' && node.id.startsWith('edge-label-')) {
    return true;
  }
  return false;
}

/** Check if a node should be treated as an obstacle */
function isObstacle(node: Node): boolean {
  // Leaf nodes (not groups) are obstacles
  if (!node.isGroup) {
    return true;
  }
  // Label dummy nodes are obstacles
  if (isLabelDummy(node)) {
    return true;
  }
  return false;
}

function isSwimlaneGroup(node: Node | undefined): boolean {
  return Boolean(node?.isGroup && (node as { shape?: string }).shape === 'swimlane');
}

/** Direction from point a to point b */
function direction(a: Point, b: Point): 'E' | 'W' | 'N' | 'S' | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) <= EPS && Math.abs(dy) <= EPS) {
    return null;
  }
  if (Math.abs(dy) <= EPS) {
    return dx > 0 ? 'E' : 'W';
  }
  if (Math.abs(dx) <= EPS) {
    return dy > 0 ? 'S' : 'N';
  }
  return null;
}

/** Euclidean distance a point sits OUTSIDE a rect (0 when on the border or inside). */
function distanceOutsideRect(p: Point, r: Rect): number {
  const dx = Math.max(r.left - p.x, 0, p.x - r.right);
  const dy = Math.max(r.top - p.y, 0, p.y - r.bottom);
  return Math.hypot(dx, dy);
}

/** Compute distance from a point to rectangle corners, return min distance */
function minDistanceToCorners(p: Point, r: Rect): number {
  const corners = [
    { x: r.left, y: r.top },
    { x: r.right, y: r.top },
    { x: r.left, y: r.bottom },
    { x: r.right, y: r.bottom },
  ];
  return Math.min(...corners.map((c) => distance(p, c)));
}

/** Compute overlap length of two 1D ranges */
function rangeOverlap(a1: number, a2: number, b1: number, b2: number): number {
  const lo = Math.max(Math.min(a1, a2), Math.min(b1, b2));
  const hi = Math.min(Math.max(a1, a2), Math.max(b1, b2));
  return Math.max(0, hi - lo);
}

/** Check if two segments are collinear and compute their overlap length */
function collinearOverlap(s1: Segment, s2: Segment): number {
  if (s1.orientation !== s2.orientation || s1.orientation === 'Z') {
    return 0;
  }
  if (s1.orientation === 'H') {
    // Both horizontal: check if same y (within EPS)
    if (Math.abs(s1.a.y - s2.a.y) > EPS) {
      return 0;
    }
    return rangeOverlap(s1.a.x, s1.b.x, s2.a.x, s2.b.x);
  } else {
    // Both vertical: check if same x (within EPS)
    if (Math.abs(s1.a.x - s2.a.x) > EPS) {
      return 0;
    }
    return rangeOverlap(s1.a.y, s1.b.y, s2.a.y, s2.b.y);
  }
}

/** Projected overlap for same-orientation parallel segments, regardless of gap. */
function parallelProjectedOverlap(s1: Segment, s2: Segment): number {
  if (s1.orientation !== s2.orientation || s1.orientation === 'Z') {
    return 0;
  }
  return s1.orientation === 'H'
    ? rangeOverlap(s1.a.x, s1.b.x, s2.a.x, s2.b.x)
    : rangeOverlap(s1.a.y, s1.b.y, s2.a.y, s2.b.y);
}

/** Perpendicular distance between same-orientation parallel segments. */
function parallelSegmentGap(s1: Segment, s2: Segment): number | null {
  if (s1.orientation !== s2.orientation || s1.orientation === 'Z') {
    return null;
  }
  return s1.orientation === 'H' ? Math.abs(s1.a.y - s2.a.y) : Math.abs(s1.a.x - s2.a.x);
}

/** Check if a segment runs near a rect border for a significant length */
function segmentBorderHugLength(seg: Segment, r: Rect): number {
  if (seg.orientation === 'Z') {
    return 0;
  }

  let maxHugLen = 0;

  if (seg.orientation === 'H') {
    // Horizontal segment - check proximity to top/bottom borders
    const y = seg.a.y;
    const x1 = Math.min(seg.a.x, seg.b.x);
    const x2 = Math.max(seg.a.x, seg.b.x);

    // Check top border
    if (Math.abs(y - r.top) <= EPS_BORDER) {
      const overlap = rangeOverlap(x1, x2, r.left, r.right);
      maxHugLen = Math.max(maxHugLen, overlap);
    }
    // Check bottom border
    if (Math.abs(y - r.bottom) <= EPS_BORDER) {
      const overlap = rangeOverlap(x1, x2, r.left, r.right);
      maxHugLen = Math.max(maxHugLen, overlap);
    }
  } else {
    // Vertical segment - check proximity to left/right borders
    const x = seg.a.x;
    const y1 = Math.min(seg.a.y, seg.b.y);
    const y2 = Math.max(seg.a.y, seg.b.y);

    // Check left border
    if (Math.abs(x - r.left) <= EPS_BORDER) {
      const overlap = rangeOverlap(y1, y2, r.top, r.bottom);
      maxHugLen = Math.max(maxHugLen, overlap);
    }
    // Check right border
    if (Math.abs(x - r.right) <= EPS_BORDER) {
      const overlap = rangeOverlap(y1, y2, r.top, r.bottom);
      maxHugLen = Math.max(maxHugLen, overlap);
    }
  }

  return maxHugLen;
}

/** Segment length */
function _segmentLength(seg: Segment): number {
  return distance(seg.a, seg.b);
}

/** Check if a point is within L_ATTACH of a given reference point */
function withinAttachCorridor(p: Point, ref: Point): boolean {
  return distance(p, ref) <= L_ATTACH;
}

function segmentWithinSameAttachCorridor(a: Point, b: Point, start: Point, end: Point): boolean {
  return (
    (withinAttachCorridor(a, start) && withinAttachCorridor(b, start)) ||
    (withinAttachCorridor(a, end) && withinAttachCorridor(b, end))
  );
}

function pointWithinEitherAttachCorridor(p: Point, start: Point, end: Point): boolean {
  return withinAttachCorridor(p, start) || withinAttachCorridor(p, end);
}

function segmentEndpointsWithinAttachCorridors(seg: Segment, start: Point, end: Point): boolean {
  return (
    pointWithinEitherAttachCorridor(seg.a, start, end) &&
    pointWithinEitherAttachCorridor(seg.b, start, end)
  );
}

interface SegmentHit {
  segmentIndex: number;
  a: Point;
  b: Point;
}

function firstInteriorRectHit(
  points: Point[],
  rect: Rect,
  startAttach: Point,
  endAttach: Point,
  skip?: (a: Point, b: Point) => boolean
): SegmentHit | undefined {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (segmentWithinSameAttachCorridor(a, b, startAttach, endAttach) || skip?.(a, b)) {
      continue;
    }
    if (segmentIntersectsRectInterior(a, b, rect)) {
      return { segmentIndex: i, a, b };
    }
  }
  return undefined;
}

/**
 * Whether two edges meet at a common node.
 *
 * A shared run only reads as a bundle when the edges have somewhere to split
 * from or converge to. Two unrelated edges that happen to occupy the same lane
 * are ambiguous no matter which way they travel.
 */
/** Shortest distance from a point to any segment of a polyline. */
function distanceToPolyline(points: Point[], probe: Point): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;
    const t =
      lengthSquared === 0
        ? 0
        : Math.max(0, Math.min(1, ((probe.x - a.x) * dx + (probe.y - a.y) * dy) / lengthSquared));
    best = Math.min(best, Math.hypot(probe.x - (a.x + t * dx), probe.y - (a.y + t * dy)));
  }
  return best;
}

function edgesShareEndpointNode(
  e1: { startId: string; endId: string },
  e2: { startId: string; endId: string }
): boolean {
  const ids = [e1.startId, e1.endId].filter(Boolean);
  return ids.some((id) => id === e2.startId || id === e2.endId);
}

/**
 * Whether two collinear segments are travelled the same way.
 *
 * `normalizePolyline` rebuilds its segments in polyline order, so `a -> b` is
 * still the direction of travel and its sign on the varying axis is the answer.
 */
function sameTravelDirection(s1: Segment, s2: Segment): boolean {
  const d1x = Math.sign(s1.b.x - s1.a.x);
  const d2x = Math.sign(s2.b.x - s2.a.x);
  const d1y = Math.sign(s1.b.y - s1.a.y);
  const d2y = Math.sign(s2.b.y - s2.a.y);
  if (d1x !== 0 || d2x !== 0) {
    return d1x === d2x;
  }
  return d1y === d2y;
}

function isAncestorGroup(ancestorId: string, node: Node, byId: Map<string, Node>): boolean {
  const seen = new Set<string>();
  let cur: Node | undefined = node;
  while (cur?.parentId != null) {
    const pid = String(cur.parentId);
    if (seen.has(pid)) {
      return false;
    }
    if (pid === ancestorId) {
      return true;
    }
    seen.add(pid);
    cur = byId.get(pid);
  }
  return false;
}

function rectsOverlap(a: Rect, b: Rect): { overlapX: number; overlapY: number } | null {
  const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  if (overlapX <= 0 || overlapY <= 0) {
    return null;
  }
  return { overlapX, overlapY };
}

function groupTitleRectForNode(node: Node): Rect | null {
  const raw = node.groupTitleRect;
  if (!raw) {
    return null;
  }
  const { left, right, top, bottom } = raw;
  if (
    !Number.isFinite(left) ||
    !Number.isFinite(right) ||
    !Number.isFinite(top) ||
    !Number.isFinite(bottom) ||
    right <= left ||
    bottom <= top
  ) {
    return null;
  }
  return {
    cx: (left + right) / 2,
    cy: (top + bottom) / 2,
    left,
    right,
    top,
    bottom,
  };
}

/**
 * Reconstruct an edge label's rectangle from the POST-FINALIZE overlay
 * representation. `finalizeDummyLabelNodesToOverlayLabels` consumes the
 * `edge-label-*` dummy nodes and re-attaches the label to its owning edge as
 * `edge.label` + center `edge.x`/`edge.y` + measured `edge.width`/`edge.height`
 * (finalizeOverlayLabels.ts). After the single-source-of-truth anchor pass
 * (#18) `edge.x`/`edge.y` is the exact painted position, so this rect is
 * what the browser actually renders.
 */
function labelRectForEdge(e: unknown): Rect | null {
  const ed = e as { label?: unknown; x?: unknown; y?: unknown; width?: unknown; height?: unknown };
  if (typeof ed.label !== 'string' || ed.label.length === 0) {
    return null;
  }
  const { x, y, width: w, height: h } = ed;
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof w !== 'number' ||
    typeof h !== 'number' ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !(w > 0) ||
    !(h > 0)
  ) {
    return null;
  }
  return { cx: x, cy: y, left: x - w / 2, right: x + w / 2, top: y - h / 2, bottom: y + h / 2 };
}

type EdgeTerminal = 'start' | 'end';

function hasTerminalMarker(e: _Edge, terminal: EdgeTerminal): boolean {
  const markerType = terminal === 'start' ? e.arrowTypeStart : e.arrowTypeEnd;
  if (typeof markerType === 'string') {
    const trimmed = markerType.trim();
    if (trimmed.length > 0 && trimmed !== 'none' && trimmed !== 'arrow_open') {
      return true;
    }
  }

  if (typeof e.type !== 'string') {
    return false;
  }
  // Flowchart/swimlane edges often carry marker semantics in `type`.
  if (terminal === 'start' && e.type.startsWith('double_')) {
    return true;
  }
  return terminal === 'end' && /arrow_(point|cross|circle|barb)|double_arrow/.test(e.type);
}

function terminalMarkerClearanceRect(points: Point[], terminal: EdgeTerminal): Rect | null {
  if (points.length < 2) {
    return null;
  }

  const tip = terminal === 'end' ? points[points.length - 1] : points[0];
  const inner = terminal === 'end' ? points[points.length - 2] : points[1];
  const dx = inner.x - tip.x;
  const dy = inner.y - tip.y;

  if (Math.abs(dx) <= EPS && Math.abs(dy) <= EPS) {
    return null;
  }

  const len = EPS_MARKER_CLEARANCE_LENGTH;
  const half = EPS_MARKER_CLEARANCE_HALF_WIDTH;
  if (Math.abs(dy) <= EPS) {
    const x2 = tip.x + Math.sign(dx) * len;
    const left = Math.min(tip.x, x2);
    const right = Math.max(tip.x, x2);
    return {
      cx: (left + right) / 2,
      cy: tip.y,
      left,
      right,
      top: tip.y - half,
      bottom: tip.y + half,
    };
  }
  if (Math.abs(dx) <= EPS) {
    const y2 = tip.y + Math.sign(dy) * len;
    const top = Math.min(tip.y, y2);
    const bottom = Math.max(tip.y, y2);
    return {
      cx: tip.x,
      cy: (top + bottom) / 2,
      left: tip.x - half,
      right: tip.x + half,
      top,
      bottom,
    };
  }

  return null;
}

function _polylineIsOrthogonal(points: Point[]): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (!approxEqual(a.x, b.x) && !approxEqual(a.y, b.y)) {
      return false;
    }
  }
  return true;
}

function firstNonOrthogonalSegment(points: Point[]): { i: number; a: Point; b: Point } | null {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (!approxEqual(a.x, b.x) && !approxEqual(a.y, b.y)) {
      return { i, a, b };
    }
  }
  return null;
}

function sideFromBoundaryPoint(p: Point, r: Rect): PortSide | null {
  if (approxEqual(p.x, r.left)) {
    return 'W';
  }
  if (approxEqual(p.x, r.right)) {
    return 'E';
  }
  if (approxEqual(p.y, r.top)) {
    return 'N';
  }
  if (approxEqual(p.y, r.bottom)) {
    return 'S';
  }
  return null;
}

function segmentDir(a: Point, b: Point): 'E' | 'W' | 'N' | 'S' | null {
  if (approxEqual(a.x, b.x) && !approxEqual(a.y, b.y)) {
    return b.y > a.y ? 'S' : 'N';
  }
  if (approxEqual(a.y, b.y) && !approxEqual(a.x, b.x)) {
    return b.x > a.x ? 'E' : 'W';
  }
  return null;
}

function nearEndpointBandDistance(seg: Segment, side: PortSide, rect: Rect): number | null {
  if (side === 'W' || side === 'E') {
    if (seg.orientation !== 'V') {
      return null;
    }
    const x = seg.a.x;
    const distanceToSide = side === 'W' ? rect.left - x : x - rect.right;
    if (distanceToSide < -EPS || distanceToSide > EPS_ENDPOINT_BAND + EPS) {
      return null;
    }
    const overlap = rangeOverlap(seg.a.y, seg.b.y, rect.top, rect.bottom);
    return overlap > EPS ? Math.max(0, distanceToSide) : null;
  }

  if (seg.orientation !== 'H') {
    return null;
  }
  const y = seg.a.y;
  const distanceToSide = side === 'N' ? rect.top - y : y - rect.bottom;
  if (distanceToSide < -EPS || distanceToSide > EPS_ENDPOINT_BAND + EPS) {
    return null;
  }
  const overlap = rangeOverlap(seg.a.x, seg.b.x, rect.left, rect.right);
  return overlap > EPS ? Math.max(0, distanceToSide) : null;
}

/**
 * Step 0: Validate a computed orthogonal layout for basic geometric invariants.
 *
 * Checks:
 * - No box overlaps (excluding ancestor containment for groups).
 * - Edge polylines are orthogonal.
 * - Edge segments do not intersect node/obstacle interiors.
 * - Segment leaving/entering a *boundary* port goes outward from that side.
 * - Edges don't depart from same port with same direction.
 * - Edges don't connect at node corners.
 * - Edges don't share subpaths.
 * - Edges don't hug node borders.
 *
 * Also computes scoring based on bends and crossings.
 */
// Soft issues are real defects that DON'T invalidate the layout but cost a
// fixed score penalty (a "warning"). Everything not listed here is HARD: a
// single occurrence sets ok=false and the score to 0. Keep this map small and
// explicit — promoting an issue to soft changes the headline score model.
// Module scope so the focused early return (see `focusEdgeIds`) can read it
// before the scoring section it used to be declared in.
/**
 * Zeroed breakdown for the two early returns that cannot compute one: an aborted
 * run (`abortAboveIssueCount`) and a focused run (`focusEdgeIds`). Both flag
 * themselves in the result, and neither result's score is meaningful.
 */
const EMPTY_BREAKDOWN = {
  nodeCount: 0,
  edgeCount: 0,
  crossings: 0,
  maxCrossingsOnAnyEdge: 0,
  crossingsHistogram: { '0': 0, '1': 0, '2': 0, '3': 0, '4+': 0 },
  totalPoints: 0,
  totalBendPenalty: 0,
  crossingPenalty: 0,
  edges: [],
  pointsHistogram: { '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7+': 0 },
} as const satisfies ValidateLayoutResult['breakdown'];

/**
 * A type is SOFT if and only if it appears here; everything else invalidates.
 *
 * The split is by kind, not by severity. A geometric defect that makes the
 * drawing wrong invalidates; a judgement about placement or port choice is
 * graded. That distinction is what keeps the score informative: any hard issue
 * clamps the score to 0, so if the aesthetic rules invalidated too, a nearly
 * perfect drawing and a catastrophic one would be worth the same and there
 * would be nothing left for the layout engine to climb.
 */
/**
 * Does this issue grade the score rather than invalidate the layout?
 *
 * Exported because callers need to ask the question with the SAME answer the
 * scorer uses. A test that asserts "no issues at all" is asserting something
 * stricter than validity, and once soft rules grade broadly the two stop being
 * the same thing — which is exactly how a suite ends up red on layouts it
 * considers fine.
 */
export function isSoftIssueType(type: LayoutIssueType): boolean {
  return SOFT_PENALTY_BY_TYPE[type] !== undefined;
}

const SOFT_PENALTY_BY_TYPE: Partial<Record<LayoutIssueType, number>> = {
  'edge-bend-overlaps-arrowhead': 50,
  /** Per group traversed by an edge with no endpoint in it. */
  'edge-crosses-foreign-group': 15,
  'port-near-corner': 10,
  /**
   * Deliberately larger than any single bend (a 4-point route costs 5): on a
   * decision shape the vertex is the natural attachment, and giving one up is
   * meant to cost more than the bend it was traded for.
   */
  'port-off-diamond-corner': 40,
  /**
   * Bundling is a legitimate way to draw a fan — one trunk that splits — but it
   * is still a loss: the reader cannot count the edges inside the trunk. Priced
   * so a layout that bundles gratuitously scores below one that does not, while
   * a layout that bundles on purpose can still be scored at all. The pair that
   * genuinely confuses — one edge arriving where another leaves, or two edges
   * running the same lane in opposite directions — stays HARD as
   * `edge-shared-attachment-point` / `edge-shared-subpath`.
   */
  'edge-bundled-attachment-point': 15,
  /** A shared run hides more than a shared handle: it hides the count for longer. */
  'edge-bundled-subpath': 20,
  // Both graded per-issue; see details.softPenalty.
  'group-dead-space': 0,
  'group-elongation': 0,
  'grid-misalignment': 5,
};

/**
 * Render-time layout check: the same checks, the same issues and the same score
 * as {@link validateLayout}, minus the human-readable `Issue.message`.
 *
 * ## Why this exists as a separate entry point
 *
 * `validateLayout` was built as a development instrument for the DDLT sweep — a
 * way to grade a layout offline and say, in English, what is wrong with it. It
 * then became the objective function DOMUS hill-climbs on during a real render:
 * the score-gated passes call it thousands of times per diagram, and on some
 * fixtures it is the majority of layout time. Those two jobs want opposite
 * things. Grading a layout for a human wants every detail it can produce;
 * ranking two candidate routes wants the answer and nothing else.
 *
 * ## Why it is not a cheaper set of checks
 *
 * It would be easy to make the render-time path skip expensive checks. That
 * would be a mistake, and this function deliberately does not do it: DOMUS
 * optimises against whatever this returns, and DDLT grades against
 * `validateLayout`. If the two disagreed about what a good layout is, DOMUS
 * would climb one hill while the sweep measured another, and the sweep would
 * stop predicting what ships. The split here is in what a result can TELL you,
 * never in what it says about the layout — see the equivalence spec next to
 * this module, which pins the two to identical `ok`, `score` and issue types
 * across every DDLT fixture.
 */
export function checkLayout(
  layout: LayoutData,
  options: Omit<ValidateLayoutOptions, 'diagnostics'> = {}
): ValidateLayoutResult {
  return validateLayout(layout, { ...options, diagnostics: false });
}

export function validateLayout(
  layout: LayoutData,
  options: ValidateLayoutOptions = {}
): ValidateLayoutResult {
  LAYOUT_COST.validations++;
  const nodeGroupClearance = nodeGroupClearanceOf(layout);
  const issues: Issue[] = [];
  // See `abortAboveIssueCount`. `undefined` (the default) makes both no-ops, so
  // every abort point below is dead code unless a caller opts in.
  const abortLimit = options.abortAboveIssueCount;
  const shouldAbort = (): boolean => abortLimit !== undefined && issues.length >= abortLimit;
  // See `focusEdgeIds`. `focused` is false by default, so every focus guard below
  // is dead code unless a caller opts in.
  const focusEdgeIds = options.focusEdgeIds;
  // See `diagnostics`. Default true keeps every existing caller bit-identical.
  const diag = options.diagnostics !== false;
  const focused = focusEdgeIds !== undefined;
  const inFocus = (id: string): boolean => focusEdgeIds!.has(id);
  const abortedResult = (): ValidateLayoutResult => ({
    ok: false,
    issues,
    aborted: true,
    score: 0,
    breakdown: EMPTY_BREAKDOWN,
  });
  const nodes = layout.nodes ?? [];
  const edges = layout.edges ?? [];
  const edgeById = new Map<string, _Edge>();
  for (const e of edges) {
    if (e?.id != null) {
      edgeById.set(String(e.id), e);
    }
  }
  const byId = new Map<string, Node>();
  for (const n of nodes) {
    if (n?.id != null) {
      byId.set(String(n.id), n);
    }
  }

  // Build node rects
  const nodeRects = new Map<string, Rect>();
  for (const n of nodes) {
    if (n?.id == null) {
      continue;
    }
    nodeRects.set(String(n.id), rectForNode(n));
  }

  // Build obstacle rects (leaf nodes + label dummy nodes)
  const obstacleRects = new Map<string, Rect>();
  const groupBorderRects = new Map<string, Rect>();
  const groupTitleRects = new Map<string, Rect>();
  for (const n of nodes) {
    if (n?.id == null) {
      continue;
    }
    if (isObstacle(n)) {
      obstacleRects.set(String(n.id), rectForNode(n));
    } else if (n.isGroup) {
      const groupId = String(n.id);
      groupBorderRects.set(groupId, rectForNode(n));
      const groupTitleRect = groupTitleRectForNode(n);
      if (groupTitleRect) {
        groupTitleRects.set(groupId, groupTitleRect);
      }
    }
  }
  const borderHugRects = new Map<string, Rect>([...obstacleRects, ...groupBorderRects]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1) Node overlap checks (keep existing)
  // ─────────────────────────────────────────────────────────────────────────────
  const nodeIds = [...nodeRects.keys()].sort((a, b) => a.localeCompare(b));
  const overlapDetails: {
    aId: string;
    bId: string;
    aRect: Rect;
    bRect: Rect;
    overlapX: number;
    overlapY: number;
  }[] = [];

  for (let i = 0; i < nodeIds.length; i++) {
    if (focused) {
      break; // node-only check: nothing here can involve an edge (see `focusEdgeIds`)
    }
    const aId = nodeIds[i];
    const aNode = byId.get(aId);
    const aRect = nodeRects.get(aId)!;
    for (let j = i + 1; j < nodeIds.length; j++) {
      LAYOUT_COST.pairChecks++;
      const bId = nodeIds[j];
      const bNode = byId.get(bId);
      const bRect = nodeRects.get(bId)!;
      if (!aNode || !bNode) {
        continue;
      }

      // Allow group containment overlaps: group with its descendants.
      const aContainsB = aNode.isGroup && isAncestorGroup(aId, bNode, byId);
      const bContainsA = bNode.isGroup && isAncestorGroup(bId, aNode, byId);
      if (aContainsB || bContainsA) {
        continue;
      }

      const ov = rectsOverlap(aRect, bRect);
      if (ov) {
        issues.push({
          type: 'node-overlap',
          message: diag ? `Nodes "${aId}" and "${bId}" overlap` : '',
          nodeIds: [aId, bId],
          details: { overlapX: ov.overlapX, overlapY: ov.overlapY },
        });
        overlapDetails.push({
          aId,
          bId,
          aRect,
          bRect,
          overlapX: ov.overlapX,
          overlapY: ov.overlapY,
        });
        continue;
      }

      // Two leaves that do not overlap can still be too close to read as
      // separate. Nothing checked this before: `node-overlap` above fires only
      // on actual intersection, so a pair one pixel apart passed cleanly.
      //
      // Only leaf-to-leaf. A group frame's distance to things is already
      // covered by `node-too-close-to-group` and `node-border-hugging`, and
      // measuring a frame against its own members would flag every diagram.
      if (!aNode.isGroup && !bNode.isGroup && !isLabelDummy(aNode) && !isLabelDummy(bNode)) {
        const gap = rectFacingGap(aRect, bRect);
        if (gap != null && gap < NODE_NODE_PADDING - EPS) {
          issues.push({
            type: 'node-node-padding',
            message: diag
              ? `Nodes "${aId}" and "${bId}" are ${gap.toFixed(1)} apart (< ${NODE_NODE_PADDING})`
              : '',
            nodeIds: [aId, bId],
            details: { gap, threshold: NODE_NODE_PADDING },
          });
        }
      }
    }
  }

  // Log node overlap diagnostics
  if (overlapDetails.length > 0) {
    log.debug(DEBUG_KEY, 'NODE_OVERLAP_DETECTED', {
      overlapCount: overlapDetails.length,
      overlaps: overlapDetails.slice(0, 20), // Limit to first 20
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1b) Node-vs-group border-hugging
  //
  // A non-group node whose own border runs ALONG a rendered group border for
  // a significant length is a visual defect: the node visually merges into the
  // frame. For ordinary groups this catches sibling / foreign subgraphs; for
  // swimlanes it also catches collapsed padding against the containing lane.
  // This is the node analogue of `edge-border-hugging` and reuses the same
  // EPS_BORDER (proximity) / L_MIN_BORDER (run length) thresholds via
  // `segmentBorderHugLength`. The node's own ordinary ancestor groups are
  // excluded — a child legitimately sits inside its parent frame — but
  // swimlanes still need visible lane/content padding.
  // ─────────────────────────────────────────────────────────────────────────────
  for (const n of nodes) {
    if (focused) {
      break; // node-only check (see `focusEdgeIds`)
    }
    if (n?.id == null || n.isGroup || isLabelDummy(n)) {
      continue;
    }
    const nId = String(n.id);
    const nr = nodeRects.get(nId);
    if (!nr) {
      continue;
    }
    const sides: Segment[] = [
      { a: { x: nr.left, y: nr.top }, b: { x: nr.right, y: nr.top }, orientation: 'H' },
      { a: { x: nr.left, y: nr.bottom }, b: { x: nr.right, y: nr.bottom }, orientation: 'H' },
      { a: { x: nr.left, y: nr.top }, b: { x: nr.left, y: nr.bottom }, orientation: 'V' },
      { a: { x: nr.right, y: nr.top }, b: { x: nr.right, y: nr.bottom }, orientation: 'V' },
    ];
    for (const [gId, gRect] of groupBorderRects) {
      const groupNode = byId.get(gId);
      const ownAncestor = isAncestorGroup(gId, n, byId);
      if (ownAncestor && !isSwimlaneGroup(groupNode)) {
        continue;
      }
      let maxHug = 0;
      for (const side of sides) {
        maxHug = Math.max(maxHug, segmentBorderHugLength(side, gRect));
      }
      if (maxHug >= L_MIN_BORDER) {
        issues.push({
          type: 'node-border-hugging',
          message: diag
            ? `Node "${nId}" hugs border of group "${gId}" for ${maxHug.toFixed(1)} units`
            : '',
          nodeIds: [nId, gId],
          details: { hugLength: maxHug },
        });
        break; // one issue per node
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1c) Node-vs-group crowding (SOFT, graded)
  //
  // A non-member leaf node parked right up against a foreign group's frame reads
  // as cramped (e.g. subgraph-variation's P5 only 10px off the P1.5 subgraph;
  // P1 15.8px above it). Unlike border-hugging (a node running flush ALONG the
  // frame), this catches a node FACING the frame across too small a gap. The
  // penalty is GRADED and SOFT: the closer below NODE_GROUP_CLEARANCE, the larger
  // — so it never invalidates (a hard rule would mass-regress fixtures like
  // deploy-pipeline, whose D/E sit ~9–12px off their subgraph), it just rewards
  // spacing the node out. Swimlane lanes use a different spacing model and are
  // excluded.
  // ─────────────────────────────────────────────────────────────────────────────
  for (const n of nodes) {
    if (focused) {
      break; // node-only check (see `focusEdgeIds`)
    }
    if (n?.id == null || n.isGroup || isLabelDummy(n)) {
      continue;
    }
    const nId = String(n.id);
    const nr = nodeRects.get(nId);
    if (!nr) {
      continue;
    }
    for (const [gId, gRect] of groupBorderRects) {
      const groupNode = byId.get(gId);
      if (isAncestorGroup(gId, n, byId) || isSwimlaneGroup(groupNode)) {
        continue;
      }
      const gap = rectFacingGap(nr, gRect);
      if (gap == null || gap <= 0 || gap >= nodeGroupClearance) {
        continue;
      }
      const penalty = Math.min(
        NODE_GROUP_CROWD_MAX,
        Math.round((nodeGroupClearance - gap) * NODE_GROUP_CROWD_SCALE)
      );
      issues.push({
        type: 'node-too-close-to-group',
        message: diag
          ? `Node "${nId}" is only ${gap.toFixed(1)} from group "${gId}" frame (< ${nodeGroupClearance})`
          : '',
        nodeIds: [nId, gId],
        details: { gap, clearance: nodeGroupClearance, softPenalty: penalty },
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Pre-compute normalized polylines and edge metadata for edge checks
  // ─────────────────────────────────────────────────────────────────────────────
  interface EdgeMeta {
    id: string;
    startId: string;
    endId: string;
    points: Point[];
    normalized: NormalizedPolyline;
  }
  // cspell:ignore Metas
  const edgeMetas: EdgeMeta[] = [];
  let leafNodeCount = 0;
  let validEdgeCount = 0;

  // Count leaf nodes for scoring
  for (const n of nodes) {
    if (n?.id != null && !n.isGroup) {
      leafNodeCount++;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2) Per-edge checks
  // ─────────────────────────────────────────────────────────────────────────────
  for (const e of edges) {
    const edgeId = e?.id != null ? String(e.id) : '';
    const startId = e.start != null ? String(e.start) : '';
    const endId = e.end != null ? String(e.end) : '';
    const sNode = byId.get(startId);
    const tNode = byId.get(endId);

    if (
      !Array.isArray((e as { points?: Point[] }).points) ||
      (e as { points?: Point[] }).points!.length < 2
    ) {
      if (!focused || inFocus(edgeId)) {
        issues.push({
          type: 'edge-missing-points',
          message: diag ? `Edge "${edgeId}" is missing points` : '',
          edgeId,
        });
      }
      continue;
    }

    const points = (e as { points: Point[] }).points;
    const normalized = normalizePolyline(points);
    edgeMetas.push({ id: edgeId, startId, endId, points, normalized });
    validEdgeCount++;
    // Metadata for every edge is still needed — the pairwise sections below pair
    // the focus edges against all the others — but only the focus edges' own
    // checks run.
    if (focused && !inFocus(edgeId)) {
      continue;
    }

    // ─── edge-self-loop-not-rendered (HARD) ──────────────────────────────────
    // A self-loop (start === end) has to leave its node and return to be drawn
    // at all. A late routing/simplification pass can collapse the loop's U-turn
    // onto — or inside — the node boundary (e.g. both ports slid onto a shared
    // rail, yielding a zero-length segment), which paints as a bare arrowhead
    // with no visible loop. Bend/point scoring can't see this: the collapsed
    // 2-point polyline looks like a perfect "straight" edge and scores ABOVE the
    // correct U-bend. Flag it structurally: if the self-loop never reaches
    // EPS_SELF_LOOP_EXTENT outside its own node, it is not rendering.
    if (startId.length > 0 && startId === endId && sNode && !sNode.isGroup) {
      const loopRect = rectForNode(sNode);
      let maxOutside = 0;
      for (const p of points) {
        maxOutside = Math.max(maxOutside, distanceOutsideRect(p, loopRect));
      }
      if (maxOutside < EPS_SELF_LOOP_EXTENT) {
        issues.push({
          type: 'edge-self-loop-not-rendered',
          message: diag
            ? `Edge "${edgeId}" is a self-loop on node "${startId}" that does not leave the node (max ${maxOutside.toFixed(1)}px outside, needs ${EPS_SELF_LOOP_EXTENT})`
            : '',
          edgeId,
          nodeIds: [startId],
          details: { maxOutside, threshold: EPS_SELF_LOOP_EXTENT, points },
        });
      }
    }

    // ─── New: edge-bend-near-endpoint ────────────────────────────────────────
    // After normalising the polyline (so collinear waypoints don't make a
    // segment look artificially short), if there is at least one bend (i.e.
    // ≥2 normalised segments), check both the FIRST and LAST segments for
    // length < EPS_FINAL_APPROACH. A short final/initial segment means the
    // edge bends right next to an endpoint, leaving no room for the marker
    // to render cleanly.
    if (normalized.segments.length >= 2) {
      const firstSeg = normalized.segments[0];
      const lastSeg = normalized.segments[normalized.segments.length - 1];
      const firstLen = distance(firstSeg.a, firstSeg.b);
      const lastLen = distance(lastSeg.a, lastSeg.b);
      if (firstLen < EPS_FINAL_APPROACH) {
        issues.push({
          type: 'edge-bend-near-endpoint',
          message: diag
            ? `Edge "${edgeId}" first segment is ${firstLen.toFixed(1)} (< ${EPS_FINAL_APPROACH})`
            : '',
          edgeId,
          details: { which: 'start', length: firstLen, threshold: EPS_FINAL_APPROACH },
        });
      }
      if (lastLen < EPS_FINAL_APPROACH) {
        issues.push({
          type: 'edge-bend-near-endpoint',
          message: diag
            ? `Edge "${edgeId}" last segment is ${lastLen.toFixed(1)} (< ${EPS_FINAL_APPROACH})`
            : '',
          edgeId,
          details: { which: 'end', length: lastLen, threshold: EPS_FINAL_APPROACH },
        });
      }

      if (tNode && normalized.segments.length >= 2 && lastLen >= EPS_FINAL_APPROACH) {
        const endSide = sideFromBoundaryPoint(points[points.length - 1], rectForNode(tNode));
        const endBand = endSide
          ? nearEndpointBandDistance(
              normalized.segments[normalized.segments.length - 2],
              endSide,
              rectForNode(tNode)
            )
          : null;
        if (endBand != null) {
          issues.push({
            type: 'edge-bend-near-endpoint',
            message: diag
              ? `Edge "${edgeId}" has a parallel band ${endBand.toFixed(1)} from end node "${endId}"`
              : '',
            edgeId,
            nodeIds: [endId],
            details: { which: 'end-band', distance: endBand, threshold: EPS_ENDPOINT_BAND },
          });
        }
      }
    }

    // Check orthogonality
    const nonOrtho = firstNonOrthogonalSegment(points);
    if (nonOrtho) {
      issues.push({
        type: 'edge-non-orthogonal',
        message: diag ? `Edge "${edgeId}" has a non-orthogonal segment` : '',
        edgeId,
        details: { segmentIndex: nonOrtho.i, a: nonOrtho.a, b: nonOrtho.b, points },
      });
    }

    // Check edge-intersects-obstacle (leaf + label dummy nodes)
    const startAttach = points[0];
    const endAttach = points[points.length - 1];
    // An edge may legitimately thread through its own label node when the
    // label is a waypoint on the edge's single polyline (swimlanes
    // label-as-waypoint model). Exclude the edge's own label node from the
    // obstacle check so those threaded paths aren't flagged as violations.
    const ownLabelId = (e as { labelNodeId?: string }).labelNodeId;

    // Bounding box of this polyline, to reject rectangles it cannot possibly touch.
    //
    // The three rectangle scans below each walk EVERY node rect and test EVERY
    // segment against it: O(edges x nodes x segments) per validation, and the
    // score-gated passes run thousands of validations per render. On
    // `domus/architecture` (≈130 rects) that made `validateLayout` the single
    // largest self-time item in the whole layout at 7614 ms.
    //
    // The reject is exact, not a heuristic. `segmentIntersectsRectInterior` needs
    // `max(segMin, rect.left) < min(segMax, rect.right)` on the parallel axis and
    // `rect.top <= y <= rect.bottom` on the other, so a rect lying STRICTLY outside
    // the polyline's extent cannot satisfy either for any segment of it. Only strict
    // comparisons are used, which keeps the boundary-touching cases the checks
    // deliberately treat as hits.
    let polyMinX = Infinity;
    let polyMaxX = -Infinity;
    let polyMinY = Infinity;
    let polyMaxY = -Infinity;
    for (const p of points) {
      if (p.x < polyMinX) {
        polyMinX = p.x;
      }
      if (p.x > polyMaxX) {
        polyMaxX = p.x;
      }
      if (p.y < polyMinY) {
        polyMinY = p.y;
      }
      if (p.y > polyMaxY) {
        polyMaxY = p.y;
      }
    }
    const outsidePolylineExtent = (r: Rect): boolean =>
      r.right < polyMinX || r.left > polyMaxX || r.bottom < polyMinY || r.top > polyMaxY;

    // edge-border-hugging needs a LOOSER reject than the two interior-hit scans.
    // Those ask whether a segment enters the rect, so a rect strictly outside the
    // polyline's extent is exactly rejectable. Hugging asks the opposite question —
    // does the path run alongside a border it never enters — and matches within
    // EPS_BORDER of it. A rect can therefore sit just outside the polyline's extent
    // and still be a real hug, so inflate the box by that same tolerance before
    // rejecting. Sharing the exact reject here (as this scan did) silently dropped
    // every hug lying beyond the bounding box, including a node whose border the
    // edge parallels from EPS_BORDER away for its entire length.
    const outsideBorderHugExtent = (r: Rect): boolean =>
      r.right < polyMinX - EPS_BORDER ||
      r.left > polyMaxX + EPS_BORDER ||
      r.bottom < polyMinY - EPS_BORDER ||
      r.top > polyMaxY + EPS_BORDER;

    const buildOwnTerminalStubSkip = (
      obstacleId: string
    ): ((a: Point, b: Point) => boolean) | undefined => {
      const exemptStart = obstacleId === startId && !isRectLikeShape(sNode);
      const exemptEnd = obstacleId === endId && !isRectLikeShape(tNode);
      if (!exemptStart && !exemptEnd) {
        return undefined;
      }
      const firstA = points[0];
      const firstB = points[1];
      const lastA = points[points.length - 2];
      const lastB = points[points.length - 1];
      return (a: Point, b: Point): boolean =>
        (exemptStart && a === firstA && b === firstB) || (exemptEnd && a === lastA && b === lastB);
    };

    for (const [obstacleId, obstacleRect] of obstacleRects) {
      if (outsidePolylineExtent(obstacleRect)) {
        continue;
      }
      LAYOUT_COST.rectScans++;
      // NOTE: we do NOT blanket-exclude the edge's own src/dst nodes here.
      // A legitimate edge only touches its own endpoint nodes at the
      // attach point (the polyline's first and last points); any segment
      // that later re-enters that node's interior is a routing bug —
      // exactly the D→H loop-back case reported in iter 8. The
      // `withinAttachCorridor` guard below handles the legitimate
      // boundary-touching first/last segment without needing a blanket
      // skip, because those segments have both endpoints within `L_ATTACH`
      // of the attach point while any loop-back segment runs much further
      // from it.
      if (ownLabelId && obstacleId === ownLabelId) {
        continue;
      }

      // Same exception as `edge-endpoint-inside-node`, for the same reason. When
      // the endpoint node's outline is inside its box, the terminal segment runs
      // from that outline out across the box to reach the routed path, so it
      // crosses the rect by construction. `L_ATTACH` is a fixed 8 and cannot
      // cover it — the gap is as large as the shape's inset. Only the TERMINAL
      // segment is exempt, so a path that later re-enters the node is still
      // reported, which is the loop-back case the blanket skip was avoiding.
      const skipOwnTerminalStub = buildOwnTerminalStubSkip(obstacleId);
      const hit = firstInteriorRectHit(
        points,
        obstacleRect,
        startAttach,
        endAttach,
        skipOwnTerminalStub
      );
      if (hit) {
        issues.push({
          type: 'edge-intersects-obstacle',
          message: diag ? `Edge "${edgeId}" intersects obstacle "${obstacleId}"` : '',
          edgeId,
          nodeIds: [obstacleId],
          details: { ...hit },
        });
      }
    }

    let hitGroupTitle = false;
    for (const [groupId, titleRect] of groupTitleRects) {
      if (outsidePolylineExtent(titleRect)) {
        continue;
      }
      LAYOUT_COST.rectScans++;
      const hit = firstInteriorRectHit(points, titleRect, startAttach, endAttach, (a, b) => {
        const touchesStartAttach =
          distance(a, startAttach) <= EPS || distance(b, startAttach) <= EPS;
        const touchesEndAttach = distance(a, endAttach) <= EPS || distance(b, endAttach) <= EPS;
        return (
          (touchesStartAttach && sNode ? isAncestorGroup(groupId, sNode, byId) : false) ||
          (touchesEndAttach && tNode ? isAncestorGroup(groupId, tNode, byId) : false)
        );
      });
      if (hit) {
        issues.push({
          type: 'edge-intersects-group-title',
          message: diag ? `Edge "${edgeId}" intersects title section of group "${groupId}"` : '',
          edgeId,
          nodeIds: [groupId],
          details: { ...hit, titleRect },
        });
        hitGroupTitle = true;
      }
      if (hitGroupTitle) {
        break;
      }
    }

    // Check edge-corner-connection for start and end nodes
    if (sNode && points.length >= 1) {
      const r = rectForNode(sNode);
      if (minDistanceToCorners(points[0], r) <= EPS_CORNER) {
        issues.push({
          type: 'edge-corner-connection',
          message: diag ? `Edge "${edgeId}" connects at corner of node "${startId}"` : '',
          edgeId,
          nodeIds: [startId],
          details: { point: points[0] },
        });
      }
    }
    if (tNode && points.length >= 1) {
      const r = rectForNode(tNode);
      if (minDistanceToCorners(points[points.length - 1], r) <= EPS_CORNER) {
        issues.push({
          type: 'edge-corner-connection',
          message: diag ? `Edge "${edgeId}" connects at corner of node "${endId}"` : '',
          edgeId,
          nodeIds: [endId],
          details: { point: points[points.length - 1] },
        });
      }
    }

    // Check port direction mismatch (existing check)
    if (sNode && tNode && points.length >= 2) {
      const rs = rectForNode(sNode);
      const rt = rectForNode(tNode);
      const sSide = sideFromBoundaryPoint(points[0], rs);
      const tSide = sideFromBoundaryPoint(points[points.length - 1], rt);
      if (sSide) {
        const dir = segmentDir(points[0], points[1]);
        if (dir && dir !== sSide) {
          issues.push({
            type: 'edge-port-direction-mismatch',
            message: diag
              ? `Edge "${edgeId}" leaves start port on side ${sSide} but first segment goes ${dir}`
              : '',
            edgeId,
            nodeIds: [startId],
            details: {
              terminal: 'start',
              startSide: sSide,
              firstDir: dir,
              p0: points[0],
              p1: points[1],
            },
          });
        }
      }
      if (tSide) {
        const dir = segmentDir(points[points.length - 1], points[points.length - 2]);
        if (dir && dir !== tSide) {
          issues.push({
            type: 'edge-port-direction-mismatch',
            message: diag
              ? `Edge "${edgeId}" enters end port on side ${tSide} but last segment comes from ${dir}`
              : '',
            edgeId,
            nodeIds: [endId],
            details: { terminal: 'end', endSide: tSide, lastDirTowardPort: dir },
          });
        }
      }
    }

    // Check edge-label-off-edge: when an edge carries a `labelNodeId` it is
    // expected to thread through that label node (label-as-waypoint model).
    // The rendered label text sits at the label node's center, so if the
    // edge's polyline does not intersect the label's rectangle at all, the
    // label visually floats off the edge. Flag that as a hard violation.
    if (ownLabelId) {
      const labelRect = nodeRects.get(ownLabelId);
      if (labelRect && !polylineIntersectsRect(points, labelRect)) {
        issues.push({
          type: 'edge-label-off-edge',
          message: diag
            ? `Edge "${edgeId}" does not pass through its label node "${ownLabelId}"`
            : '',
          edgeId,
          nodeIds: [ownLabelId],
          details: { labelRect, points },
        });
      }
    } else {
      // Post-finalize / overlay representation: the label lives on the edge as
      // `edge.label` + `edge.x/y` + `edge.width/height` (no `labelNodeId`). The
      // labelNodeId branch above never sees it, so a label anchored away from
      // its own polyline (e.g. a broken edge whose label floats in empty space)
      // was silently accepted. Apply the same off-edge test to the overlay rect.
      const overlayRect = labelRectForEdge(e);
      if (overlayRect && !polylineIntersectsRect(points, overlayRect)) {
        issues.push({
          type: 'edge-label-off-edge',
          message: diag ? `Edge "${edgeId}" label does not sit on the edge polyline` : '',
          edgeId,
          details: { labelRect: overlayRect, points },
        });
      }
    }

    // Check edge-endpoint-detached-from-node: an edge's start/end point must
    // attach to its start/end node. A point floating in empty space — more than
    // EPS_DETACHED OUTSIDE the node (the opposite of edge-endpoint-inside-node) —
    // means the edge does not actually connect that node, the most basic
    // structural defect. Paint clips the dangling endpoint back onto the node,
    // which renders as the edge hugging the node's border.
    {
      const EPS_DETACHED = 2;
      const distOutsideRect = (p: Point, r: Rect): number => {
        const dx = Math.max(r.left - p.x, 0, p.x - r.right);
        const dy = Math.max(r.top - p.y, 0, p.y - r.bottom);
        return Math.hypot(dx, dy);
      };
      const ends: [Node | undefined, string, Point | undefined, 'start' | 'end'][] = [
        [sNode, startId, points[0], 'start'],
        [tNode, endId, points[points.length - 1], 'end'],
      ];
      for (const [node, nodeId, endpoint, which] of ends) {
        if (!node || !endpoint) {
          continue;
        }
        const d = distOutsideRect(endpoint, rectForNode(node));
        if (d > EPS_DETACHED) {
          issues.push({
            type: 'edge-endpoint-detached-from-node',
            message: diag
              ? `Edge "${edgeId}" ${which} point is ${d.toFixed(1)}px from node "${nodeId}" (not attached)`
              : '',
            edgeId,
            nodeIds: [nodeId],
            details: { which, distance: d, point: endpoint },
          });
        }
      }
    }

    // Check edge-bend-overlaps-arrowhead (SOFT): a turn (interior bend) sitting
    // inside the terminal arrowhead marker's footprint — the bend visually
    // overlaps the arrowhead because the terminal segment is no longer than the
    // marker body. A real but non-structural defect, so it is a soft penalty
    // (see SOFT_PENALTY_BY_TYPE), not an invalidation.
    if (points.length >= 3) {
      for (const terminal of ['start', 'end'] as const) {
        if (!hasTerminalMarker(e, terminal)) {
          continue;
        }
        const markerRect = terminalMarkerClearanceRect(points, terminal);
        if (!markerRect) {
          continue;
        }
        const innerVertex = terminal === 'end' ? points[points.length - 2] : points[1];
        const insideMarker =
          innerVertex.x >= markerRect.left - EPS &&
          innerVertex.x <= markerRect.right + EPS &&
          innerVertex.y >= markerRect.top - EPS &&
          innerVertex.y <= markerRect.bottom + EPS;
        if (insideMarker) {
          issues.push({
            type: 'edge-bend-overlaps-arrowhead',
            message: diag ? `Edge "${edgeId}" ${terminal} bend overlaps its arrowhead marker` : '',
            edgeId,
            details: { terminal, innerVertex, markerRect },
          });
          break;
        }
      }
    }

    // Check edge-invisible-under-marker (HARD): the arrowhead consumes the
    // whole edge. `edge-bend-overlaps-arrowhead` above catches a BEND sitting
    // inside the marker, which is a blemish on an otherwise visible edge; this
    // catches the case where there is no edge left to see at all, because its
    // entire drawn length fits inside its own marker. The reader is shown an
    // arrowhead floating between two nodes with nothing connecting them, so it
    // invalidates rather than scoring.
    if (points.length >= 2) {
      let drawn = 0;
      for (let i = 0; i < points.length - 1; i++) {
        drawn += Math.abs(points[i + 1].x - points[i].x) + Math.abs(points[i + 1].y - points[i].y);
      }
      const marked = hasTerminalMarker(e, 'start') || hasTerminalMarker(e, 'end');
      if (marked && drawn <= EPS_MARKER_CLEARANCE_LENGTH + EPS) {
        issues.push({
          type: 'edge-invisible-under-marker',
          message: diag
            ? `Edge "${edgeId}" is ${drawn.toFixed(1)} long, entirely inside its own marker (${EPS_MARKER_CLEARANCE_LENGTH})`
            : '',
          edgeId,
          details: { drawn, markerLength: EPS_MARKER_CLEARANCE_LENGTH },
        });
      }
    }

    // Check edge-endpoint-inside-node: the start and end points of an edge
    // must attach at a node boundary, not be buried inside any node's
    // interior. A point is considered "inside" when it sits strictly within
    // the rect (not on its boundary) by more than EPS_INSIDE — this allows
    // ports that legitimately touch the boundary while catching ports that
    // the router left dangling inside an obstacle.
    const EPS_INSIDE = 0.5;
    const isStrictlyInside = (p: Point, r: Rect): boolean =>
      p.x > r.left + EPS_INSIDE &&
      p.x < r.right - EPS_INSIDE &&
      p.y > r.top + EPS_INSIDE &&
      p.y < r.bottom - EPS_INSIDE;
    const endpointLabel: [Point, 'start' | 'end'][] = [
      [points[0], 'start'],
      [points[points.length - 1], 'end'],
    ];
    for (const [endpoint, which] of endpointLabel) {
      for (const [nodeIdForRect, r] of nodeRects) {
        // Only real (non-group) nodes are physical bodies whose interiors
        // must be avoided. Group/lane rects legitimately contain everything
        // inside them, including edge ports.
        const n = byId.get(nodeIdForRect);
        if (!n || n.isGroup) {
          continue;
        }
        // The edge's own label node is a waypoint, not an obstacle — skip.
        if (ownLabelId && nodeIdForRect === ownLabelId) {
          continue;
        }
        // The node this endpoint attaches to, when its outline sits inside its
        // box: attaching correctly to a diamond or stadium PUTS the endpoint
        // inside the box, so the rect test cannot tell a good attachment from a
        // buried one. Only this endpoint's own node is exempt — an endpoint
        // buried in any OTHER node is still a defect, which is what the check
        // is for.
        const isOwnTerminalNode =
          (which === 'start' && nodeIdForRect === startId) ||
          (which === 'end' && nodeIdForRect === endId);
        if (isOwnTerminalNode && !isRectLikeShape(n)) {
          continue;
        }
        if (isStrictlyInside(endpoint, r)) {
          issues.push({
            type: 'edge-endpoint-inside-node',
            message: diag
              ? `Edge "${edgeId}" ${which} point lies inside node "${nodeIdForRect}"`
              : '',
            edgeId,
            nodeIds: [nodeIdForRect],
            details: { which, point: endpoint, rect: r },
          });
          break;
        }
      }
    }

    // Check edge-border-hugging against obstacles and group borders. Groups
    // are not generic obstacles because they contain child nodes and child
    // edges, but their rendered border is still a physical boundary: an edge
    // may cross it, but should not run along it for a long distance.
    // Note: We also check start/end nodes because an edge can hug its target's border
    // (e.g., run along the left side of the target before entering)
    for (const [obstacleId, obstacleRect] of borderHugRects) {
      if (outsideBorderHugExtent(obstacleRect)) {
        continue;
      }
      LAYOUT_COST.rectScans++;
      // Same exception as edge-intersects-obstacle: the edge's own label
      // node is a waypoint, not an obstacle to be avoided.
      if (ownLabelId && obstacleId === ownLabelId) {
        continue;
      }
      for (const seg of normalized.segments) {
        // Skip segments where BOTH endpoints are near same edge endpoint
        if (segmentWithinSameAttachCorridor(seg.a, seg.b, startAttach, endAttach)) {
          continue;
        }

        const hugLen = segmentBorderHugLength(seg, obstacleRect);
        if (hugLen >= L_MIN_BORDER) {
          issues.push({
            type: 'edge-border-hugging',
            message: diag
              ? `Edge "${edgeId}" hugs border of node "${obstacleId}" for ${hugLen.toFixed(1)} units`
              : '',
            edgeId,
            nodeIds: [obstacleId],
            details: { segment: seg, hugLength: hugLen },
          });
          break;
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2b) Edge-label overlap checks (foreign-edge + group-border)
  //
  // An edge label sits at its center rect and is "owned" by exactly one edge.
  // Two visual defects: the label text sitting on top of an UNRELATED edge,
  // or being cut by a subgraph FRAME line. The label rect comes from one of
  // two representations, handled uniformly:
  //   • post-finalize overlay (the real DDLT/browser path): label lives on
  //     its owning edge as `edge.label` + `edge.x/y` + `edge.width/height`
  //     (faithful to paint after the single-source-of-truth pass, #18) →
  //     `labelRectForEdge`.
  //   • pre-finalize label-dummy node (synthetic/spec layouts): the
  //     `edge-label-*` node carries the rect; owner via `labelNodeId`.
  // The two never coexist for the same label, so building a unified list is
  // safe and keeps the existing label-dummy spec coverage green.
  // ─────────────────────────────────────────────────────────────────────────────
  {
    interface LabelEntry {
      rect: Rect;
      ownerEdgeId: string;
      labelNodeId: string | null;
    }
    const labelEntries: LabelEntry[] = [];

    // (a) post-finalize overlay representation
    for (const e of edges) {
      const lr = labelRectForEdge(e);
      if (lr) {
        labelEntries.push({ rect: lr, ownerEdgeId: String(e?.id ?? ''), labelNodeId: null });
      }
    }
    // (b) pre-finalize label-dummy representation
    const ownerEdgeIdByLabelId = new Map<string, string>();
    for (const e of edges) {
      const lid = (e as { labelNodeId?: string }).labelNodeId;
      if (typeof lid === 'string' && lid.length > 0) {
        ownerEdgeIdByLabelId.set(lid, String(e?.id ?? ''));
      }
    }
    for (const labelNode of nodes) {
      if (labelNode?.id == null || !isLabelDummy(labelNode)) {
        continue;
      }
      const labelId = String(labelNode.id);
      const lr = nodeRects.get(labelId);
      if (!lr) {
        continue;
      }
      labelEntries.push({
        rect: lr,
        ownerEdgeId: ownerEdgeIdByLabelId.get(labelId) ?? '',
        labelNodeId: labelId,
      });
    }

    for (const { rect: labelRect, ownerEdgeId, labelNodeId } of labelEntries) {
      const who = labelNodeId ? `node "${labelNodeId}"` : `of edge "${ownerEdgeId}"`;
      const ownerEdge = ownerEdgeId ? edgeById.get(ownerEdgeId) : undefined;
      const ownerMeta = ownerEdgeId ? edgeMetas.find((em) => em.id === ownerEdgeId) : undefined;
      // NOTE: this whole section runs in full even under `focusEdgeIds`, and every
      // issue it finds is reported. It is the one part of the validator that is NOT
      // decomposable by edge: each label reports at most ONE overlap and uses `break`
      // to enforce that, so moving the focus edge can change WHICH pair reports —
      // `domus/triage2` produces an `edge-label-overlaps-foreign-edge` between two
      // edges that are BOTH out of focus, purely because the focus edge stopped being
      // that label's first hit. Filtering here made the focused issue delta differ
      // from the full one by one on `domus/triage` and `domus/triage2`. Reporting the
      // section wholesale keeps the delta exact: these issues appear on both sides of
      // the caller's before/after comparison and cancel unless they really moved.

      // edge-label-overlaps-own-arrowhead: labels should not sit on top of
      // their own start/end marker. This complements `edge-label-off-edge`:
      // a label can be on its edge and still visually cover the arrowhead.
      if (ownerEdge && ownerMeta) {
        for (const terminal of ['start', 'end'] as const) {
          if (!hasTerminalMarker(ownerEdge, terminal)) {
            continue;
          }
          const markerRect = terminalMarkerClearanceRect(ownerMeta.normalized.points, terminal);
          const overlap = markerRect ? rectsOverlap(labelRect, markerRect) : null;
          if (overlap) {
            issues.push({
              type: 'edge-label-overlaps-own-arrowhead',
              message: diag
                ? `Label ${who} overlaps ${terminal} arrowhead marker of edge "${ownerEdgeId}"`
                : '',
              edgeId: ownerEdgeId,
              nodeIds: labelNodeId ? [labelNodeId] : [],
              details: {
                terminal,
                labelRect,
                markerRect,
                overlapX: overlap.overlapX,
                overlapY: overlap.overlapY,
                markerClearanceLength: EPS_MARKER_CLEARANCE_LENGTH,
              },
            });
            break; // one marker-overlap issue per label
          }
        }
      }

      // edge-label-overlaps-foreign-edge: any OTHER edge's polyline through it.
      for (const em of edgeMetas) {
        if (ownerEdgeId && em.id === ownerEdgeId) {
          continue;
        }
        let hit = false;
        for (let i = 0; i < em.points.length - 1; i++) {
          if (segmentIntersectsRectInterior(em.points[i], em.points[i + 1], labelRect)) {
            issues.push({
              type: 'edge-label-overlaps-foreign-edge',
              message: diag ? `Label ${who} overlaps edge "${em.id}" (not its own edge)` : '',
              edgeId: em.id,
              nodeIds: labelNodeId ? [labelNodeId] : [],
              details: { ownerEdgeId, segmentIndex: i, a: em.points[i], b: em.points[i + 1] },
            });
            hit = true;
            break;
          }
        }
        if (hit) {
          break; // one foreign-edge issue per label, focused or not
        }
      }

      // edge-label-overlaps-node: the label rect sits on top of a leaf node's
      // interior. An edge label belongs in the routing channel, not over a box;
      // covering a node hides both the node's text and the label's. Checked
      // against every leaf node (groups and label dummies excluded) including
      // the label's own endpoints — a label covering even its own source/target
      // is a real visual defect. A small overlap margin avoids border-touch
      // noise from sub-pixel sizes.
      {
        const EPS_LABEL_NODE_OVERLAP = 2;
        for (const n of nodes) {
          if (n?.id == null || n.isGroup || isLabelDummy(n)) {
            continue;
          }
          const nr = nodeRects.get(String(n.id));
          if (!nr) {
            continue;
          }
          const ov = rectsOverlap(labelRect, nr);
          if (ov && ov.overlapX > EPS_LABEL_NODE_OVERLAP && ov.overlapY > EPS_LABEL_NODE_OVERLAP) {
            issues.push({
              type: 'edge-label-overlaps-node',
              message: diag ? `Label ${who} overlaps node "${String(n.id)}"` : '',
              edgeId: ownerEdgeId || undefined,
              nodeIds: labelNodeId ? [labelNodeId, String(n.id)] : [String(n.id)],
              details: {
                nodeId: String(n.id),
                labelRect,
                overlapX: ov.overlapX,
                overlapY: ov.overlapY,
              },
            });
            break; // one node-overlap issue per label
          }
        }
      }

      // edge-label-overlaps-group-border: a subgraph frame line cuts the
      // label rect (the label is half-in / half-out of a subgraph — its text
      // is visually sliced by the border, regardless of which group it is).
      for (const [gId, gr] of groupBorderRects) {
        const corners: Point[] = [
          { x: gr.left, y: gr.top },
          { x: gr.right, y: gr.top },
          { x: gr.right, y: gr.bottom },
          { x: gr.left, y: gr.bottom },
        ];
        let straddles = false;
        for (let i = 0; i < 4; i++) {
          if (segmentIntersectsRectInterior(corners[i], corners[(i + 1) % 4], labelRect)) {
            straddles = true;
            break;
          }
        }
        if (straddles) {
          issues.push({
            type: 'edge-label-overlaps-group-border',
            message: diag ? `Label ${who} straddles border of group "${gId}"` : '',
            edgeId: ownerEdgeId || undefined,
            nodeIds: labelNodeId ? [labelNodeId, gId] : [gId],
            details: { groupId: gId },
          });
          break; // one group-border issue per label
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3) Same-port-departure check (pairwise edges incident on same node)
  // ─────────────────────────────────────────────────────────────────────────────
  const edgesByNode = new Map<string, EdgeMeta[]>();
  for (const em of edgeMetas) {
    if (em.startId) {
      if (!edgesByNode.has(em.startId)) {
        edgesByNode.set(em.startId, []);
      }
      edgesByNode.get(em.startId)!.push(em);
    }
    if (em.endId && em.endId !== em.startId) {
      if (!edgesByNode.has(em.endId)) {
        edgesByNode.set(em.endId, []);
      }
      edgesByNode.get(em.endId)!.push(em);
    }
  }

  for (const [nodeId, nodeEdges] of edgesByNode) {
    for (let i = 0; i < nodeEdges.length; i++) {
      for (let j = i + 1; j < nodeEdges.length; j++) {
        LAYOUT_COST.pairChecks++;
        const e1 = nodeEdges[i];
        const e2 = nodeEdges[j];
        if (focused && !inFocus(e1.id) && !inFocus(e2.id)) {
          continue;
        }

        // Get attachment info for each edge on this node
        const e1IsStart = e1.startId === nodeId;
        const e2IsStart = e2.startId === nodeId;

        const p1 = e1IsStart ? e1.points[0] : e1.points[e1.points.length - 1];
        const p2 = e2IsStart ? e2.points[0] : e2.points[e2.points.length - 1];

        // First direction away from node
        const dir1 = e1IsStart
          ? direction(e1.points[0], e1.points[1])
          : direction(e1.points[e1.points.length - 1], e1.points[e1.points.length - 2]);
        const dir2 = e2IsStart
          ? direction(e2.points[0], e2.points[1])
          : direction(e2.points[e2.points.length - 1], e2.points[e2.points.length - 2]);

        const attachDistance = distance(p1, p2);

        // A BUNDLE rather than a collision: both edges play the same role at
        // this node — both leaving it, or both arriving — and they run off in
        // the same direction. That is one trunk that splits, which a reader can
        // follow. The confusing pair is the mixed one, where an edge arrives
        // exactly where another leaves and the handle no longer says which way
        // anything goes; `dir` is measured AWAY from the node for both
        // terminals, so equal roles plus equal directions is exactly that test.
        const sameRole = e1IsStart === e2IsStart;
        const bundled = sameRole && dir1 === dir2 && dir1 !== null;

        if (bundled && attachDistance <= EPS_SHARED_ATTACH) {
          issues.push({
            type: 'edge-bundled-attachment-point',
            message: diag
              ? `Edges "${e1.id}" and "${e2.id}" are bundled at one handle on node "${nodeId}"`
              : '',
            nodeIds: [nodeId],
            details: {
              edgeIds: [e1.id, e2.id],
              attachPoints: [p1, p2],
              distance: attachDistance,
              direction: dir1,
              role: e1IsStart ? 'outgoing' : 'incoming',
            },
          });
        }

        if (!bundled && attachDistance <= EPS_PORT && dir1 === dir2 && dir1 !== null) {
          issues.push({
            type: 'edge-same-port-departure',
            message: diag
              ? `Edges "${e1.id}" and "${e2.id}" depart from same port on node "${nodeId}"`
              : '',
            nodeIds: [nodeId],
            details: { edgeIds: [e1.id, e2.id], attachPoints: [p1, p2], direction: dir1 },
          });
        }

        // ─── New: edge-shared-attachment-point ───────────────────────────────
        // Two distinct edges incident on the same node are not allowed to
        // share an attachment point regardless of outward direction. This is
        // a strict superset of `edge-same-port-departure`. We always emit it
        // when within EPS_SHARED_ATTACH so the issue is visible even when the
        // direction-aware check happens to miss (e.g. non-orthogonal first
        // segment), with a `details.alsoSamePortDeparture` flag to hint at
        // the overlap.
        if (!bundled && attachDistance <= EPS_SHARED_ATTACH) {
          const alsoSamePortDeparture =
            attachDistance <= EPS_PORT && dir1 === dir2 && dir1 !== null;
          issues.push({
            type: 'edge-shared-attachment-point',
            message: diag
              ? `Edges "${e1.id}" and "${e2.id}" share an attachment point on node "${nodeId}"`
              : '',
            nodeIds: [nodeId],
            details: {
              edgeIds: [e1.id, e2.id],
              attachPoints: [p1, p2],
              distance: attachDistance,
              alsoSamePortDeparture,
            },
          });
        }

        // ─── New: edge-shared-projected-port ─────────────────────────────────
        // A detached endpoint stub can dodge `edge-shared-attachment-point`
        // (the raw polyline points sit far apart) while still resolving to the
        // SAME boundary port once projected back onto the node. This is the
        // "in-edge and out-edge share a port on the diamond" defect: a router
        // nudges one stub off the node to escape the raw-point check, leaving
        // two edges that visually emanate from the same place. We project both
        // endpoints onto the node's rect and flag when the projected ports
        // coincide but the raw points did NOT — so this is purely additive to
        // the raw check above and never double-emits.
        if (attachDistance > EPS_SHARED_ATTACH) {
          const nodeRect = nodeRects.get(nodeId);
          if (nodeRect) {
            const proj1 = {
              x: Math.min(Math.max(p1.x, nodeRect.left), nodeRect.right),
              y: Math.min(Math.max(p1.y, nodeRect.top), nodeRect.bottom),
            };
            const proj2 = {
              x: Math.min(Math.max(p2.x, nodeRect.left), nodeRect.right),
              y: Math.min(Math.max(p2.y, nodeRect.top), nodeRect.bottom),
            };
            const projectedDistance = distance(proj1, proj2);
            if (projectedDistance <= EPS_SHARED_ATTACH) {
              issues.push({
                type: 'edge-shared-projected-port',
                message: diag
                  ? `Edges "${e1.id}" and "${e2.id}" resolve to the same boundary port on node "${nodeId}" (raw stubs ${attachDistance.toFixed(1)}px apart, projected ${projectedDistance.toFixed(1)}px)`
                  : '',
                nodeIds: [nodeId],
                details: {
                  edgeIds: [e1.id, e2.id],
                  attachPoints: [p1, p2],
                  projectedPorts: [proj1, proj2],
                  rawDistance: attachDistance,
                  projectedDistance,
                },
              });
            }
          }
        }
      }
    }
  }

  // ─── edge-passes-node-attachment ───────────────────────────────────────────
  // An edge that has nothing to do with node N, passing through the exact spot
  // where some other edge attaches to N, is read as leaving N. The reader has
  // no way to tell a line that touches a node from one that starts there, so
  // the diagram asserts an edge that does not exist — the failure mode that
  // makes bundled layouts untrustworthy, where a trunk from an upstream node
  // brushes a node on its way past and its continuation looks like that node's
  // own outgoing edge.
  //
  // Deliberately narrow. It is not about passing NEAR a node — `edge-border-hugging`
  // covers running alongside one — but about coinciding with a real attachment
  // point, within the same tolerance two attachment points must differ by.
  const attachmentsByNode = new Map<string, { point: Point; edgeId: string }[]>();
  const noteAttachment = (nodeId: string | undefined, point: Point, edgeId: string) => {
    if (!nodeId || !point) {
      return;
    }
    const list = attachmentsByNode.get(nodeId);
    if (list) {
      list.push({ point, edgeId });
    } else {
      attachmentsByNode.set(nodeId, [{ point, edgeId }]);
    }
  };
  for (const em of edgeMetas) {
    if (em.points.length >= 2) {
      noteAttachment(em.startId, em.points[0], em.id);
      noteAttachment(em.endId, em.points[em.points.length - 1], em.id);
    }
  }

  for (const em of edgeMetas) {
    if (shouldAbort()) {
      return abortedResult();
    }
    if (em.points.length < 2) {
      continue;
    }
    if (focused && !inFocus(em.id)) {
      continue;
    }
    for (const [nodeId, attachments] of attachmentsByNode) {
      // Its own endpoints attach there legitimately, and a group's frame
      // contains edges by design.
      if (nodeId === em.startId || nodeId === em.endId) {
        continue;
      }
      const node = byId.get(nodeId);
      if (!node || node.isGroup) {
        continue;
      }
      const collision = attachments.find(
        (attachment) =>
          attachment.edgeId !== em.id &&
          distanceToPolyline(em.points, attachment.point) <= EPS_SHARED_ATTACH
      );
      if (collision) {
        issues.push({
          type: 'edge-passes-node-attachment',
          message: diag
            ? `Edge "${em.id}" passes through where "${collision.edgeId}" attaches to node "${nodeId}", so it reads as leaving it`
            : '',
          edgeId: em.id,
          nodeIds: [nodeId],
          details: { throughPoint: collision.point, attachedEdgeId: collision.edgeId },
        });
        break;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4) Shared / crowded parallel subpath checks (pairwise edges)
  // ─────────────────────────────────────────────────────────────────────────────
  if (shouldAbort()) {
    return abortedResult();
  }
  const sortedEdges = [...edgeMetas].sort((a, b) => a.id.localeCompare(b.id));

  // Extent of each edge's normalised polyline, so the two pairwise sections below
  // can skip pairs that cannot interact at all. Both are O(edges^2 x segments^2)
  // without it, and after the per-edge rect scans were bounded this is what is left:
  // `validateLayout` self time is still the largest single item on
  // `domus/architecture`.
  //
  // The margin is what keeps the reject exact. Crossing detection needs the extents
  // to actually overlap, but the shared/parallel checks fire on PROXIMITY, up to
  // `EPS_PARALLEL_EDGE_GAP` apart, so two polylines that far apart can still be a
  // finding. Inflating by that gap (the largest tolerance either section applies)
  // means a rejected pair provably cannot produce any issue from these loops.
  const PAIR_MARGIN = EPS_PARALLEL_EDGE_GAP;
  const edgeExtents = sortedEdges.map((em) => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of em.normalized.points) {
      if (p.x < minX) {
        minX = p.x;
      }
      if (p.x > maxX) {
        maxX = p.x;
      }
      if (p.y < minY) {
        minY = p.y;
      }
      if (p.y > maxY) {
        maxY = p.y;
      }
    }
    return { minX, maxX, minY, maxY };
  });
  const extentsApart = (i: number, j: number): boolean => {
    const a = edgeExtents[i];
    const b = edgeExtents[j];
    return (
      a.maxX + PAIR_MARGIN < b.minX ||
      b.maxX + PAIR_MARGIN < a.minX ||
      a.maxY + PAIR_MARGIN < b.minY ||
      b.maxY + PAIR_MARGIN < a.minY
    );
  };
  const segmentTouchesPoint = (seg: Segment, p: Point): boolean =>
    distance(seg.a, p) <= EPS || distance(seg.b, p) <= EPS;
  const isTerminalSegmentForNode = (em: EdgeMeta, seg: Segment, nodeId: string): boolean => {
    if (em.startId === nodeId && segmentTouchesPoint(seg, em.normalized.points[0])) {
      return true;
    }
    return (
      em.endId === nodeId &&
      segmentTouchesPoint(seg, em.normalized.points[em.normalized.points.length - 1])
    );
  };
  const closeSectionsAreSharedNodeTerminalStubs = (
    e1: EdgeMeta,
    s1: Segment,
    e2: EdgeMeta,
    s2: Segment
  ): boolean => {
    const sharedNodeIds = [e1.startId, e1.endId].filter(
      (id) => id.length > 0 && (id === e2.startId || id === e2.endId)
    );
    return sharedNodeIds.some(
      (nodeId) =>
        isTerminalSegmentForNode(e1, s1, nodeId) && isTerminalSegmentForNode(e2, s2, nodeId)
    );
  };

  // 4a) Self-shared subpath: an edge whose own polyline doubles back along the
  // same lane. Two flavours, both reported as `edge-self-shared-subpath`:
  //
  //   * Non-adjacent overlap (e.g. an A*/roundabout route never cleaned up):
  //     two normalised segments ≥2 apart that are collinear and overlap.
  //   * Adjacent reversal ("backtrack spike"): the RAW route runs out along a
  //     lane and immediately comes straight back over it (e.g. project-sox2's
  //     F→K: right to x=1181.6 then back to x=1071.6 at the same y). This is
  //     invisible on the normalised segments because `mergeCollinear` silently
  //     collapses the reversal — so it MUST be checked on the raw points, which
  //     is what DOMUS paints verbatim.
  for (const em of sortedEdges) {
    if (focused && !inFocus(em.id)) {
      continue;
    }
    const segs = em.normalized.segments;
    let selfFlagged = false;
    for (let a = 0; a < segs.length && !selfFlagged; a++) {
      for (let b = a + 2; b < segs.length; b++) {
        const overlap = collinearOverlap(segs[a], segs[b]);
        if (overlap >= L_MIN_SHARED) {
          issues.push({
            type: 'edge-self-shared-subpath',
            message: diag
              ? `Edge "${em.id}" overlaps its own route along a shared lane (length ${overlap.toFixed(1)})`
              : '',
            edgeId: em.id,
            details: { overlapLength: overlap, segmentIndices: [a, b] },
          });
          selfFlagged = true;
          break;
        }
      }
    }
    if (selfFlagged) {
      continue;
    }
    // Adjacent reversal on the RAW points: P_i→P_{i+1}→P_{i+2} collinear with the
    // second leg running back over the first. The retraced length is the shorter
    // of the two legs.
    const pts = em.points;
    for (let i = 0; i + 2 < pts.length; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const p2 = pts[i + 2];
      let backtrack = 0;
      if (Math.abs(p0.y - p1.y) <= EPS && Math.abs(p1.y - p2.y) <= EPS) {
        const d1 = Math.sign(p1.x - p0.x);
        const d2 = Math.sign(p2.x - p1.x);
        if (d1 !== 0 && d2 !== 0 && d1 !== d2) {
          backtrack = Math.min(Math.abs(p1.x - p0.x), Math.abs(p2.x - p1.x));
        }
      } else if (Math.abs(p0.x - p1.x) <= EPS && Math.abs(p1.x - p2.x) <= EPS) {
        const d1 = Math.sign(p1.y - p0.y);
        const d2 = Math.sign(p2.y - p1.y);
        if (d1 !== 0 && d2 !== 0 && d1 !== d2) {
          backtrack = Math.min(Math.abs(p1.y - p0.y), Math.abs(p2.y - p1.y));
        }
      }
      if (backtrack >= L_MIN_SHARED) {
        issues.push({
          type: 'edge-self-shared-subpath',
          message: diag
            ? `Edge "${em.id}" backtracks over its own lane (length ${backtrack.toFixed(1)})`
            : '',
          edgeId: em.id,
          details: { overlapLength: backtrack, reversalAt: i },
        });
        break;
      }
    }
  }

  for (let i = 0; i < sortedEdges.length; i++) {
    if (shouldAbort()) {
      return abortedResult();
    }
    for (let j = i + 1; j < sortedEdges.length; j++) {
      LAYOUT_COST.pairChecks++;
      const e1 = sortedEdges[i];
      const e2 = sortedEdges[j];
      if (extentsApart(i, j)) {
        continue;
      }
      if (focused && !inFocus(e1.id) && !inFocus(e2.id)) {
        continue;
      }

      for (const s1 of e1.normalized.segments) {
        for (const s2 of e2.normalized.segments) {
          const overlap = collinearOverlap(s1, s2);
          const e1Start = e1.points[0];
          const e1End = e1.points[e1.points.length - 1];
          const e2Start = e2.points[0];
          const e2End = e2.points[e2.points.length - 1];
          if (overlap >= L_MIN_SHARED) {
            // Check if overlap is within attachment corridors of either edge
            const allInCorridor =
              segmentEndpointsWithinAttachCorridors(s1, e1Start, e1End) &&
              segmentEndpointsWithinAttachCorridors(s2, e2Start, e2End);

            if (!allInCorridor) {
              // Same distinction as `edge-bundled-attachment-point`: two edges
              // that meet at a node and run the shared stretch the SAME way are
              // a trunk the reader can follow to where it splits. Two edges
              // running the same lane in OPPOSITE directions, or sharing a lane
              // while having nothing to do with each other, are the ambiguity
              // this check exists for.
              const bundled = edgesShareEndpointNode(e1, e2) && sameTravelDirection(s1, s2);
              issues.push({
                type: bundled ? 'edge-bundled-subpath' : 'edge-shared-subpath',
                message: diag
                  ? bundled
                    ? `Edges "${e1.id}" and "${e2.id}" are bundled over ${overlap.toFixed(1)}`
                    : `Edges "${e1.id}" and "${e2.id}" share a subpath of length ${overlap.toFixed(1)}`
                  : '',
                details: { edgeIds: [e1.id, e2.id], overlapLength: overlap, bundled },
              });
            }
          }

          const projectedOverlap = parallelProjectedOverlap(s1, s2);
          const gap = parallelSegmentGap(s1, s2);
          if (
            projectedOverlap >= L_MIN_SHARED &&
            gap != null &&
            gap > EPS &&
            gap < EPS_PARALLEL_EDGE_GAP
          ) {
            const allInCorridor =
              segmentEndpointsWithinAttachCorridors(s1, e1Start, e1End) &&
              segmentEndpointsWithinAttachCorridors(s2, e2Start, e2End);

            if (!allInCorridor && !closeSectionsAreSharedNodeTerminalStubs(e1, s1, e2, s2)) {
              issues.push({
                type: 'edge-parallel-segment-too-close',
                message: diag
                  ? `Edges "${e1.id}" and "${e2.id}" have parallel sections ${gap.toFixed(1)}px apart over ${projectedOverlap.toFixed(1)}px`
                  : '',
                details: {
                  edgeIds: [e1.id, e2.id],
                  gap,
                  threshold: EPS_PARALLEL_EDGE_GAP,
                  overlapLength: projectedOverlap,
                  minOverlap: L_MIN_SHARED,
                  segments: [s1, s2],
                },
              });
            }
          }
        }
      }
    }
  }

  if (shouldAbort()) {
    return abortedResult();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Added 2026-08-26. Group traversal, port choice, and placement quality.
  //
  // These are node-and-group scoped, so they are skipped in a focused run for
  // the same reason the other node-only checks are: a focused view exists to
  // judge ONE edge's geometry, and a group's fill does not change when an edge
  // moves.
  // ─────────────────────────────────────────────────────────────────────────────
  if (!focused) {
    const groupsWithMembers = new Map<string, { rect: Rect; members: Node[] }>();
    for (const [gId, gRect] of groupBorderRects) {
      const members = nodes.filter(
        (candidate) =>
          candidate?.id != null &&
          !candidate.isGroup &&
          !isLabelDummy(candidate) &&
          isAncestorGroup(gId, candidate, byId)
      );
      if (members.length > 0) {
        groupsWithMembers.set(gId, { rect: gRect, members });
      }
    }

    const laneGroups = detectLaneGroups(groupBorderRects);

    // ── Edges crossing groups they do not belong to, and edges re-entering
    // their own. An edge with no endpoint inside a group has no business
    // routing through it: a detour exists in every case observed. Re-entering
    // the group it started in is worse — the route leaves its own container and
    // comes back, which reads as a mistake rather than a compromise, so that
    // one invalidates while the foreign crossing is graded.
    for (const em of edgeMetas) {
      const pts = em.points;
      if (!Array.isArray(pts) || pts.length < 2) {
        continue;
      }
      const startNode = em.startId != null ? byId.get(em.startId) : undefined;
      const endNode = em.endId != null ? byId.get(em.endId) : undefined;

      for (const [gId, { rect }] of groupsWithMembers) {
        const startsInside = startNode ? isAncestorGroup(gId, startNode, byId) : false;
        const endsInside = endNode ? isAncestorGroup(gId, endNode, byId) : false;

        // How many times does the polyline pass through the frame?
        let entries = 0;
        for (let i = 0; i < pts.length - 1; i++) {
          if (segmentIntersectsRectInterior(pts[i], pts[i + 1], rect)) {
            entries++;
          }
        }
        if (entries === 0) {
          continue;
        }

        if (startsInside && endsInside) {
          continue; // wholly internal: expected
        }

        if (startsInside || endsInside) {
          // One endpoint inside. Leaving is expected; coming BACK is not. The
          // route should cross the frame once, so more than one crossing run
          // means it re-entered.
          const passes = countInteriorRuns(pts, rect);
          if (passes > 1) {
            issues.push({
              type: 'edge-reenters-own-group',
              message: diag
                ? `Edge "${em.id}" leaves group "${gId}" and re-enters it (${passes} separate passes)`
                : '',
              edgeId: em.id,
              nodeIds: [gId],
              details: { passes },
            });
          }
          continue;
        }

        if (laneGroups.has(gId)) {
          continue; // crossing a lane to reach the next one is unavoidable
        }
        issues.push({
          type: 'edge-crosses-foreign-group',
          message: diag
            ? `Edge "${em.id}" routes through group "${gId}", which it has no endpoint in`
            : '',
          edgeId: em.id,
          nodeIds: [gId],
          details: { segments: entries },
        });
      }
    }

    // ── Port placement. Rectangles want their ports near the middle of a side;
    // a port crowded into a corner reads as an accident. Decision shapes invert
    // that: the vertex IS the natural attachment, and a port part-way along a
    // slanted face reads as a miss. The rectangle rule is waived when the
    // corner buys a straight line, because removing a bend is worth more than
    // the tidier attachment.
    for (const em of edgeMetas) {
      const pts = em.points;
      if (!Array.isArray(pts) || pts.length < 2) {
        continue;
      }
      const bendless = pts.length === 2;
      for (const terminal of ['start', 'end'] as const) {
        const nodeId = terminal === 'start' ? em.startId : em.endId;
        const node = nodeId != null ? byId.get(nodeId) : undefined;
        const rect = nodeId != null ? nodeRects.get(nodeId) : undefined;
        if (!node || !rect || node.isGroup) {
          continue;
        }
        const port = terminal === 'start' ? pts[0] : pts[pts.length - 1];

        if (isDecisionShape(node)) {
          const offset = decisionVertexOffset(port, rect);
          if (offset != null && offset > DECISION_VERTEX_TOLERANCE) {
            issues.push({
              type: 'port-off-diamond-corner',
              message: diag
                ? `Edge "${em.id}" attaches to decision node "${nodeId}" ${offset.toFixed(1)} from its nearest vertex`
                : '',
              edgeId: em.id,
              nodeIds: [nodeId],
              details: { terminal, offset },
            });
          }
          continue;
        }

        if (bendless) {
          continue; // a straight edge has earned whatever port it uses
        }
        const fraction = portSideFraction(port, rect);
        if (fraction != null && fraction < PORT_CORNER_FRACTION) {
          issues.push({
            type: 'port-near-corner',
            message: diag
              ? `Edge "${em.id}" attaches to "${nodeId}" ${(fraction * 100).toFixed(0)}% along its side, near a corner`
              : '',
            edgeId: em.id,
            nodeIds: [nodeId],
            details: { terminal, fraction },
          });
        }
      }
    }

    // ── Group compaction. Ink fill is the share of a frame actually occupied
    // by its members; HOLA measures compactness the same way ("ratio of the
    // area occupied by the nodes to the total area of the graph") and reports
    // it correlates with what people prefer. Elongation is scored separately
    // and cumulatively: a frame can be both mostly empty AND stretched, and
    // `domus/architecture2`'s top-left subgraph is both.
    for (const [gId, { rect, members }] of groupsWithMembers) {
      if (laneGroups.has(gId)) {
        continue; // a lane's shape and fill are the diagram's, not the layout's
      }
      const frameArea = Math.max(1, (rect.right - rect.left) * (rect.bottom - rect.top));
      const inkArea = members.reduce((acc, m) => {
        const mr = nodeRects.get(String(m.id));
        return acc + (mr ? (mr.right - mr.left) * (mr.bottom - mr.top) : 0);
      }, 0);
      const fill = inkArea / frameArea;
      if (fill < GROUP_FILL_TARGET) {
        issues.push({
          type: 'group-dead-space',
          message: diag
            ? `Group "${gId}" is ${(fill * 100).toFixed(0)}% full (target ${GROUP_FILL_TARGET * 100}%)`
            : '',
          nodeIds: [gId],
          details: {
            fill,
            softPenalty: (GROUP_FILL_TARGET - fill) * GROUP_FILL_WEIGHT,
          },
        });
      }

      const w = Math.max(1, rect.right - rect.left);
      const h = Math.max(1, rect.bottom - rect.top);
      const aspect = Math.max(w, h) / Math.min(w, h);
      if (aspect > GROUP_ASPECT_LIMIT) {
        issues.push({
          type: 'group-elongation',
          message: diag
            ? `Group "${gId}" has aspect ratio ${aspect.toFixed(1)}:1 (limit ${GROUP_ASPECT_LIMIT}:1)`
            : '',
          nodeIds: [gId],
          details: {
            aspect,
            softPenalty: (aspect - GROUP_ASPECT_LIMIT) * GROUP_ASPECT_WEIGHT,
          },
        });
      }
    }

    // ── Grid alignment. A node that sits ALMOST in line with a neighbour it is
    // connected to reads as a mistake, where either aligned or clearly apart
    // reads as deliberate. Restricted to edge-connected pairs: over all pairs
    // in a group this is quadratic and mostly noise, and it is the connected
    // ones the eye actually tries to line up.
    for (const em of edgeMetas) {
      if (em.startId == null || em.endId == null || em.startId === em.endId) {
        continue;
      }
      const a = nodeRects.get(em.startId);
      const b = nodeRects.get(em.endId);
      const aNode = byId.get(em.startId);
      const bNode = byId.get(em.endId);
      if (!a || !b || aNode?.isGroup || bNode?.isGroup) {
        continue;
      }
      for (const axis of ['x', 'y'] as const) {
        const av = axis === 'x' ? (a.left + a.right) / 2 : (a.top + a.bottom) / 2;
        const bv = axis === 'x' ? (b.left + b.right) / 2 : (b.top + b.bottom) / 2;
        const delta = Math.abs(av - bv);
        if (delta > EPS && delta <= GRID_NEAR_MISS) {
          issues.push({
            type: 'grid-misalignment',
            message: diag
              ? `Nodes "${em.startId}" and "${em.endId}" miss ${axis}-alignment by ${delta.toFixed(1)}`
              : '',
            nodeIds: [em.startId, em.endId],
            details: { axis, delta },
          });
        }
      }
    }
  }

  // A focused run stops here. Everything below is whole-layout aggregation —
  // crossing counts, bend penalties, the 0–1000 score — and none of it can be
  // computed from a subset of the checks, so it is returned zeroed and flagged
  // rather than silently wrong (see `focusEdgeIds`).
  if (focused) {
    // Extensions that can report edge issues still have to run — an edge moving
    // can create or clear one — but only their issues involving a focus edge are
    // part of this partial view. `penalise` is score-only and therefore skipped
    // with the score. Node-only checks are skipped outright (see `nodeOnly`).
    for (const ext of options.extensions ?? []) {
      if (ext.nodeOnly || !ext.check) {
        continue;
      }
      const partial: ValidateLayoutResult = {
        ok: false,
        issues,
        focused: true,
        score: 0,
        breakdown: EMPTY_BREAKDOWN,
      };
      for (const extIssue of ext.check(layout, partial)) {
        const detailIds = extIssue.details?.edgeIds;
        const ids = [extIssue.edgeId, ...(Array.isArray(detailIds) ? detailIds : [])];
        if (ids.some((id) => typeof id === 'string' && id.length > 0 && inFocus(id))) {
          issues.push(extIssue);
        }
      }
    }
    return {
      // `isSoftType` is declared further down, past this return; the predicate is
      // the same one it wraps.
      ok: issues.filter((issue) => SOFT_PENALTY_BY_TYPE[issue.type] === undefined).length === 0,
      issues,
      focused: true,
      score: 0,
      breakdown: EMPTY_BREAKDOWN,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5) Crossing count for scoring
  // ─────────────────────────────────────────────────────────────────────────────
  // `crossings` is the global event count that `crossingPenalty` charges for.
  // `crossingsByEdge` additionally attributes each event to BOTH participating
  // edges, which yields the local crossing number (the max over edges). These
  // per-edge figures are REPORTED ONLY and carry no penalty — the score is
  // unchanged by their presence. They exist because the global sum and the
  // per-edge distribution are formally independent objectives: minimising the
  // total does not minimise the per-edge worst case (local crossing
  // minimisation is separately NP-hard). See `domus/todo-before.publish.md`
  // under "Scoring / validator" before charging for them.
  let crossings = 0;
  const crossingsByEdge = new Map<string, number>();
  for (const em of edgeMetas) {
    crossingsByEdge.set(em.id, 0);
  }
  const bumpEdgeCrossing = (id: string, by: number) => {
    crossingsByEdge.set(id, (crossingsByEdge.get(id) ?? 0) + by);
  };
  for (let i = 0; i < sortedEdges.length; i++) {
    for (let j = i + 1; j < sortedEdges.length; j++) {
      LAYOUT_COST.pairChecks++;
      const e1 = sortedEdges[i];
      const e2 = sortedEdges[j];
      if (extentsApart(i, j)) {
        continue;
      }

      let pairCrossings = 0;
      for (const s1 of e1.normalized.segments) {
        for (const s2 of e2.normalized.segments) {
          if (segmentsCross(s1, s2)) {
            pairCrossings++;
          }
        }
      }
      if (pairCrossings > 0) {
        crossings += pairCrossings;
        bumpEdgeCrossing(e1.id, pairCrossings);
        bumpEdgeCrossing(e2.id, pairCrossings);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Compute DDLT headline score (0–1000 fixed cap, zero on !ok)
  // ─────────────────────────────────────────────────────────────────────────────
  const perEdgePenalties = edgeMetas.map((em) => ({
    id: em.id,
    points: em.normalized.points.length,
    bendPenalty: bendPenaltyForPoints(em.normalized.points.length),
    crossings: crossingsByEdge.get(em.id) ?? 0,
  }));
  perEdgePenalties.sort((a, b) => b.bendPenalty - a.bendPenalty);

  const totalBendPenalty = perEdgePenalties.reduce((acc, p) => acc + p.bendPenalty, 0);
  const crossingPenalty = crossings * CROSSING_PENALTY;
  const totalPoints = edgeMetas.reduce((acc, em) => acc + em.normalized.points.length, 0);

  const perEdgeCrossingCounts = [...crossingsByEdge.values()];
  const maxCrossingsOnAnyEdge = perEdgeCrossingCounts.reduce((m, c) => (c > m ? c : m), 0);
  const crossingsHistogram: Record<'0' | '1' | '2' | '3' | '4+', number> = {
    '0': 0,
    '1': 0,
    '2': 0,
    '3': 0,
    '4+': 0,
  };
  for (const c of perEdgeCrossingCounts) {
    if (c >= 4) {
      crossingsHistogram['4+']++;
    } else {
      crossingsHistogram[String(c) as '0' | '1' | '2' | '3']++;
    }
  }

  const pointsHistogram: Record<'2' | '3' | '4' | '5' | '6' | '7+', number> = {
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
    '6': 0,
    '7+': 0,
  };
  for (const em of edgeMetas) {
    const n = em.normalized.points.length;
    const key: '2' | '3' | '4' | '5' | '6' | '7+' =
      n <= 2 ? '2' : n === 3 ? '3' : n === 4 ? '4' : n === 5 ? '5' : n === 6 ? '6' : '7+';
    pointsHistogram[key]++;
  }

  const isSoftType = (t: LayoutIssueType): boolean => SOFT_PENALTY_BY_TYPE[t] !== undefined;
  const softPenalty = issues.reduce(
    (sum, issue) =>
      sum +
      (isSoftType(issue.type)
        ? ((issue.details?.softPenalty as number | undefined) ??
          SOFT_PENALTY_BY_TYPE[issue.type] ??
          0)
        : 0),
    0
  );
  const hardIssues = issues.filter((issue) => !isSoftType(issue.type));

  const ok = hardIssues.length === 0;
  const rawScore = MAX_SCORE - totalBendPenalty - crossingPenalty - softPenalty;
  const score = ok ? Math.max(0, Math.min(MAX_SCORE, rawScore)) : 0;

  const breakdown = {
    nodeCount: leafNodeCount,
    edgeCount: validEdgeCount,
    crossings,
    maxCrossingsOnAnyEdge,
    crossingsHistogram,
    totalPoints,
    totalBendPenalty,
    crossingPenalty,
    edges: perEdgePenalties,
    pointsHistogram,
  };

  log.debug(DEBUG_KEY, 'VALIDATE_LAYOUT', {
    ok,
    score,
    breakdown,
    issueCount: issues.length,
    issues: issues.slice(0, 50),
    issuesJson: JSON.stringify(issues.slice(0, 50)),
  });

  const coreResult: ValidateLayoutResult = { ok, issues, score, breakdown };
  const extensions = options.extensions;
  if (!extensions || extensions.length === 0) {
    return coreResult;
  }
  return applyValidationExtensions(layout, coreResult, extensions);
}

/**
 * Fold algorithm-specific extensions into a finished core result.
 *
 * Ordering is deliberate: every `check` runs before any `penalise`, so an
 * extension penalty can never rescue a layout that another extension has
 * already invalidated, and the outcome does not depend on extension order.
 */
function applyValidationExtensions(
  layout: LayoutData,
  core: ValidateLayoutResult,
  extensions: readonly LayoutValidationExtension[]
): ValidateLayoutResult {
  const issues = [...core.issues];
  for (const ext of extensions) {
    const extra = ext.check?.(layout, core);
    if (extra?.length) {
      issues.push(...extra);
    }
  }

  const detail: Record<string, { points: number; detail?: Record<string, unknown> }> = {};
  let penalty = 0;
  for (const ext of extensions) {
    const result = ext.penalise?.(layout, core);
    if (!result) {
      continue;
    }
    const points = Math.max(0, result.points);
    penalty += points;
    detail[ext.id] = { points, detail: result.detail };
  }

  // Soft issues grade the score; they do not invalidate. This has to match the
  // core verdict exactly (see the `ok` derived from `hardIssues` above) — the
  // two used to disagree, and because this wrapper is the one callers actually
  // reach, ANY soft issue made a layout invalid here no matter what the core
  // decided. It stayed hidden only because soft issues were rare.
  const ok = issues.filter((issue) => SOFT_PENALTY_BY_TYPE[issue.type] === undefined).length === 0;
  const score = ok ? Math.max(0, Math.min(MAX_SCORE, core.score - penalty)) : 0;

  return {
    ok,
    issues,
    score,
    breakdown:
      Object.keys(detail).length > 0 ? { ...core.breakdown, extensions: detail } : core.breakdown,
  };
}
