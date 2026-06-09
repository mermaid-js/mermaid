/**
 * Shared types for the orthogonal layout pipeline.
 *
 * This module consolidates common interfaces used across:
 * - Core routing/layout modules
 * - DOMUS integration
 * - Pipeline orchestration
 */

import type { LayoutData, Node } from '../../types.js';
import type { DomusConstraints } from './domus/index.js';

// ============================================================================
// Geometry Types
// ============================================================================

/**
 * A 2D point with x and y coordinates.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * A rectangle defined by center point and boundaries.
 */
export interface Rect {
  /** Center x coordinate */
  cx: number;
  /** Center y coordinate */
  cy: number;
  /** Left edge x coordinate */
  left: number;
  /** Right edge x coordinate */
  right: number;
  /** Top edge y coordinate */
  top: number;
  /** Bottom edge y coordinate */
  bottom: number;
}

/**
 * Port side on a node boundary.
 * E = East (right), W = West (left), N = North (top), S = South (bottom)
 */
export type PortSide = 'E' | 'W' | 'N' | 'S';

/**
 * Assigned ports for an edge, including which side of the node they exit/enter.
 */
export interface AssignedPorts {
  startSide: PortSide;
  endSide: PortSide;
  startPort: Point;
  endPort: Point;
}

// ============================================================================
// Tracing Types (for debugging and visualization)
// ============================================================================

/**
 * Names of stages in the orthogonal pipeline.
 */
export type OrthoStageName = 'port-assignment' | 'routing' | 'path-ordering' | 'spacing';

/**
 * Trace information for a pipeline stage.
 */
export interface OrthoStageTrace {
  name: OrthoStageName;
  summary?: string;
}

/**
 * Cost metrics for a routed path.
 */
export interface OrthoRouteCost {
  /** Total Manhattan length of the polyline. */
  length: number;
  /** Number of bends (direction changes) along the route. */
  bends: number;
}

/**
 * One attempt in the routing fallback cascade. Appended in-order as
 * `routeEdges` tries each level. Outcome `'success'` means that level
 * produced the final polyline; `'null'` means the level returned no
 * path and the cascade fell through to the next level.
 *
 * Phase E1 (failure telemetry): any `level >= 3` success is a bug
 * signal — the primary routing-graph path should have found a route.
 * L3/L4 winners indicate an upstream geometry issue (cluttered
 * obstacles, mis-assigned ports, or a bug in the routing-graph model).
 * Borrows vocabulary convention from Siebenhaller's named conflict
 * categories ("straight-line edge assignment issue"); not paper-backed
 * telemetry — pure Mermaid engineering calibration.
 */
export interface RoutingAttempt {
  /** Level in the cascade: 1 = primary, 2 = first fallback, etc. */
  level: 1 | 2 | 3 | 4;
  /**
   * Stable machine-readable tag. Prefix identifies the backend branch:
   * - `'routing-graph:*'`  — routing-graph backend (levels 1-4).
   * - `'aligned-*'`        — aligned/L-shape backend (levels 1-3).
   * - `'l-shape-*'`        — aligned/L-shape backend L-shape path.
   * - `'self-loop'`        — self-loop deterministic route.
   */
  kind: string;
  /** 'success' means this level produced the final polyline. */
  outcome: 'success' | 'null';
  /** Optional free-form engineering context (model name, collision flag). */
  reason?: string;
}

/**
 * Trace information for a single route.
 */
export interface OrthoRouteTrace {
  algorithm: 'aligned' | 'l-shape' | 'routing-graph';
  points: Point[];
  cost: OrthoRouteCost;
  routingGraph?: {
    model: 'grid' | 'representatives' | 'channels' | 'ocr';
    nodes: number;
    edges: number;
  };
  /**
   * Ordered list of routing attempts. Last entry's `outcome` is
   * always `'success'` unless routing failed entirely (never emitted
   * in that case). See {@link RoutingAttempt}.
   */
  routingAttempts?: RoutingAttempt[];
}

/**
 * Per-edge decoration capturing the effective ports (start/end boundary
 * points) used for routing. This represents the outcome of the
 * "port-assignment" stage in the current RP1-style slice: later stages
 * (routing, ordering, spacing) may bend or offset intermediate points, but
 * these ports should remain fixed on the start/end node boundaries.
 */
export interface OrthoPortsTrace {
  startPort: Point;
  endPort: Point;
  startSide?: PortSide;
  endSide?: PortSide;
  startIndexOnSide?: number;
  endIndexOnSide?: number;
  /** Normalized coordinate along the side in [0,1] */
  startT?: number;
  /** Normalized coordinate along the side in [0,1] */
  endT?: number;
}

/**
 * Trace information for a single edge.
 */
export interface OrthoEdgeTrace {
  startNodeId?: string;
  endNodeId?: string;
  ports?: OrthoPortsTrace;
  route?: OrthoRouteTrace;
}

/**
 * Complete trace of the orthogonal pipeline execution.
 */
export interface OrthogonalTrace {
  stages: OrthoStageTrace[];
  edges: Record<string, OrthoEdgeTrace>;
  /**
   * Optional map from stable segmentKey -\> ordered list of edgeIds.
   * Populated by the Option-B (DOMUS routes) post-processing stage.
   */
  bundleOrder?: Record<string, string[]>;
}

// ============================================================================
// Pipeline Options
// ============================================================================

/**
 * Options for the orthogonal edge routing pipeline.
 */
export interface LibavoidRoutingRequest {
  data: LayoutData;
  nodesById: Map<string, Node>;
  edgeIds: string[];
  spacing: number;
}

export type LibavoidRoutingAdapter = (
  request: LibavoidRoutingRequest
) => Map<string, Point[]> | Record<string, Point[]>;

export interface OrthogonalOptions {
  /**
   * Target minimum spacing (delta_min) between parallel segments and between
   * segments and boxes. A richer surface will be added as the RP1 stages grow.
   */
  spacing?: number;

  /**
   * Minimum clearance (diagram units) to keep between routed segments and node borders.
   * When omitted, defaults to `spacing`.
   */
  clearance?: number;

  /** Optional structured trace object populated per stage and per edge. */
  trace?: OrthogonalTrace;

  /**
   * Backend to use for routing.
   * - 'aligned' (default): simple L-shape/aligned routing
   * - 'domus': shape-first orthogonal drawing algorithm
   */
  routingBackend?: 'aligned' | 'routing-graph' | 'domus';

  /**
   * When using routingBackend='routing-graph', select the graph construction.
   * - 'grid': dense Hanan-style grid from obstacle coordinates (existing).
   * - 'representatives': sparser representative-lines visibility graph (Milestone 4 stepping stone).
   * - 'channels': channel-based representative lines (minimum-width channels per obstacle side).
   * - 'ocr': orthogonal visibility graph + bend-aware A* (optional; validation-gated fallback).
   */
  routingGraphModel?: 'grid' | 'representatives' | 'channels' | 'ocr';

  /**
   * Enable validation-gated OCR fallback (default: true).
   *
   * If enabled and the primary routing pass (grid/representatives/channels) yields an invalid
   * layout per `validateLayout(layout)`, reroute failing edges with OCR and re-run the
   * post-routing passes locally for the affected neighborhood.
   *
   * Note: `validateLayout(layout)` is used unchanged as the oracle.
   */
  ocrFallback?: boolean;

  /**
   * Optional quality gate: if set, allow OCR reroute when ok===true but `score < threshold`.
   * Default: undefined (disabled).
   */
  ocrScoreThreshold?: number;

  /**
   * Deterministic per-edge bound for OCR search expansions (no wall-clock).
   * Default: 50_000.
   */
  ocrMaxExpansions?: number;

  /**
   * Coexistent Libavoid integration seam.
   *
   * DOMUS remains responsible for node placement and happy-path routing.
   * When enabled, a post-routing fallback may ask an injected adapter to
   * reroute a selected subset of edges while keeping node positions fixed.
   *
   * This repo currently wires the policy/seam first; the concrete adapter can
   * be backed by a real Libavoid binding later without changing the pipeline.
   */
  libavoidFallback?: boolean;

  /**
   * Trigger Libavoid fallback when the layout has more crossings than this.
   * Default: undefined (disabled unless a concrete threshold is supplied).
   */
  libavoidCrossingThreshold?: number;

  /**
   * Trigger Libavoid fallback when the layout has more rendered diagonal
   * endpoints than this. Default: undefined.
   */
  libavoidRenderedDiagonalThreshold?: number;

  /**
   * Trigger Libavoid fallback when any semantic edge has more bends than this.
   * Default: undefined.
   */
  libavoidMaxEdgeBendsThreshold?: number;

  /**
   * Adapter that performs fixed-node orthogonal rerouting for the selected
   * edges. This is intentionally injected so Mermaid can coexist with DOMUS
   * today and bind to a concrete Libavoid implementation later.
   */
  libavoidAdapter?: LibavoidRoutingAdapter;

  /**
   * Temporary aggressive Libavoid policy for live investigation.
   *
   * When enabled, candidate acceptance prioritizes visible crossing reduction
   * over strict preservation of the existing real-issue count. This is useful
   * for diagnosing whether Libavoid can produce a visibly different DOMUS
   * render on dense fixtures such as Company.mmd.
   */
  libavoidAggressive?: boolean;

  /**
   * Route all semantic edges through the Libavoid fallback candidate set.
   * Useful for live investigation when comparing a full-diagram reroute.
   */
  libavoidAllEdges?: boolean;

  /**
   * Milestone 5 (Option C): incremental update hints.
   * When provided, the pipeline will reroute only affected edges and keep other
   * edge geometries as-is.
   */
  incremental?: {
    changedNodeIds?: string[];
    changedEdgeIds?: string[];
  };

  /**
   * Whether to apply the RP1-style post-processing stages (bundle ordering +
   * spacing + nudging) after DOMUS has produced `edge.points`.
   *
   * This is the Milestone-1 "Option B" integration: keep DOMUS routes, then
   * polish them for bundle consistency and lane separation.
   *
   * Default: false (opt-in until the DOMUS routing backend is stable).
   */
  postProcessDomus?: boolean;

  /**
   * Snap epsilon (diagram units) applied after the final nudging pass.
   * Default: 1.
   */
  snapEps?: number;

  /**
   * Snap grid used to define stable segment keys for Option-B bundle grouping.
   * This should be small (e.g. 1 diagram unit) and must remain stable across runs.
   * Default: 1.
   */
  segmentKeySnap?: number;

  /**
   * Whether to use existing node positions or let the backend compute them.
   * Only applicable for 'domus' backend.
   */
  useExistingPositions?: boolean;

  /**
   * Optional constraints for the routing backend (DOMUS).
   */
  constraints?: DomusConstraints;

  /**
   * Whether DOMUS placement should respect Mermaid's flowchart direction
   * (TB / BT / LR / RL) by emitting SAT `above/below/left-of/right-of`
   * position constraints for every layering edge (iter-3 / R4 / Phase A4).
   *
   * Default: `false`. The DOMUS paper layout is direction-agnostic — vertices
   * are placed by SAT shape + drawability without regard to flowchart
   * direction. Mermaid's flowchart users typically expect TB to render
   * top-to-bottom, but that's a Mermaid product extension, not part of the
   * paper algorithm. Default-off keeps DOMUS paper-faithful for fixtures
   * like `domus1.mmd` that aim to reproduce paper figures. Mermaid product
   * code should set this to `true` when invoking DOMUS for diagram
   * rendering that should honour user-declared flowchart direction.
   */
  respectFlowDirection?: boolean;

  /**
   * Whether nudgers should bias along the flowchart's primary axis
   * (iter-13 / R11). When `true` and `data.direction` is vertical
   * (TB / BT / TD / DT), the minimum-spacing, edge-label-gap, edge-gap,
   * connected-pair, and box nudgers prefer X-axis moves to preserve
   * vertical layering. When `false` (default), nudgers are axis-neutral.
   *
   * Default: `false`. Direction-derived axis preference is a Mermaid
   * heuristic, not paper-backed. Default-off makes A2 (propagating
   * `direction` into LayoutData) safe to land without re-introducing the
   * Company-simp regression iter-3 hit. Mermaid product code can opt in
   * by passing `true` when consistent vertical layering matters.
   */
  respectFlowDirectionInNudges?: boolean;

  /**
   * iter-37 — DOMUS §7 anti-parallel corridor side-constraint hint.
   * When `useExistingPositions === false`, the DOMUS backend emits
   * `edgeConstraints.allowedLabels` for each single-edge-per-direction
   * anti-parallel pair, forcing both edges into a shared vertical (for
   * TB/BT flow) or horizontal (LR/RL) corridor.
   *
   * **Default `true` as of iter-37.** User decision after E2E trial
   * showed the hint produces visibly cleaner anti-parallel routing on
   * company-simp (USC↔HKC vertically aligned, HKC→Wages straight) at
   * the cost of one regressed edge (USC→Expenses 5-bend detour through
   * HK pill — flagged as iter-38 target).
   *
   * Pass `false` to opt out (e.g. for tests pinning pre-iter-37
   * geometry).
   *
   * Paper anchor: DOMUS §6 (source `6784b3d1`) — caller-supplied
   * allowed labels are a sanctioned SAT extension.
   */
  enableAntiparallelCorridorHints?: boolean;

  /**
   * iter-25 / D1-v1 pragmatic (Phase D / R5). When unset or `true`, the
   * DOMUS backend handles fixtures with groups (`isGroup: true` nodes)
   * instead of downgrading to the routing-graph fallback at
   * `pipeline/context.ts`. Groups remain filtered out of the DOMUS
   * vertex list (leaves only enter SAT/drawability), but
   * `preprocessClusters` is called at the DOMUS backend entry so group
   * rectangles are sized from their children's bounding box, and the
   * DOMUS pipeline treats them as obstacles for edge routing.
   *
   * **Default (iter-27): `true`.** Explicit `false` opts OUT to the
   * routing-graph fallback — preserved as an escape hatch for regression
   * triage. iter-26 diagnostic (`cluster-fixtures.ddlt.spec.ts`) confirmed
   * DOMUS-native produces identical validateLayout issue profiles to the
   * fallback on real Mermaid cluster fixtures (including compound edges),
   * so the flag was promoted to default-on in iter-27.
   *
   * Paper anchor: R5 / Siebenhaller §3. The paper's
   * `c_t / c_b / uc_l^i / uc_r^i` boundary vertex materialisation was
   * explicitly determined NOT needed for Mermaid's router (iter-26
   * finding) — Mermaid handles compound edges the same way as regular
   * cluster-crossing edges (both route through the cluster rectangle).
   */
  allowDomusWithGroups?: boolean;

  /**
   * Whether to enable debug logging.
   */
  debug?: boolean;

  // ============================================================================
  // Compound / cluster graph options
  // ============================================================================

  /**
   * Force pulling children toward center during iterative layouts (future use).
   * Default: 0.01
   */
  groupAttraction?: number;

  /**
   * Space around children inside group bounds (diagram units).
   * Default: 15
   */
  groupPadding?: number;

  /**
   * Minimum gap between sibling groups during overlap resolution (future use).
   * Default: 100
   */
  minGroupSpacing?: number;
}
