// cspell:ignore raykov Raykov Wybrow Marriott Stuckey

/**
 * Orthogonal edge router for the swimlanes layout.
 *
 * Each edge is routed as an axis-aligned (Manhattan) polyline between ports on
 * the node borders, with port distribution and nudging to reduce overlaps and
 * crossings. The approach follows the orthogonal-connector-routing literature —
 * notably Wybrow, Marriott & Stuckey, "Orthogonal Connector Routing" (the
 * libavoid family). "Raykov" in the comments and tests is the informal name this
 * implementation was developed under, not an external dependency.
 */

import type { LayoutData, Node as MermaidNode } from '../../../types.js';
import { PRECISION } from '../config.js';

const EPS = PRECISION.EPSILON;

const NODE_PADDING = 8;
const HORIZONTAL_PIPE_MARGIN = 15;
const VERTICAL_PIPE_MARGIN = 15;
const ROUTING_MARGIN = 25;
const ANCHOR_OFFSET = 20;
const TRACK_SPACING = 10;

// ---------------------------------------------------------------------------
// Type Definitions for Orthogonal Router
// ---------------------------------------------------------------------------

interface Point {
  x: number;
  y: number;
}

type OrthogonalSide = 'top' | 'bottom' | 'left' | 'right';

interface LaneInfo {
  id: string;
}

type Orientation = 'horizontal' | 'vertical';

interface Pipe {
  id: string;
  orientation: Orientation;
  coord: number; // y for horizontal, x for vertical
  spanMin: number;
  spanMax: number;
  tracks: Track[];
}

interface Track {
  index: number;
  coord: number; // actual x/y of this track
  segments: SegmentRef[]; // references to segments belonging to this track
}

interface SegmentRef {
  edgeIndex: number;
  segmentIndex: number;
  from: number; // min coord along axis
  to: number; // max coord along axis
}

interface RoutedSegment {
  edgeIndex: number;
  segmentIndex: number;
  orientation: Orientation;
  pipe: Pipe;
  trackIndex: number;
  from: number;
  to: number;
}

interface RoutedLine {
  orient: Orientation;
  coord: number;
  from: number;
  to: number;
}

function chooseOrthogonalSide(
  node: MermaidNode,
  target: Point,
  fallback: OrthogonalSide
): OrthogonalSide {
  const cx = node.x ?? 0;
  const cy = node.y ?? 0;
  const dx = target.x - cx;
  const dy = target.y - cy;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx < EPS && absDy < EPS) {
    return fallback;
  }

  const verticalBias = 3.0;
  if (absDy > EPS && absDy * verticalBias >= absDx) {
    return dy > 0 ? 'bottom' : 'top';
  }
  if (absDx > EPS) {
    return dx > 0 ? 'right' : 'left';
  }
  return fallback;
}

function sharedLineEndpointCoord(line: RoutedLine, nextLine: RoutedLine): number {
  return Math.abs(line.to - nextLine.from) < EPS || Math.abs(line.to - nextLine.to) < EPS
    ? line.to
    : line.from;
}

function pointOnLine(line: RoutedLine, along: number): Point {
  return line.orient === 'vertical' ? { x: line.coord, y: along } : { x: along, y: line.coord };
}

// ---------------------------------------------------------------------------
// Orthogonal Router Implementation
// ---------------------------------------------------------------------------

export function routeEdgesOrthogonal(data: LayoutData, direction?: string): LayoutData {
  const nodes = data.nodes ?? [];
  const originalEdges = data.edges ?? [];

  // Build a local "routing view" of the edge list:
  // - Skip `isLayoutOnly` virtual edges — they exist only for Sugiyama layering
  //   (the A→label, label→B pair lets Sugiyama rank through labels) and must
  //   never be routed or rendered.
  // - All other edges (including labelled originals) pass through unchanged.
  //   Strategy 1 (late-insertion / diss.pdf §118): labelled edges are routed
  //   as single unbroken A→B polylines with labels invisible to routing.
  //   Labels are then anchored post-routing onto a middle segment of the
  //   resulting polyline via postProcessing.ts's `anchorLabelsToPolyline` pass.
  //   No shadow-split, no L-bend bridge, no per-edge label obstacle exclusion.
  interface InternalRoutingEdge {
    id: string;
    start?: string;
    end?: string;
    points?: Point[];
    __originalEdge?: (typeof originalEdges)[number];
    [key: string]: unknown;
  }
  const edges: InternalRoutingEdge[] = [];
  for (const oe of originalEdges) {
    if ((oe as { isLayoutOnly?: boolean }).isLayoutOnly) {
      continue;
    }
    edges.push({
      ...(oe as unknown as Record<string, unknown>),
      __originalEdge: oe,
    } as InternalRoutingEdge);
  }

  const nodeById = new Map<string, MermaidNode>();
  const laneByNodeId = new Map<string, LaneInfo>();
  const pipes: Pipe[] = [];
  const isLR = direction === 'LR';

  // 1. Initialize Helpers & Lookups
  for (const n of nodes) {
    nodeById.set(n.id, n);
  }

  // Identify Lanes (Top-level groups)
  const topLevelGroups = nodes.filter((n) => n.isGroup && !n.parentId);
  for (const group of topLevelGroups) {
    const lane: LaneInfo = { id: group.id };

    // Assign this lane to all descendants
    const assignLane = (n: MermaidNode) => {
      laneByNodeId.set(n.id, lane);
      nodes.filter((child) => child.parentId === n.id).forEach(assignLane);
    };
    assignLane(group);
  }
  // Also build obstacle rects for non-group nodes, tracking which node each belongs to.
  //
  // Strategy 1 (late-insertion / diss.pdf §118): edge-label nodes are NOT
  // obstacles during routing. Labels are placed post-routing onto an
  // existing polyline segment via `anchorLabelsToPolyline` in postProcessing.ts.
  // Foreign edges never route around labels, so there is no "foreign edge
  // routed around old label position, label later moved" inconsistency.
  interface ObstacleRect {
    nodeId: string;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    // For LR direction, we need to know the "visual" extent after transform
    // TB x becomes LR y, so the visual Y extent should use height, not width
    visualXHalfExtent: number;
  }
  const obstacles: ObstacleRect[] = nodes
    .filter((n) => !n.isGroup && !(n as { isEdgeLabel?: boolean }).isEdgeLabel)
    .map((n) => {
      const w = n.width ?? 10;
      const h = n.height ?? 10;
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      // Inflate by configured padding
      const padding = NODE_PADDING;

      return {
        nodeId: n.id,
        minX: x - w / 2 - padding,
        maxX: x + w / 2 + padding,
        minY: y - h / 2 - padding,
        maxY: y + h / 2 + padding,
        // For LR: TB x becomes LR y, so visual Y extent should be based on height
        visualXHalfExtent: isLR ? h / 2 + padding : w / 2 + padding,
      };
    });

  // Helper to find or create pipe
  const getOrAddPipe = (
    orientation: Orientation,
    coord: number,
    spanMin: number,
    spanMax: number
  ): Pipe => {
    let pipe = pipes.find((p) => p.orientation === orientation && Math.abs(p.coord - coord) < 1);
    if (!pipe) {
      pipe = {
        id: `pipe-${orientation}-${coord.toFixed(0)}`,
        orientation,
        coord,
        spanMin,
        spanMax,
        tracks: [],
      };
      pipes.push(pipe);
    }
    // Extend span
    pipe.spanMin = Math.min(pipe.spanMin, spanMin);
    pipe.spanMax = Math.max(pipe.spanMax, spanMax);
    return pipe;
  };

  // Direct port-for-side helper. Used by Step 6.2's sibling side-split
  // reassignment so the main routing loop can honor a side that does
  // not match `getOrthogonalPort`'s natural choice.
  const portForSide = (node: MermaidNode, side: OrthogonalSide): Point => {
    const w = node.width ?? 10;
    const h = node.height ?? 10;
    const cx = node.x ?? 0;
    const cy = node.y ?? 0;
    switch (side) {
      case 'top':
        return { x: cx, y: cy - h / 2 };
      case 'bottom':
        return { x: cx, y: cy + h / 2 };
      case 'left':
        return { x: cx - w / 2, y: cy };
      case 'right':
        return { x: cx + w / 2, y: cy };
    }
  };

  /**
   * Get orthogonal port point - returns the CENTER of a cardinal side (left/right/top/bottom).
   * This ensures the edge starts/ends with a purely horizontal or vertical segment.
   *
   * @param node - The node to get the port from
   * @param target - The target point (used to determine which side)
   * @param isSource - Whether this is the source node (affects side selection for same-row/column cases)
   */
  const getOrthogonalPort = (node: MermaidNode, target: Point, isSource: boolean): Point =>
    portForSide(node, chooseOrthogonalSide(node, target, isSource ? 'bottom' : 'top'));

  // Global list of all routed segments for crossing reduction
  const allRoutedSegments: RoutedSegment[] = [];
  const edgeSegmentIndices: number[][] = []; // edgeIndex -> [routedSegmentIndex, ...]
  // Centered straight-line fast-path edges should keep their pipe coord.
  const straightIntraLaneEdges = new Set<number>();
  const CROSSING_PENALTY = 1000;

  const crossingPenalty = (edgeIdx: number, from: Point, to: Point): number => {
    if (allRoutedSegments.length === 0) {
      return 0;
    }
    const isHorizontal = Math.abs(from.y - to.y) < EPS;
    const isVertical = Math.abs(from.x - to.x) < EPS;
    if (!isHorizontal && !isVertical) {
      return 0;
    }

    let penalties = 0;
    if (isHorizontal) {
      const y = from.y;
      const minX = Math.min(from.x, to.x) - EPS;
      const maxX = Math.max(from.x, to.x) + EPS;
      if (maxX <= minX) {
        return 0;
      }
      for (const seg of allRoutedSegments) {
        if (seg.edgeIndex === edgeIdx || seg.orientation !== 'vertical') {
          continue;
        }
        if (seg.pipe.coord < minX || seg.pipe.coord > maxX) {
          continue;
        }
        if (seg.from - EPS <= y && seg.to + EPS >= y) {
          penalties += CROSSING_PENALTY;
        }
      }
    } else if (isVertical) {
      const x = from.x;
      const minY = Math.min(from.y, to.y) - EPS;
      const maxY = Math.max(from.y, to.y) + EPS;
      if (maxY <= minY) {
        return 0;
      }
      for (const seg of allRoutedSegments) {
        if (seg.edgeIndex === edgeIdx || seg.orientation !== 'horizontal') {
          continue;
        }
        if (seg.pipe.coord < minY || seg.pipe.coord > maxY) {
          continue;
        }
        if (seg.from - EPS <= x && seg.to + EPS >= x) {
          penalties += CROSSING_PENALTY;
        }
      }
    }
    return penalties;
  };

  // -----------------------------------------------------------------------
  // Phase 1: Initial Routing
  // -----------------------------------------------------------------------
  const routingOrder = edges
    .map((edge, idx) => {
      if (!edge.start || !edge.end) {
        return { idx, crossLane: 0, dx: 0, dy: 0 };
      }
      const srcNode = nodeById.get(edge.start);
      const dstNode = nodeById.get(edge.end);
      const srcLane = laneByNodeId.get(edge.start);
      const dstLane = laneByNodeId.get(edge.end);
      const crossLane = srcLane && dstLane && srcLane.id !== dstLane.id ? 1 : 0;
      const dx = srcNode && dstNode ? Math.abs((dstNode.x ?? 0) - (srcNode.x ?? 0)) : 0;
      const dy = srcNode && dstNode ? Math.abs((dstNode.y ?? 0) - (srcNode.y ?? 0)) : 0;
      return { idx, crossLane, dx, dy };
    })
    .sort((a, b) => {
      // Route cross-lane edges FIRST so they claim their preferred straight
      // path before flexible intra-lane detours can block them. Intra-lane
      // edges then adapt via the backward-looking CROSSING_PENALTY — a
      // cheap U-detour around an obstacle is strictly better than a
      // sequential-A* pathology where the cross-lane edge gets forced
      // through a crossing it can no longer avoid.
      // Paper backing: Walk on the Wild Side (LIPIcs.GD.2025.35) — bend-
      // minimization dominates crossing-minimization when crossings are
      // orthogonal; Wybrow et al. Orthogonal Connector Routing — crossing
      // penalty is only effective against already-routed edges.
      if (a.crossLane !== b.crossLane) {
        return b.crossLane - a.crossLane;
      }
      // Shorter edges first — they need less room to maneuver
      const aDist = a.dx + a.dy;
      const bDist = b.dx + b.dy;
      if (Math.abs(aDist - bDist) > 1) {
        return aDist - bDist;
      }
      return a.idx - b.idx;
    })
    .map((entry) => entry.idx);

  // Helper to check if a segment is blocked by any obstacle.
  // excludeStart and excludeEnd are node IDs to exclude from obstacle checking.
  const isSegmentBlocked = (p1: Point, p2: Point, excludeStart?: string, excludeEnd?: string) => {
    const segMinX = Math.min(p1.x, p2.x);
    const segMaxX = Math.max(p1.x, p2.x);
    const segMinY = Math.min(p1.y, p2.y);
    const segMaxY = Math.max(p1.y, p2.y);

    const blockingObs = obstacles.find((obs) => {
      if (excludeStart && obs.nodeId === excludeStart) {
        return false;
      }
      if (excludeEnd && obs.nodeId === excludeEnd) {
        return false;
      }
      if (Math.abs(p1.x - p2.x) > EPS) {
        // Horizontal segment
        return obs.minY < p1.y && obs.maxY > p1.y && obs.maxX > segMinX && obs.minX < segMaxX;
      } else {
        // Vertical segment
        return obs.minX < p1.x && obs.maxX > p1.x && obs.maxY > segMinY && obs.minY < segMaxY;
      }
    });

    return !!blockingObs;
  };

  // ---- Step 6: Port pre-assignment ----
  // When multiple edges connect to the same side of a node, distribute their
  // ports across that side and order them by source/target coordinate to
  // prevent crossings at the node boundary.
  //
  // Key: "nodeId:side:role" where side is 'top'|'bottom'|'left'|'right'
  //   and role is 'src' (edge leaves this node) or 'dst' (edge arrives here).
  // Value: list of { edgeIdx, oppositeCoord } sorted by oppositeCoord.
  const portGroups = new Map<string, { edgeIdx: number; oppositeCoord: number }[]>();

  // First pass: determine which side each edge connects to on each node
  const determineSide = (node: MermaidNode, target: Point): OrthogonalSide =>
    chooseOrthogonalSide(node, target, 'bottom');

  // ----- Step 6.1: compute initial sides for every edge ---------------
  //
  // We run determineSide up-front for both endpoints of every edge so the
  // sibling side-splitting pass (6.2) can see the full picture before the
  // port-group build (6.3) locks each edge into a side.
  type SideT = 'top' | 'bottom' | 'left' | 'right';
  interface EdgeSideInfo {
    edgeIdx: number;
    srcId: string;
    dstId: string;
    srcSide: SideT;
    dstSide: SideT;
    absDx: number;
    absDy: number;
    dxSign: number;
    dySign: number;
  }
  const sideInfoByIdx = new Map<number, EdgeSideInfo>();
  for (const [i, e] of edges.entries()) {
    if (!e.start || !e.end || e.start === e.end) {
      continue;
    }
    if (e.points && e.points.length > 0) {
      continue;
    }
    const src = nodeById.get(e.start);
    const dst = nodeById.get(e.end);
    if (!src || !dst) {
      continue;
    }
    const dx = (dst.x ?? 0) - (src.x ?? 0);
    const dy = (dst.y ?? 0) - (src.y ?? 0);
    sideInfoByIdx.set(i, {
      edgeIdx: i,
      srcId: e.start,
      dstId: e.end,
      srcSide: determineSide(src, { x: dst.x ?? 0, y: dst.y ?? 0 }),
      dstSide: determineSide(dst, { x: src.x ?? 0, y: src.y ?? 0 }),
      absDx: Math.abs(dx),
      absDy: Math.abs(dy),
      dxSign: Math.sign(dx),
      dySign: Math.sign(dy),
    });
  }

  // ----- Step 6.2: sibling side-splitting (diss.pdf §6.1.2.2) ---------
  //
  // Paper-backed δ_s load-balancing rule: when two or more edges leave a
  // source node from the same side, reassign the ones with the *weaker*
  // preference-strength to their secondary side, naturally distributing
  // them across multiple sides of the node. Preference-strength combines
  // source and destination side-load (the paper sums δ_s over both
  // endpoints). With edge-id tiebreak for determinism when 3+ edges tie.
  //
  // Sequencing note (critical, per Algorithm Expert review): this pass
  // MUST run before the port-group build (6.3), anchor computation
  // (Step 7), and any later port-sensitive post-processing. Changing a side
  // later would corrupt E_{v,s} membership without updating downstream sort keys.
  //
  // "Preference strength" = the dy/dx ratio (for vertically-preferred
  // edges) or dx/dy ratio (for horizontally-preferred) — higher ratio
  // means more dominant in the current side's axis.
  const preferenceStrength = (info: EdgeSideInfo): number => {
    if (info.srcSide === 'top' || info.srcSide === 'bottom') {
      return info.absDx === 0 ? Infinity : info.absDy / info.absDx;
    }
    return info.absDy === 0 ? Infinity : info.absDx / info.absDy;
  };
  const secondarySide = (info: EdgeSideInfo): SideT => {
    if (info.srcSide === 'top' || info.srcSide === 'bottom') {
      return info.dxSign >= 0 ? 'right' : 'left';
    }
    return info.dySign >= 0 ? 'bottom' : 'top';
  };

  // Group by (src, srcSide) so we can detect 2+ edges sharing a side.
  const sourceSideGroups = new Map<string, EdgeSideInfo[]>();
  for (const info of sideInfoByIdx.values()) {
    const key = `${info.srcId}:${info.srcSide}`;
    if (!sourceSideGroups.has(key)) {
      sourceSideGroups.set(key, []);
    }
    sourceSideGroups.get(key)!.push(info);
  }

  // Running side-load counters for every (nodeId, side) to implement
  // δ_s. Bumped every time an edge is committed to a side as its src or
  // dst. The paper's rule compares (δ_src + δ_dst) across candidate
  // routes; we use this counter to tiebreak between primary and
  // secondary sides when the strength-sort leaves two candidates equally
  // attractive.
  const sideLoad = new Map<string, number>();
  const loadKey = (nodeId: string, side: SideT): string => `${nodeId}:${side}`;
  for (const info of sideInfoByIdx.values()) {
    sideLoad.set(
      loadKey(info.srcId, info.srcSide),
      (sideLoad.get(loadKey(info.srcId, info.srcSide)) ?? 0) + 1
    );
    sideLoad.set(
      loadKey(info.dstId, info.dstSide),
      (sideLoad.get(loadKey(info.dstId, info.dstSide)) ?? 0) + 1
    );
  }

  for (const group of sourceSideGroups.values()) {
    if (group.length < 2) {
      continue;
    }
    // Sort by preference strength DESCENDING — strongest first.
    // The strongest sibling keeps its preferred side; each subsequent
    // (weaker) sibling is considered for reassignment to its secondary
    // side. Tiebreak on edgeIdx for deterministic 3+-sibling cases.
    //
    // Paper-backed rationale (diss.pdf §6.1.2.2): when multiple edges
    // contend for the same side, preserving the strongest preference
    // minimizes the aggregate cost of deviation. The δ_s counter
    // breaks ties and prevents ping-ponging when secondary sides are
    // already loaded.
    group.sort((a, b) => {
      const sa = preferenceStrength(a);
      const sb = preferenceStrength(b);
      if (Math.abs(sa - sb) > 1e-9) {
        return sb - sa;
      }
      return a.edgeIdx - b.edgeIdx;
    });
    // Each sibling except the first (strongest) is considered for
    // reassignment to its secondary side, bumping δ_s counters as we go.
    for (let g = 1; g < group.length; g++) {
      const info = group[g];
      const secondary = secondarySide(info);
      const primaryLoad = sideLoad.get(loadKey(info.srcId, info.srcSide)) ?? 0;
      const secondaryLoad = sideLoad.get(loadKey(info.srcId, secondary)) ?? 0;
      // Only move to the secondary side if it's strictly less loaded
      // than the primary (avoids ping-ponging when both sides are
      // equally crowded — the paper's δ_s rule picks whichever sum is
      // smaller, and equal sums default to the original assignment).
      if (secondaryLoad >= primaryLoad) {
        continue;
      }
      // Update counters and the side assignment.
      sideLoad.set(loadKey(info.srcId, info.srcSide), primaryLoad - 1);
      sideLoad.set(loadKey(info.srcId, secondary), secondaryLoad + 1);
      info.srcSide = secondary;
    }
  }

  // ----- Step 6.2b: bimodal in/out de-collision for diamond nodes -----
  //
  // Paper backing: the BIMODAL drawing constraint (Eiglsperger, "Orthogonal
  // Graph Drawing with Constraints" §3.1): a vertex's incoming and outgoing
  // edges should occupy separate, non-intersecting intervals of its circular
  // edge order — in practice, distinct sides. Step 6.2 only load-balances
  // same-role siblings (multiple out-edges from one side), so an out-edge can
  // still land on the very side an in-edge already uses. On a diamond each
  // side collapses to a single pin at the vertex (6.3 gives diamonds only a
  // 0.3·side port span), so an in-edge and an out-edge sharing a side resolve
  // to the SAME pin — the detached-stub "shared projected port" defect
  // (validateLayout: edge-shared-projected-port). Move the out-edge to its
  // free secondary side to restore bimodality. Scoped to diamonds so
  // rectangles — whose long sides hold multiple distinct pins — are untouched.
  const isDiamondNode = (node: MermaidNode | undefined): boolean => {
    const shape = (node as { shape?: string } | undefined)?.shape;
    return shape === 'question' || shape === 'diamond';
  };
  const inSidesByNode = new Map<string, Set<SideT>>();
  for (const info of sideInfoByIdx.values()) {
    if (!inSidesByNode.has(info.dstId)) {
      inSidesByNode.set(info.dstId, new Set());
    }
    inSidesByNode.get(info.dstId)!.add(info.dstSide);
  }
  for (const info of sideInfoByIdx.values()) {
    if (!isDiamondNode(nodeById.get(info.srcId))) {
      continue;
    }
    const inSides = inSidesByNode.get(info.srcId);
    if (!inSides?.has(info.srcSide)) {
      continue; // no in-edge shares this out-edge's side → no bimodal clash
    }
    const secondary = secondarySide(info);
    // Only move to a side that no in-edge uses and that carries no committed
    // load — keeps the change surgical and never creates a new collision.
    if (inSides.has(secondary) || (sideLoad.get(loadKey(info.srcId, secondary)) ?? 0) > 0) {
      continue;
    }
    const primaryLoad = sideLoad.get(loadKey(info.srcId, info.srcSide)) ?? 0;
    sideLoad.set(loadKey(info.srcId, info.srcSide), Math.max(0, primaryLoad - 1));
    sideLoad.set(loadKey(info.srcId, secondary), 1);
    info.srcSide = secondary;
  }

  // ----- Step 6.3: port-group build (uses possibly-reassigned sides) --
  for (const info of sideInfoByIdx.values()) {
    const { edgeIdx: i, srcId, dstId, srcSide, dstSide } = info;
    const src = nodeById.get(srcId)!;
    const dst = nodeById.get(dstId)!;

    const srcKey = `${srcId}:${srcSide}:src`;
    const dstCoord = srcSide === 'top' || srcSide === 'bottom' ? (dst.x ?? 0) : (dst.y ?? 0);
    if (!portGroups.has(srcKey)) {
      portGroups.set(srcKey, []);
    }
    portGroups.get(srcKey)!.push({ edgeIdx: i, oppositeCoord: dstCoord });

    const dstKey = `${dstId}:${dstSide}:dst`;
    const srcCoord = dstSide === 'top' || dstSide === 'bottom' ? (src.x ?? 0) : (src.y ?? 0);
    if (!portGroups.has(dstKey)) {
      portGroups.set(dstKey, []);
    }
    portGroups.get(dstKey)!.push({ edgeIdx: i, oppositeCoord: srcCoord });
  }

  // Now compute port offsets for each group with 2+ edges
  // Key: "edgeIdx:src" or "edgeIdx:dst" → port offset from center
  const portOffsets = new Map<string, number>();
  const MIN_PORT_SPACING = 8; // minimum pixels between adjacent ports

  for (const [key, group] of portGroups) {
    if (group.length < 2) {
      continue;
    }
    // Sort by opposite coordinate (ascending)
    group.sort((a, b) => a.oppositeCoord - b.oppositeCoord);

    // Parse node ID and side from key
    const parts = key.split(':');
    const nodeId = parts.slice(0, -2).join(':'); // handle IDs with colons
    const side = parts[parts.length - 2];
    const role = parts[parts.length - 1]; // 'src' or 'dst'
    const node = nodeById.get(nodeId);
    if (!node) {
      continue;
    }

    // Determine available span along the side.
    // For diamond/rhombus shapes, the effective port area on pointy sides is
    // much smaller than the bounding box — use a fraction of the side length.
    const isVerticalSide = side === 'left' || side === 'right';
    const sideLength = isVerticalSide ? (node.height ?? 10) : (node.width ?? 10);
    const shape = (node as { shape?: string }).shape;
    const isDiamond = shape === 'question' || shape === 'diamond';
    const effectiveLength = isDiamond ? sideLength * 0.3 : sideLength;
    const MAX_PORT_SPACING = 20; // cap spacing to avoid large detours

    // Distribute ports evenly, clamped by MIN and MAX
    const spacing = Math.min(
      MAX_PORT_SPACING,
      Math.max(MIN_PORT_SPACING, effectiveLength / (group.length + 1))
    );
    const totalSpan = spacing * (group.length - 1);
    const startOffset = -totalSpan / 2;

    for (const [j, element] of group.entries()) {
      const offset = startOffset + j * spacing;
      const offsetKey = `${element.edgeIdx}:${role}`;
      portOffsets.set(offsetKey, offset);
    }
  }

  // Helper to apply port offset to a base center port
  const applyPortOffset = (
    basePort: Point,
    side: 'top' | 'bottom' | 'left' | 'right',
    offset: number
  ): Point => {
    if (side === 'top' || side === 'bottom') {
      // Offset along X axis
      return { x: basePort.x + offset, y: basePort.y };
    } else {
      // Offset along Y axis
      return { x: basePort.x, y: basePort.y + offset };
    }
  };

  const portsForEdge = (edgeIndex: number, src: MermaidNode, dst: MermaidNode) => {
    const sideInfo = sideInfoByIdx.get(edgeIndex);
    const srcTarget = { x: dst.x ?? 0, y: dst.y ?? 0 };
    const dstTarget = { x: src.x ?? 0, y: src.y ?? 0 };
    const srcSide = sideInfo?.srcSide ?? determineSide(src, srcTarget);
    const dstSide = sideInfo?.dstSide ?? determineSide(dst, dstTarget);
    let pSrcPort = sideInfo
      ? portForSide(src, sideInfo.srcSide)
      : getOrthogonalPort(src, srcTarget, true);
    let pDstPort = sideInfo
      ? portForSide(dst, sideInfo.dstSide)
      : getOrthogonalPort(dst, dstTarget, false);

    const srcOffset = portOffsets.get(`${edgeIndex}:src`);
    const dstOffset = portOffsets.get(`${edgeIndex}:dst`);
    if (srcOffset !== undefined) {
      pSrcPort = applyPortOffset(pSrcPort, srcSide, srcOffset);
    }
    if (dstOffset !== undefined) {
      pDstPort = applyPortOffset(pDstPort, dstSide, dstOffset);
    }
    return { pSrcPort, pDstPort, srcSide, dstSide };
  };

  for (const i of routingOrder) {
    const e = edges[i];
    edgeSegmentIndices[i] = [];

    if (!e.start || !e.end) {
      continue;
    }
    if (e.points && e.points.length > 0) {
      continue;
    }
    // Skip self-loops
    if (e.start === e.end) {
      continue;
    }

    const src = nodeById.get(e.start);
    const dst = nodeById.get(e.end);
    if (!src || !dst) {
      continue;
    }

    // 2. Compute Ports. Use the side assignment from Step 6.2 (sibling
    // side-split) so that a reassigned edge exits from its secondary
    // cardinal side instead of `getOrthogonalPort`'s natural choice.
    const {
      pSrcPort,
      pDstPort,
      srcSide: srcPortSide,
      dstSide: dstPortSide,
    } = portsForEdge(i, src, dst);

    // 3. Compute Anchors
    const pSrcAnchor: Point = { ...pSrcPort };
    const pDstAnchor: Point = { ...pDstPort };

    // Adjust anchors based on port direction
    // For orthogonal routing, anchors should extend in the same direction as the port
    // (i.e., if port is on bottom, anchor should be below the port)

    // Determine if ports are vertical (top/bottom) or horizontal (left/right).
    // Prefer the side from Step 6.2 so that a reassigned sibling gets its
    // anchor extended on the correct axis.
    const srcPortIsVertical = srcPortSide === 'top' || srcPortSide === 'bottom';
    const dstPortIsVertical = dstPortSide === 'top' || dstPortSide === 'bottom';

    // Source Anchor - extend from port in the appropriate direction
    if (srcPortIsVertical) {
      // Port is on top or bottom - extend vertically
      const isBottom = pSrcPort.y > (src.y ?? 0);
      pSrcAnchor.y = isBottom ? pSrcPort.y + ANCHOR_OFFSET : pSrcPort.y - ANCHOR_OFFSET;
    } else {
      // Port is on left or right - extend horizontally
      const isRight = pSrcPort.x > (src.x ?? 0);
      pSrcAnchor.x = isRight ? pSrcPort.x + ANCHOR_OFFSET : pSrcPort.x - ANCHOR_OFFSET;
    }

    // Target Anchor - extend from port in the appropriate direction
    if (dstPortIsVertical) {
      // Port is on top or bottom - extend vertically
      const isBottom = pDstPort.y > (dst.y ?? 0);
      pDstAnchor.y = isBottom ? pDstPort.y + ANCHOR_OFFSET : pDstPort.y - ANCHOR_OFFSET;
    } else {
      // Port is on left or right - extend horizontally
      const isRight = pDstPort.x > (dst.x ?? 0);
      pDstAnchor.x = isRight ? pDstPort.x + ANCHOR_OFFSET : pDstPort.x - ANCHOR_OFFSET;
    }

    // Helper to check if a point is inside any obstacle (excluding src/dst nodes)
    const isPointInObstacle = (
      pt: Point,
      excludeNodeIds: string[]
    ): { inside: boolean; obstacle?: (typeof obstacles)[0] } => {
      for (const obs of obstacles) {
        if (excludeNodeIds.includes(obs.nodeId)) {
          continue;
        }
        if (pt.x > obs.minX && pt.x < obs.maxX && pt.y > obs.minY && pt.y < obs.maxY) {
          return { inside: true, obstacle: obs };
        }
      }
      return { inside: false };
    };

    const obstacleDetour = (
      port: Point,
      node: MermaidNode,
      opposite: MermaidNode,
      obs: (typeof obstacles)[0],
      portIsVertical: boolean
    ): { x: number; y: number; leavesPositiveSide: boolean } => {
      if (portIsVertical) {
        const leavesPositiveSide = port.y > (node.y ?? 0);
        const goRight = (opposite.x ?? 0) >= port.x;
        return {
          x: goRight ? obs.maxX + HORIZONTAL_PIPE_MARGIN : obs.minX - HORIZONTAL_PIPE_MARGIN,
          y: leavesPositiveSide ? obs.maxY + VERTICAL_PIPE_MARGIN : obs.minY - VERTICAL_PIPE_MARGIN,
          leavesPositiveSide,
        };
      }

      const leavesPositiveSide = port.x > (node.x ?? 0);
      const goDown = (opposite.y ?? 0) >= port.y;
      return {
        x: leavesPositiveSide
          ? obs.maxX + HORIZONTAL_PIPE_MARGIN
          : obs.minX - HORIZONTAL_PIPE_MARGIN,
        y: goDown ? obs.maxY + VERTICAL_PIPE_MARGIN : obs.minY - VERTICAL_PIPE_MARGIN,
        leavesPositiveSide,
      };
    };

    // Push source anchor out if it's inside an obstacle
    // This happens when the node below the source is too close
    // When pushed, we also compute waypoints to route around the obstacle
    //
    // CRITICAL: The waypoints must be structured so that the FIRST point after the port
    // is in the orthogonal direction (same x for vertical port, same y for horizontal port).
    // This is because insertEdge calls tail.intersect(firstInnerPoint), and if firstInnerPoint
    // is not aligned orthogonally, it will produce a diagonal intersection instead of the
    // orthogonal port we computed.
    let srcHandleWaypoints: Point[] = [];
    const endpointIds = [e.start, e.end];
    const srcCheck = isPointInObstacle(pSrcAnchor, endpointIds);
    if (srcCheck.inside && srcCheck.obstacle) {
      const obs = srcCheck.obstacle;
      if (srcPortIsVertical) {
        // Vertical port (top/bottom) - need to route around the obstacle horizontally
        const detour = obstacleDetour(pSrcPort, src, dst, obs, true);

        pSrcAnchor.x = detour.x;
        pSrcAnchor.y = detour.y;

        // Strategy: go sideways FIRST to clear the obstacle's x-range, then go down.
        // But we need the FIRST point after port to be orthogonal for insertEdge.
        //
        // Compute a small orthogonal step in the gap between the source node and obstacle:
        // - For bottom port going down: step to just before the obstacle's top
        // - This creates an orthogonal segment that insertEdge will preserve
        const gapY = detour.leavesPositiveSide
          ? Math.min(obs.minY - 2, pSrcPort.y + ANCHOR_OFFSET) // Just before obstacle
          : Math.max(obs.maxY + 2, pSrcPort.y - ANCHOR_OFFSET); // Just after obstacle

        // Waypoints:
        // 1. Small orthogonal step (same X, slightly toward obstacle) - for insertEdge
        // 2. Horizontal detour to clear obstacle's X range
        // 3. Vertical to clearance Y (past obstacle)
        srcHandleWaypoints = [
          { x: pSrcPort.x, y: gapY }, // Orthogonal step in the gap
          { x: detour.x, y: gapY }, // Horizontal detour
          { x: detour.x, y: detour.y }, // Down past obstacle
        ];
      } else {
        // Horizontal port (left/right) - route around vertically
        const detour = obstacleDetour(pSrcPort, src, dst, obs, false);

        const gapX = detour.leavesPositiveSide
          ? Math.min(obs.minX - 2, pSrcPort.x + ANCHOR_OFFSET)
          : Math.max(obs.maxX + 2, pSrcPort.x - ANCHOR_OFFSET);

        pSrcAnchor.x = detour.x;
        pSrcAnchor.y = detour.y;

        srcHandleWaypoints = [
          { x: gapX, y: pSrcPort.y }, // Orthogonal step in the gap
          { x: gapX, y: detour.y }, // Vertical detour
          { x: detour.x, y: detour.y }, // Horizontal past obstacle
        ];
      }
    }

    // Push destination anchor out if it's inside an obstacle
    // Same logic as source: ensure orthogonal waypoints for proper intersection
    let dstHandleWaypoints: Point[] = [];
    const dstCheck = isPointInObstacle(pDstAnchor, endpointIds);
    if (dstCheck.inside && dstCheck.obstacle) {
      const obs = dstCheck.obstacle;
      if (dstPortIsVertical) {
        const detour = obstacleDetour(pDstPort, dst, src, obs, true);

        pDstAnchor.x = detour.x;
        pDstAnchor.y = detour.y;

        // Waypoints: from anchor -> sideways -> orthogonally to port
        // The LAST waypoint before port MUST have same X as port for orthogonal intersection
        dstHandleWaypoints = [
          { x: detour.x, y: detour.y }, // From anchor position
          { x: pDstPort.x, y: detour.y }, // Go sideways to port's X
          // Then orthogonally to port
        ];
      } else {
        const detour = obstacleDetour(pDstPort, dst, src, obs, false);

        pDstAnchor.x = detour.x;
        pDstAnchor.y = detour.y;

        dstHandleWaypoints = [
          { x: detour.x, y: detour.y }, // From anchor position
          { x: detour.x, y: pDstPort.y }, // Go vertically to port's Y
        ];
      }
    }

    // ----- Centered straight-line fast path (Kandinsky §2, diss.pdf 0fb2d84f) --
    //
    // When the two port sides face each other and the anchor-to-anchor
    // segment is already axis-aligned (both at the same x or the same y),
    // emit the straight port-to-port polyline directly if no foreign
    // obstacle blocks it. This realizes the Kandinsky centered-straight-
    // line invariant: *straight-line edges are centered at the
    // corresponding vertex side* — the ports already sit at the face
    // centers returned by `portForSide`, so there is nothing to compute.
    //
    // This generalized path captures the same optimisation for any edge
    // whose face-center ports are aligned, regardless of label semantics.
    //
    // Conditions:
    //   1. No obstacle-avoidance waypoints were injected (pSrcAnchor /
    //      pDstAnchor stayed at their face-center extensions).
    //   2. The anchors share one coordinate axis within the pipe margin.
    //   3. The edge is not part of a distributed port group (port offsets
    //      would shift the face-center port and break centering).
    //   4. No OTHER edge (either src-role or dst-role) is also attaching
    //      at (src.id, srcSide) or (dst.id, dstSide). If another edge
    //      shares the face, the face center is contested and we would
    //      collide at the exact same attach point — the normal pipe
    //      snap / track assignment flow spreads them via `allRoutedSegments`
    //      track coordinates, which the fast path bypasses. Counting
    //      BOTH roles catches the incoming-vs-outgoing collision (eH-I
    //      arrives at I.south while eI-K departs from I.south in knsv3).
    //   5. The port-to-port direct segment is obstacle-free.
    //
    // When these hold, set e.points directly and skip the rest of the
    // routing loop body. Phase 2/3 (track assignment, point emission)
    // both skip edges with empty `edgeSegmentIndices[i]`, so the
    // straight polyline survives unchanged to the final output.
    //
    // For aligned-column back-edges (e.g. L_J_E_0 in 7-car-sales-constr
    // where J and E share TB x=392), the transform maps the LR-straight
    // horizontal to a TB-straight vertical, and the final endpoint clip
    // pass in postProcessing.ts snaps each endpoint to the facing side
    // center (J.top-center, E.bottom-center) — resolving the
    // `edge-corner-connection` pathology where the prior 5-point U-detour
    // landed endpoints 0.67–3u from a node corner.
    if (srcHandleWaypoints.length === 0 && dstHandleWaypoints.length === 0) {
      const hpMargin = HORIZONTAL_PIPE_MARGIN;
      const anchorsSameX = Math.abs(pSrcAnchor.x - pDstAnchor.x) < hpMargin;
      const anchorsSameY = Math.abs(pSrcAnchor.y - pDstAnchor.y) < hpMargin;
      const hasPortOffset =
        portOffsets.get(`${i}:src`) !== undefined || portOffsets.get(`${i}:dst`) !== undefined;
      // Count total edges (any role) attaching at each facing side.
      // >1 means the face is contested — skip the fast path so the
      // normal track-assignment logic can spread attach points.
      const srcFaceTotal =
        (portGroups.get(`${e.start ?? ''}:${srcPortSide}:src`)?.length ?? 0) +
        (portGroups.get(`${e.start ?? ''}:${srcPortSide}:dst`)?.length ?? 0);
      const dstFaceTotal =
        (portGroups.get(`${e.end ?? ''}:${dstPortSide}:src`)?.length ?? 0) +
        (portGroups.get(`${e.end ?? ''}:${dstPortSide}:dst`)?.length ?? 0);
      const faceContested = srcFaceTotal > 1 || dstFaceTotal > 1;
      if ((anchorsSameX || anchorsSameY) && !hasPortOffset && !faceContested) {
        const directBlocked = isSegmentBlocked(pSrcPort, pDstPort, e.start, e.end);
        if (!directBlocked) {
          // Emit the canonical `port → anchor → anchor → port` 4-point
          // shape. Because all four points are collinear along the
          // shared axis, postProcessing.ts's `simplifyPolyline` collapses it
          // to a clean 2-point straight line downstream, and the
          // endpoint-clip pass snaps the port endpoints onto the
          // facing node side centers. Keeping the 4-point form here
          // preserves the long-standing raykov contract that a
          // straight-line edge's `e.points` includes the anchor
          // extensions, which several unit tests pin.
          e.points = [{ ...pSrcPort }, { ...pSrcAnchor }, { ...pDstAnchor }, { ...pDstPort }];
          straightIntraLaneEdges.add(i);
          // Register the fast-path's full port→port line as a routed
          // segment so later A* searches can see it via crossingPenalty.
          // Without this, iter 8's fast path is invisible to the
          // CROSSING_PENALTY check in the A* loop and later intra-lane
          // detours (e.g. L_D_E_0 detouring around a shared-column node)
          // pick crossings they should be able to avoid. We intentionally
          // do NOT add this index to edgeSegmentIndices[i] — phase 2/3
          // track-assignment must keep skipping fast-path edges so their
          // centered straight shape is preserved.
          const fastPathOrientation: Orientation = anchorsSameY ? 'horizontal' : 'vertical';
          const fastPathCoord = anchorsSameY ? pSrcPort.y : pSrcPort.x;
          const fastPathFrom = anchorsSameY
            ? Math.min(pSrcPort.x, pDstPort.x)
            : Math.min(pSrcPort.y, pDstPort.y);
          const fastPathTo = anchorsSameY
            ? Math.max(pSrcPort.x, pDstPort.x)
            : Math.max(pSrcPort.y, pDstPort.y);
          const fastPathPipe: Pipe = {
            id: `fast-path-${fastPathOrientation}-${fastPathCoord.toFixed(0)}-${i}`,
            orientation: fastPathOrientation,
            coord: fastPathCoord,
            spanMin: fastPathFrom,
            spanMax: fastPathTo,
            tracks: [],
          };
          allRoutedSegments.push({
            edgeIndex: i,
            segmentIndex: 0,
            orientation: fastPathOrientation,
            pipe: fastPathPipe,
            trackIndex: 0,
            from: fastPathFrom,
            to: fastPathTo,
          });
          continue;
        }
      }
    }

    // Snap anchors to nearest pipe (create lazily).
    const srcPipe = getOrAddPipe('vertical', pSrcAnchor.x, pSrcAnchor.y, pSrcAnchor.y);
    pSrcAnchor.x = srcPipe.coord;
    const dstPipe = getOrAddPipe('vertical', pDstAnchor.x, pDstAnchor.y, pDstAnchor.y);
    pDstAnchor.x = dstPipe.coord;

    // 4. Build Visibility Graph & Pathfinding
    // Bounding box - start with anchor points
    let bbMinX = Math.min(pSrcAnchor.x, pDstAnchor.x) - 50;
    let bbMaxX = Math.max(pSrcAnchor.x, pDstAnchor.x) + 50;
    let bbMinY = Math.min(pSrcAnchor.y, pDstAnchor.y) - 50;
    let bbMaxY = Math.max(pSrcAnchor.y, pDstAnchor.y) + 50;

    // Expand bounding box to include detour routes around any obstacles that block the direct path
    for (const obs of obstacles) {
      // Check if obstacle is in the way (overlaps with the direct path corridor)
      const pathMinX = Math.min(pSrcAnchor.x, pDstAnchor.x);
      const pathMaxX = Math.max(pSrcAnchor.x, pDstAnchor.x);
      const pathMinY = Math.min(pSrcAnchor.y, pDstAnchor.y);
      const pathMaxY = Math.max(pSrcAnchor.y, pDstAnchor.y);

      const obsBlocksPath =
        obs.minX < pathMaxX && obs.maxX > pathMinX && obs.minY < pathMaxY && obs.maxY > pathMinY;

      if (obsBlocksPath) {
        // Expand bbox to include space for routing around this obstacle
        bbMinX = Math.min(bbMinX, obs.minX - ROUTING_MARGIN);
        bbMaxX = Math.max(bbMaxX, obs.maxX + ROUTING_MARGIN);
        bbMinY = Math.min(bbMinY, obs.minY - ROUTING_MARGIN);
        bbMaxY = Math.max(bbMaxY, obs.maxY + ROUTING_MARGIN);
      }
    }

    // Add pipe grid lines around obstacles
    for (const obs of obstacles) {
      // Check if obstacle is relevant to this edge's bounding box
      if (obs.maxX < bbMinX || obs.minX > bbMaxX || obs.maxY < bbMinY || obs.minY > bbMaxY) {
        continue;
      }
      // Add horizontal pipes around obstacle - ONLY at safe zone positions (with margins)
      // Do NOT create pipes at exact boundaries - that allows edges to hug nodes
      const hMargin = HORIZONTAL_PIPE_MARGIN;
      getOrAddPipe('horizontal', obs.minY - hMargin, bbMinX, bbMaxX); // Above obstacle (safe zone)
      getOrAddPipe('horizontal', obs.maxY + hMargin, bbMinX, bbMaxX); // Below obstacle (safe zone)

      // Add vertical pipes around obstacle - ONLY at safe zone positions (with margins)
      const vMargin = VERTICAL_PIPE_MARGIN;
      getOrAddPipe('vertical', obs.minX - vMargin, bbMinY, bbMaxY); // Left of obstacle (safe zone)
      getOrAddPipe('vertical', obs.maxX + vMargin, bbMinY, bbMaxY); // Right of obstacle (safe zone)
    }

    // Ensure start/end horizontal pipes exist
    getOrAddPipe('horizontal', pSrcAnchor.y, bbMinX, bbMaxX);
    getOrAddPipe('horizontal', pDstAnchor.y, bbMinX, bbMaxX);

    // Collect relevant pipes
    const hPipes = pipes.filter(
      (p) => p.orientation === 'horizontal' && p.coord >= bbMinY && p.coord <= bbMaxY
    );
    const vPipes = pipes.filter(
      (p) => p.orientation === 'vertical' && p.coord >= bbMinX && p.coord <= bbMaxX
    );

    // Vertices: All intersections of hPipes and vPipes
    // We run A* on these vertices.

    const getKey = (x: number, y: number) => `${x.toFixed(1)},${y.toFixed(1)}`;
    const startKey = getKey(pSrcAnchor.x, pSrcAnchor.y);
    const endKey = getKey(pDstAnchor.x, pDstAnchor.y);

    // A* Data Structures
    const gScore = new Map<string, number>();
    const cameFrom = new Map<string, Point>();
    // Track the direction we arrived at each node from: 'h' = horizontal, 'v' = vertical, 'n' = start (none)
    const arrivalDir = new Map<string, 'h' | 'v' | 'n'>();
    const openSet = new Set<string>();
    const openList: { key: string; f: number; pt: Point }[] = [];

    gScore.set(startKey, 0);
    arrivalDir.set(startKey, 'n'); // start has no arrival direction
    openList.push({
      key: startKey,
      f: Math.hypot(pDstAnchor.x - pSrcAnchor.x, pDstAnchor.y - pSrcAnchor.y),
      pt: pSrcAnchor,
    });
    openSet.add(startKey);

    let foundPath: Point[] = [];

    // Helper to check if a segment is blocked for this edge (excluding src/dst)
    const checkSegmentBlocked = (p1: Point, p2: Point): boolean => {
      return isSegmentBlocked(p1, p2, e.start, e.end);
    };

    // Try direct L-shaped paths first (much simpler than A*)
    // Option 1: Go horizontal first, then vertical
    const cornerHV: Point = { x: pDstAnchor.x, y: pSrcAnchor.y };
    const seg1HV_blocked = checkSegmentBlocked(pSrcAnchor, cornerHV);
    const seg2HV_blocked = checkSegmentBlocked(cornerHV, pDstAnchor);
    const pathHV_blocked = seg1HV_blocked || seg2HV_blocked;

    // Option 2: Go vertical first, then horizontal
    const cornerVH: Point = { x: pSrcAnchor.x, y: pDstAnchor.y };
    const seg1VH_blocked = checkSegmentBlocked(pSrcAnchor, cornerVH);
    const seg2VH_blocked = checkSegmentBlocked(cornerVH, pDstAnchor);
    const pathVH_blocked = seg1VH_blocked || seg2VH_blocked;

    if (!pathHV_blocked) {
      // Use horizontal-first L-path
      if (
        Math.abs(pSrcAnchor.y - pDstAnchor.y) < EPS ||
        Math.abs(pSrcAnchor.x - pDstAnchor.x) < EPS
      ) {
        // Same Y or same X - straight line (corner would be a duplicate point)
        foundPath = [pSrcAnchor, pDstAnchor];
      } else {
        foundPath = [pSrcAnchor, cornerHV, pDstAnchor];
      }
    } else if (!pathVH_blocked) {
      // Use vertical-first L-path
      if (Math.abs(pSrcAnchor.x - pDstAnchor.x) < EPS) {
        // Same X - straight vertical line
        foundPath = [pSrcAnchor, pDstAnchor];
      } else {
        foundPath = [pSrcAnchor, cornerVH, pDstAnchor];
      }
    }

    // If no direct path found, use A* (existing logic)
    if (foundPath.length === 0) {
      while (openList.length > 0) {
        openList.sort((a, b) => a.f - b.f);
        const current = openList.shift()!;
        openSet.delete(current.key);

        if (current.key === endKey) {
          // Reconstruct path
          let currKey = endKey;
          let currPt = pDstAnchor;
          foundPath = [currPt];
          while (cameFrom.has(currKey)) {
            const prev = cameFrom.get(currKey)!;
            foundPath.unshift(prev);
            currPt = prev;
            currKey = getKey(prev.x, prev.y);
          }
          break;
        }

        // Neighbors: move along current horizontal pipe or current vertical pipe
        const cx = current.pt.x;
        const cy = current.pt.y;

        // Find adjacent vPipes to cx
        const sortedVPipes = vPipes.sort((a, b) => a.coord - b.coord);
        const vIdx = sortedVPipes.findIndex((p) => Math.abs(p.coord - cx) < 1);

        const hPipesSorted = hPipes.sort((a, b) => a.coord - b.coord);
        const hIdx = hPipesSorted.findIndex((p) => Math.abs(p.coord - cy) < 1);

        const neighbors: Point[] = [];

        // Add horizontal neighbors (along hPipe at cy)
        if (vIdx > 0) {
          neighbors.push({ x: sortedVPipes[vIdx - 1].coord, y: cy });
        }
        if (vIdx >= 0 && vIdx < sortedVPipes.length - 1) {
          neighbors.push({ x: sortedVPipes[vIdx + 1].coord, y: cy });
        }

        // Add vertical neighbors (along vPipe at cx)
        if (hIdx > 0) {
          neighbors.push({ x: cx, y: hPipesSorted[hIdx - 1].coord });
        }
        if (hIdx >= 0 && hIdx < hPipesSorted.length - 1) {
          neighbors.push({ x: cx, y: hPipesSorted[hIdx + 1].coord });
        }

        for (const neighbor of neighbors) {
          // Check obstacles - exclude source and destination nodes so edge can reach them
          const minX = Math.min(cx, neighbor.x);
          const maxX = Math.max(cx, neighbor.x);
          const minY = Math.min(cy, neighbor.y);
          const maxY = Math.max(cy, neighbor.y);

          const blocked = obstacles.some((obs) => {
            // Don't block on source or destination nodes - the edge needs to reach them
            if (obs.nodeId === e.start || obs.nodeId === e.end) {
              return false;
            }
            if (minX !== maxX) {
              // Horizontal
              return obs.minY < cy && obs.maxY > cy && obs.maxX > minX && obs.minX < maxX;
            } else {
              // Vertical
              return obs.minX < cx && obs.maxX > cx && obs.maxY > minY && obs.minY < maxY;
            }
          });

          if (blocked) {
            continue;
          }

          const nKey = getKey(neighbor.x, neighbor.y);
          const dist = Math.abs(neighbor.x - cx) + Math.abs(neighbor.y - cy);
          const penalty = crossingPenalty(i, current.pt, neighbor);

          // Directional penalty: STRONGLY discourage going OPPOSITE to the destination direction
          // This prevents paths that go UP when destination is below, etc.
          let dirPenalty = 0;
          const destDx = pDstAnchor.x - pSrcAnchor.x;
          const destDy = pDstAnchor.y - pSrcAnchor.y;
          const moveDx = neighbor.x - cx;
          const moveDy = neighbor.y - cy;

          // If destination is below (destDy > 0) and we're moving up (moveDy < 0), penalize HEAVILY
          // If destination is above (destDy < 0) and we're moving down (moveDy > 0), penalize HEAVILY
          // Penalty must be higher than crossing penalty (typically 1000 per crossing) to prevent
          // A* from preferring wrong-direction paths that avoid crossings
          if ((destDy > 10 && moveDy < -5) || (destDy < -10 && moveDy > 5)) {
            dirPenalty = Math.abs(moveDy) * 100; // VERY strong penalty - must exceed crossing penalties
          }
          // Similarly for horizontal
          if ((destDx > 10 && moveDx < -5) || (destDx < -10 && moveDx > 5)) {
            dirPenalty += Math.abs(moveDx) * 50; // Strong penalty for going wrong horizontal direction
          }

          // Bend penalty: penalize direction changes to prefer straighter paths with fewer bends
          // This helps produce cleaner routes that don't zig-zag unnecessarily
          let bendPenalty = 0;
          const currentDir = arrivalDir.get(current.key) ?? 'n';
          const moveDir: 'h' | 'v' = Math.abs(moveDx) > EPS ? 'h' : 'v';
          // If we're changing direction (and not at start), add a penalty
          if (currentDir !== 'n' && currentDir !== moveDir) {
            bendPenalty = 50; // Moderate penalty for each bend/turn
          }

          const stepCost = dist + penalty + dirPenalty + bendPenalty;
          const tentativeG = (gScore.get(current.key) ?? Infinity) + stepCost;
          const h = Math.abs(pDstAnchor.x - neighbor.x) + Math.abs(pDstAnchor.y - neighbor.y);

          if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
            cameFrom.set(nKey, current.pt);
            gScore.set(nKey, tentativeG);
            arrivalDir.set(nKey, moveDir); // Track how we arrived at this node
            if (!openSet.has(nKey)) {
              openList.push({ key: nKey, f: tentativeG + h, pt: neighbor });
              openSet.add(nKey);
            } else {
              const idx = openList.findIndex((x) => x.key === nKey);
              if (idx !== -1) {
                openList[idx].f = tentativeG + h;
              }
            }
          }
        }
      }
    } // end if (foundPath.length === 0) - A* block

    if (foundPath.length === 0) {
      foundPath = [pSrcAnchor, { x: pSrcAnchor.x, y: pDstAnchor.y }, pDstAnchor];
    }

    // Path simplification: Find the minimum x-extent and y-extent needed to route around obstacles
    // Then reconstruct the path using only those extents

    if (foundPath.length > 4) {
      const start = foundPath[0];
      const end = foundPath[foundPath.length - 1];

      // Find the extreme x and y values in the path (excluding start/end)
      // These represent how far we had to go to clear obstacles
      let minX = Math.min(start.x, end.x);
      let maxX = Math.max(start.x, end.x);
      let minY = Math.min(start.y, end.y);
      let maxY = Math.max(start.y, end.y);

      for (const pt of foundPath) {
        minX = Math.min(minX, pt.x);
        maxX = Math.max(maxX, pt.x);
        minY = Math.min(minY, pt.y);
        maxY = Math.max(maxY, pt.y);
      }

      // Determine if we need to route left or right (or both)
      const wentRight = maxX > Math.max(start.x, end.x);
      const wentLeft = minX < Math.min(start.x, end.x);

      // For LR direction: recalculate detour X using visual extent
      // TB x becomes LR y after transform, so the visual extent should be based on height, not width
      if (isLR) {
        const margin = VERTICAL_PIPE_MARGIN;
        // Find obstacles that block the direct vertical path (caused us to detour)
        // An obstacle blocks the path if its x-range contains the path's x and its y-range overlaps with the path's y-range
        if (wentRight) {
          const pathX = Math.max(start.x, end.x);
          const pathMinY = Math.min(start.y, end.y);
          const pathMaxY = Math.max(start.y, end.y);
          const detourObstacles = obstacles.filter(
            (obs) =>
              obs.minX < pathX &&
              obs.maxX > pathX && // obstacle's x-range contains the path x
              obs.minY < pathMaxY &&
              obs.maxY > pathMinY // obstacle's y-range overlaps with path y-range
          );
          if (detourObstacles.length > 0) {
            // Find the obstacle that needs the maximum detour based on visual extent
            let visualMaxX = Math.max(start.x, end.x);
            for (const obs of detourObstacles) {
              const obsCenterX = (obs.minX + obs.maxX) / 2;
              // Skip obstacles without valid visualXHalfExtent (e.g., edge labels added later)
              if (obs.visualXHalfExtent === undefined || isNaN(obs.visualXHalfExtent)) {
                continue;
              }
              const visualRight = obsCenterX + obs.visualXHalfExtent + margin;
              visualMaxX = Math.max(visualMaxX, visualRight);
            }

            // Use visual maxX - this may be smaller than the original maxX
            // because we want to route closer to obstacles based on their visual extent (height in LR mode)
            if (!isNaN(visualMaxX)) {
              maxX = visualMaxX;
            }
          }
        }
        // Find obstacles that caused the left detour
        if (wentLeft) {
          const detourObstacles = obstacles.filter(
            (obs) =>
              obs.minX < Math.min(start.x, end.x) + margin && // obstacle extends past the direct path
              obs.minY < Math.max(start.y, end.y) &&
              obs.maxY > Math.min(start.y, end.y) // obstacle is in Y range
          );
          if (detourObstacles.length > 0) {
            // Find the obstacle that needs the minimum detour based on visual extent
            let visualMinX = Math.min(start.x, end.x);
            for (const obs of detourObstacles) {
              const obsCenterX = (obs.minX + obs.maxX) / 2;
              const visualLeft = obsCenterX - obs.visualXHalfExtent - margin;
              visualMinX = Math.min(visualMinX, visualLeft);
            }
            minX = visualMinX;
          }
        }
      }

      // Find the best Y for the horizontal return segment (closest to obstacles, not destination)
      // This creates cleaner routing that hugs obstacles instead of going all the way to destination
      const findBestReturnY = (detourX: number): number => {
        const goingDown = end.y > start.y;
        // Find obstacles that we're routing around (between start and end, blocking direct path)
        const relevantObs = obstacles.filter((obs) => {
          const obsInXRange =
            Math.min(start.x, end.x) < obs.maxX && Math.max(start.x, end.x) > obs.minX;
          const obsInYRange =
            Math.min(start.y, end.y) < obs.maxY && Math.max(start.y, end.y) > obs.minY;
          return obsInXRange && obsInYRange;
        });

        // For LR we care most about obstacles that actually intersect the chosen detour
        // column (detourX). Obstacles that are between start/end but off to the side
        // should not force the detour to go unnecessarily deep vertically.
        let filteredObs = relevantObs;
        if (isLR && relevantObs.length > 0) {
          const obsAtDetourX = relevantObs.filter(
            (obs) => obs.minX < detourX && obs.maxX > detourX
          );
          if (obsAtDetourX.length > 0) {
            filteredObs = obsAtDetourX;
          }
        }

        if (filteredObs.length === 0) {
          return end.y;
        }

        // Find the obstacle edge closest to destination in the direction we're going
        const margin = HORIZONTAL_PIPE_MARGIN;
        if (goingDown) {
          // Going down: find the bottom of the lowest obstacle we need to clear
          const lowestObsBottom = Math.max(...filteredObs.map((obs) => obs.maxY));
          const bestY = lowestObsBottom + margin;
          // Only use if it's closer than end.y and doesn't overshoot
          if (bestY < end.y - EPS) {
            return bestY;
          }
        } else {
          // Going up: find the top of the highest obstacle we need to clear
          const highestObsTop = Math.min(...filteredObs.map((obs) => obs.minY));
          const bestY = highestObsTop - margin;
          // Only use if it's closer than end.y and doesn't overshoot
          if (bestY > end.y + EPS) {
            return bestY;
          }
        }
        return end.y;
      };

      // Try to construct a minimal path using only the extreme coordinates
      // For a U-shaped detour going right: start -> (maxX, start.y) -> (maxX, bestY) -> (end.x, bestY) -> end
      // For a U-shaped detour going left: start -> (minX, start.y) -> (minX, bestY) -> (end.x, bestY) -> end
      const trySimplifyWithDetourX = (detourX: number): Point[] | null => {
        const bestY = findBestReturnY(detourX);
        const corner1: Point = { x: detourX, y: start.y };
        const corner2: Point = { x: detourX, y: bestY };
        const corner3: Point = { x: end.x, y: bestY };
        const seg1Blocked = checkSegmentBlocked(start, corner1);
        const seg2Blocked = checkSegmentBlocked(corner1, corner2);
        const seg3Blocked = checkSegmentBlocked(corner2, corner3);
        const seg4Blocked = bestY !== end.y ? checkSegmentBlocked(corner3, end) : false;

        if (!seg1Blocked && !seg2Blocked && !seg3Blocked && !seg4Blocked) {
          if (Math.abs(bestY - end.y) < EPS) {
            return [start, corner1, corner2, end];
          }
          return [start, corner1, corner2, corner3, end];
        }
        return null;
      };

      const simplified =
        wentRight && !wentLeft
          ? trySimplifyWithDetourX(maxX)
          : wentLeft && !wentRight
            ? trySimplifyWithDetourX(minX)
            : null;

      if (simplified) {
        foundPath = simplified;
      }
    }

    // 5. Collapse collinear and generate segments
    // Include handle waypoints for routing around obstacles at source/destination
    const fullPoints = [
      pSrcPort,
      ...srcHandleWaypoints,
      ...foundPath,
      ...dstHandleWaypoints.reverse(), // Reverse because they're stored anchor->waypoint->port
      pDstPort,
    ];

    // Post-process: Remove "hooks" or "overshoots" at the end
    // If the path goes A -> B -> C, and A-B-C are collinear, and B is "beyond" C, truncate B.
    // This happens if pDstAnchor (B) is on the node boundary but pDstPort (C) is slightly outside (margin).
    if (fullPoints.length >= 3) {
      const C = fullPoints[fullPoints.length - 1];
      const B = fullPoints[fullPoints.length - 2];
      const A = fullPoints[fullPoints.length - 3];

      // Check collinearity (Horizontal or Vertical)
      const isHoriz = Math.abs(A.y - B.y) < EPS && Math.abs(B.y - C.y) < EPS;
      const isVert = Math.abs(A.x - B.x) < EPS && Math.abs(B.x - C.x) < EPS;

      if (isHoriz) {
        // Check if C is between A and B (i.e., B overshot C)
        // dist(A, B) > dist(A, C) and direction is same?
        // Or simply: B is further from A than C is, in the same direction.
        // Signs: (B-A) and (C-A) have same sign. |B-A| > |C-A|.
        const signAB = Math.sign(B.x - A.x);
        const signAC = Math.sign(C.x - A.x);
        if (signAB !== 0 && signAB === signAC && Math.abs(B.x - A.x) > Math.abs(C.x - A.x)) {
          // B is an overshoot. Remove B.
          // fullPoints = [..., A, C]
          fullPoints.splice(-2, 1);
        }
      } else if (isVert) {
        const signAB = Math.sign(B.y - A.y);
        const signAC = Math.sign(C.y - A.y);
        if (signAB !== 0 && signAB === signAC && Math.abs(B.y - A.y) > Math.abs(C.y - A.y)) {
          fullPoints.splice(-2, 1);
        }
      }
    }

    const simplified: Point[] = [fullPoints[0]];
    for (let k = 1; k < fullPoints.length - 1; k++) {
      // Preserve the Anchor point (k=1) to satisfy strict testing requirements expecting 4 points for Z/U shapes
      if (k === 1) {
        simplified.push(fullPoints[k]);
        continue;
      }
      const prev = simplified[simplified.length - 1];
      const curr = fullPoints[k];
      const next = fullPoints[k + 1];

      // Check collinearity carefully - direction matters?
      // If direction reverses, we should NOT skip.
      // Horizontal: y is same.
      if (Math.abs(prev.y - curr.y) < EPS && Math.abs(curr.y - next.y) < EPS) {
        // Check direction reversal
        const dir1 = curr.x > prev.x;
        const dir2 = next.x > curr.x;
        if (dir1 !== dir2) {
          simplified.push(curr);
          continue;
        }
        // Same direction, can skip
        continue;
      }
      // Vertical: x is same
      if (Math.abs(prev.x - curr.x) < EPS && Math.abs(curr.x - next.x) < EPS) {
        const dir1 = curr.y > prev.y;
        const dir2 = next.y > curr.y;
        if (dir1 !== dir2) {
          simplified.push(curr);
          continue;
        }
        continue;
      }

      simplified.push(curr);
    }
    simplified.push(fullPoints[fullPoints.length - 1]);

    // Create Segments
    for (let k = 0; k < simplified.length - 1; k++) {
      const p1 = simplified[k];
      const p2 = simplified[k + 1];
      const orientation: Orientation = Math.abs(p1.x - p2.x) < EPS ? 'vertical' : 'horizontal';
      const coord = orientation === 'vertical' ? p1.x : p1.y;
      const from = orientation === 'vertical' ? Math.min(p1.y, p2.y) : Math.min(p1.x, p2.x);
      const to = orientation === 'vertical' ? Math.max(p1.y, p2.y) : Math.max(p1.x, p2.x);

      const pipe = getOrAddPipe(orientation, coord, from, to);

      const rSeg: RoutedSegment = {
        edgeIndex: i,
        segmentIndex: k,
        orientation,
        pipe,
        trackIndex: 0, // Initial track
        from,
        to,
      };

      allRoutedSegments.push(rSeg);
      edgeSegmentIndices[i].push(allRoutedSegments.length - 1);

      if (!pipe.tracks[0]) {
        pipe.tracks[0] = { index: 0, coord: pipe.coord, segments: [] };
      }
      pipe.tracks[0].segments.push({
        edgeIndex: i,
        segmentIndex: k,
        from,
        to,
      });
    }
  }

  // -----------------------------------------------------------------------
  // Phase 2: Crossing Reduction
  // -----------------------------------------------------------------------

  const segmentsOverlap = (s1: { from: number; to: number }, s2: { from: number; to: number }) => {
    // Overlap if intervals intersect.
    // [a, b] and [c, d] overlap if a < d and c < b.
    // from/to are sorted (min/max).
    return s1.from < s2.to && s2.from < s1.to;
  };

  const trySwapSegmentsAcrossTracks = (
    s1: RoutedSegment,
    s2: RoutedSegment,
    t1: Track,
    t2: Track
  ): boolean => {
    const canS1GoT2 = !t2.segments.some(
      (r) =>
        (r.edgeIndex !== s2.edgeIndex || r.segmentIndex !== s2.segmentIndex) &&
        segmentsOverlap(r, s1)
    );
    const canS2GoT1 = !t1.segments.some(
      (r) =>
        (r.edgeIndex !== s1.edgeIndex || r.segmentIndex !== s1.segmentIndex) &&
        segmentsOverlap(r, s2)
    );

    if (canS1GoT2 && canS2GoT1) {
      s1.trackIndex = t2.index;
      s2.trackIndex = t1.index;
      t1.segments = [
        ...t1.segments.filter(
          (r) => r.edgeIndex !== s1.edgeIndex || r.segmentIndex !== s1.segmentIndex
        ),
        {
          edgeIndex: s2.edgeIndex,
          segmentIndex: s2.segmentIndex,
          from: s2.from,
          to: s2.to,
        },
      ];
      t2.segments = [
        ...t2.segments.filter(
          (r) => r.edgeIndex !== s2.edgeIndex || r.segmentIndex !== s2.segmentIndex
        ),
        {
          edgeIndex: s1.edgeIndex,
          segmentIndex: s1.segmentIndex,
          from: s1.from,
          to: s1.to,
        },
      ];
      return true;
    }
    return false;
  };

  const createNewTrack = (pipe: Pipe): number => {
    const idx = pipe.tracks.length;
    pipe.tracks[idx] = { index: idx, coord: pipe.coord, segments: [] };
    return idx;
  };

  const moveSegmentToTrack = (seg: RoutedSegment, trackIdx: number) => {
    const oldTrack = seg.pipe.tracks[seg.trackIndex];
    oldTrack.segments = oldTrack.segments.filter(
      (r) => r.edgeIndex !== seg.edgeIndex || r.segmentIndex !== seg.segmentIndex
    );
    seg.trackIndex = trackIdx;
    const newTrack = seg.pipe.tracks[trackIdx];
    newTrack.segments.push({
      edgeIndex: seg.edgeIndex,
      segmentIndex: seg.segmentIndex,
      from: seg.from,
      to: seg.to,
    });
  };

  const moveSegmentChainToTrack = (seg: RoutedSegment, trackIdx: number) => {
    // Move ALL segments of this edge that are on the same pipe, not just consecutive ones
    const indices = edgeSegmentIndices[seg.edgeIndex];
    for (const idx of indices) {
      const s = allRoutedSegments[idx];
      if (s.pipe === seg.pipe) {
        moveSegmentToTrack(s, trackIdx);
      }
    }
  };

  const getAdjacentSegmentsAlongEdge = (seg: RoutedSegment) => {
    const indices = edgeSegmentIndices[seg.edgeIndex];
    const idxInList = indices.indexOf(allRoutedSegments.indexOf(seg));
    const adj: RoutedSegment[] = [];
    if (idxInList > 0) {
      adj.push(allRoutedSegments[indices[idxInList - 1]]);
    }
    if (idxInList < indices.length - 1) {
      adj.push(allRoutedSegments[indices[idxInList + 1]]);
    }
    return adj;
  };

  const haveAnyCrossing = (segA: RoutedSegment, segB: RoutedSegment) => {
    if (segA.orientation === segB.orientation) {
      return false;
    }
    const h = segA.orientation === 'horizontal' ? segA : segB;
    const v = segA.orientation === 'horizontal' ? segB : segA;
    return (
      v.pipe.coord > h.from && v.pipe.coord < h.to && h.pipe.coord > v.from && h.pipe.coord < v.to
    );
  };

  const findAvailableTrack = (pipe: Pipe, seg: RoutedSegment): number => {
    for (const track of pipe.tracks) {
      const overlap = track.segments.some(
        (r) =>
          (r.edgeIndex !== seg.edgeIndex || r.segmentIndex !== seg.segmentIndex) &&
          segmentsOverlap(r, seg)
      );
      if (!overlap) {
        return track.index;
      }
    }
    return -1;
  };

  const segmentsConflict = (s1: RoutedSegment, s2: RoutedSegment): boolean => {
    if (s1.trackIndex === s2.trackIndex) {
      return segmentsOverlap(s1, s2);
    }

    const adj1 = getAdjacentSegmentsAlongEdge(s1);
    const adj2 = getAdjacentSegmentsAlongEdge(s2);
    return adj1.some((a1) => adj2.some((a2) => haveAnyCrossing(a1, a2)));
  };

  const resolveTrackConflict = (
    s1: RoutedSegment,
    s2: RoutedSegment,
    move: (seg: RoutedSegment, trackIdx: number) => void
  ) => {
    if (
      trySwapSegmentsAcrossTracks(
        s1,
        s2,
        s1.pipe.tracks[s1.trackIndex],
        s2.pipe.tracks[s2.trackIndex]
      )
    ) {
      return;
    }

    const avail = findAvailableTrack(s1.pipe, s2);
    move(s2, avail !== -1 ? avail : createNewTrack(s1.pipe));
  };

  const resolveHandleConflicts = (handles: RoutedSegment[]): number => {
    let crossings = 0;
    for (let i = 0; i < handles.length; i++) {
      for (let j = i + 1; j < handles.length; j++) {
        const h1 = handles[i];
        const h2 = handles[j];
        if (h1.pipe !== h2.pipe) {
          continue;
        }

        if (segmentsConflict(h1, h2)) {
          crossings++;
          resolveTrackConflict(h1, h2, moveSegmentChainToTrack);
        }
      }
    }
    return crossings;
  };

  interface DestInfo {
    dest: number;
    deviation: number;
    base: number;
    delta: number;
  }
  const destInfoCache = new Map<number, DestInfo>();
  const getDestInfo = (edgeIdx: number): DestInfo => {
    if (destInfoCache.has(edgeIdx)) {
      return destInfoCache.get(edgeIdx)!;
    }
    const indices = edgeSegmentIndices[edgeIdx];
    if (indices.length === 0) {
      const info = { dest: 0, deviation: 0, base: 0, delta: 0 };
      destInfoCache.set(edgeIdx, info);
      return info;
    }
    const firstSeg = allRoutedSegments[indices[0]];
    const base = firstSeg.pipe.coord;
    let dest = base;
    for (let idx = 1; idx < indices.length; idx++) {
      const seg = allRoutedSegments[indices[idx]];
      if (seg.orientation === 'horizontal') {
        const candidateA = seg.from;
        const candidateB = seg.to;
        dest = Math.abs(candidateA - base) > Math.abs(candidateB - base) ? candidateA : candidateB;
        break;
      }
    }
    const deviation = Math.abs(dest - base);
    const info = { dest, deviation, base, delta: dest - base };
    destInfoCache.set(edgeIdx, info);
    return info;
  };

  const fixSourceHandleCrossings = (): number => {
    let crossings = 0;
    const edgesBySource = new Map<string, number[]>();
    for (const [i, e] of edges.entries()) {
      if (edgeSegmentIndices[i].length === 0) {
        continue;
      }
      if (!e.start) {
        continue;
      }
      if (!edgesBySource.has(e.start)) {
        edgesBySource.set(e.start, []);
      }
      edgesBySource.get(e.start)!.push(i);
    }

    const getEdgeDistance = (edgeIdx: number) => {
      const edge = edges[edgeIdx];
      if (!edge.start || !edge.end) {
        return 0;
      }
      const srcNode = nodeById.get(edge.start);
      const dstNode = nodeById.get(edge.end);
      if (!srcNode || !dstNode) {
        return 0;
      }
      const dx = (dstNode.x ?? 0) - (srcNode.x ?? 0);
      const dy = (dstNode.y ?? 0) - (srcNode.y ?? 0);
      return Math.abs(dx) + Math.abs(dy);
    };

    for (const grp of edgesBySource.values()) {
      // Sort by continuity: prefer edges that continue straight from previous segment
      grp.sort((a, b) => {
        // 0. Destination-aware ordering: keep near-center edges on the center track.
        const infoA = getDestInfo(a);
        const infoB = getDestInfo(b);
        if (Math.abs(infoA.deviation - infoB.deviation) > 1) {
          return infoA.deviation - infoB.deviation;
        }
        if (Math.abs(infoA.dest - infoB.dest) > 1) {
          return infoA.dest - infoB.dest;
        }

        // 0. Prefer longer spans (edges that travel further should keep straighter paths)
        const distA = getEdgeDistance(a);
        const distB = getEdgeDistance(b);
        if (Math.abs(distA - distB) > 1) {
          return distB - distA;
        }

        // 1. Segment Count: Prefer simpler paths (fewer segments usually means more direct)
        const lenA = edgeSegmentIndices[a].length;
        const lenB = edgeSegmentIndices[b].length;
        if (lenA !== lenB) {
          return lenA - lenB;
        }

        // 2. Length Check for single-segment edges: Prefer shorter edges to stay centered
        if (lenA === 1) {
          const idxA = edgeSegmentIndices[a][0];
          const idxB = edgeSegmentIndices[b][0];
          // Ensure indices exist
          if (allRoutedSegments[idxA] && allRoutedSegments[idxB]) {
            const segA = allRoutedSegments[idxA];
            const segB = allRoutedSegments[idxB];
            const distA = Math.abs(segA.to - segA.from);
            const distB = Math.abs(segB.to - segB.from);
            if (Math.abs(distA - distB) > 1) {
              // Shorter distance (closer destination) should come first to get center track
              return distA - distB;
            }
          }
        }

        return 0;
      });

      const handles = grp.map((ei) => allRoutedSegments[edgeSegmentIndices[ei][0]]);
      crossings += resolveHandleConflicts(handles);
    }
    return crossings;
  };

  const fixTargetHandleCrossings = (): number => {
    let crossings = 0;
    const edgesByTarget = new Map<string, number[]>();
    for (const [i, e] of edges.entries()) {
      const indices = edgeSegmentIndices[i];
      if (indices.length === 0) {
        continue;
      }
      if (!e.end) {
        continue;
      }
      if (!edgesByTarget.has(e.end)) {
        edgesByTarget.set(e.end, []);
      }
      edgesByTarget.get(e.end)!.push(i);
    }

    for (const grp of edgesByTarget.values()) {
      // Sort by continuity: prefer edges that align with their previous segment
      grp.sort((a, b) => {
        const getDist = (edgeIdx: number) => {
          const indices = edgeSegmentIndices[edgeIdx];
          if (indices.length < 2) {
            return 0;
          }
          // Shorter perpendicular connector means better target-handle alignment.
          const prev = allRoutedSegments[indices[indices.length - 2]];
          return Math.abs(prev.to - prev.from);
        };

        const scoreA = getDist(a);
        const scoreB = getDist(b);
        if (Math.abs(scoreA - scoreB) > 0.1) {
          return scoreA - scoreB; // Ascending length (shorter first)
        }
        return a - b; // Stable fallback
      });

      const handles = grp.map(
        (ei) => allRoutedSegments[edgeSegmentIndices[ei][edgeSegmentIndices[ei].length - 1]]
      );
      crossings += resolveHandleConflicts(handles);
    }
    return crossings;
  };

  const fixPipeCrossings = (): number => {
    let crossings = 0;
    for (const pipe of pipes) {
      // Collect all segments in pipe
      const pipeSegments: RoutedSegment[] = [];
      for (const t of pipe.tracks) {
        for (const ref of t.segments) {
          // Find the actual RoutedSegment object
          const idx = edgeSegmentIndices[ref.edgeIndex].find(
            (ix) => allRoutedSegments[ix].segmentIndex === ref.segmentIndex
          );
          if (idx !== undefined) {
            pipeSegments.push(allRoutedSegments[idx]);
          }
        }
      }

      // if (pipeSegments.length > 0 && pipe.orientation === 'vertical' && Math.abs(pipe.coord - (-19.5)) < 0.1) {}

      pipeSegments.sort((a, b) => a.edgeIndex - b.edgeIndex || a.segmentIndex - b.segmentIndex);

      for (let i = 0; i < pipeSegments.length; i++) {
        for (let j = i + 1; j < pipeSegments.length; j++) {
          const s1 = pipeSegments[i];
          const s2 = pipeSegments[j];

          if (segmentsConflict(s1, s2)) {
            crossings++;
            resolveTrackConflict(s1, s2, moveSegmentToTrack);
          }
        }
      }
    }
    return crossings;
  };

  // Main Reduction Loop
  let iterations = 0;
  const MAX_ITER = 10;
  while (iterations < MAX_ITER) {
    let changed = 0;
    changed += fixSourceHandleCrossings();
    changed += fixTargetHandleCrossings();
    changed += fixPipeCrossings();
    if (changed === 0) {
      break;
    }
    iterations++;
  }

  // -----------------------------------------------------------------------
  // Phase 3: Rebuild Geometry
  // -----------------------------------------------------------------------
  const segmentCoords = new Map<string, number>(); // `${edgeIndex}-${segmentIndex}` -> coord

  for (const pipe of pipes) {
    // Identify clusters of connected segments (interval graph)
    interface SegmentInfo {
      edgeIndex: number;
      segmentIndex: number;
      trackIndex: number;
      from: number;
      to: number;
    }

    const segments: SegmentInfo[] = [];
    pipe.tracks.forEach((t) => {
      t.segments.forEach((s) => {
        segments.push({
          edgeIndex: s.edgeIndex,
          segmentIndex: s.segmentIndex,
          trackIndex: t.index,
          from: s.from,
          to: s.to,
        });
      });
    });

    segments.sort((a, b) => a.from - b.from);

    const clusters: SegmentInfo[][] = [];
    if (segments.length > 0) {
      let currentCluster: SegmentInfo[] = [segments[0]];
      let clusterEnd = segments[0].to;

      for (let k = 1; k < segments.length; k++) {
        const s = segments[k];
        if (s.from < clusterEnd) {
          currentCluster.push(s);
          clusterEnd = Math.max(clusterEnd, s.to);
        } else {
          clusters.push(currentCluster);
          currentCluster = [s];
          clusterEnd = s.to;
        }
      }
      clusters.push(currentCluster);
    }

    // Assign local coordinates for each cluster
    for (const cluster of clusters) {
      const usedTracks = new Set<number>();
      cluster.forEach((s) => usedTracks.add(s.trackIndex));
      const trackScores = new Map<number, number>();
      cluster.forEach((s) => {
        const info = getDestInfo(s.edgeIndex);
        trackScores.set(s.trackIndex, (trackScores.get(s.trackIndex) ?? 0) + info.delta);
      });

      const leftTracks = [...usedTracks].filter((t) => (trackScores.get(t) ?? 0) < -1);
      const rightTracks = [...usedTracks].filter((t) => (trackScores.get(t) ?? 0) > 1);
      const neutralTracks = [...usedTracks].filter((t) => Math.abs(trackScores.get(t) ?? 0) <= 1);

      leftTracks.sort((a, b) => (trackScores.get(b) ?? 0) - (trackScores.get(a) ?? 0));
      rightTracks.sort((a, b) => (trackScores.get(a) ?? 0) - (trackScores.get(b) ?? 0));

      const assignCoord = (trackIndex: number, coord: number) => {
        cluster
          .filter((s) => s.trackIndex === trackIndex)
          .forEach((s) => {
            // Straight intra-lane edges keep pipe coord — don't spread them
            const effectiveCoord = straightIntraLaneEdges.has(s.edgeIndex) ? pipe.coord : coord;
            segmentCoords.set(`${s.edgeIndex}-${s.segmentIndex}`, effectiveCoord);
          });
      };

      let leftCount = 0;
      for (const trackIndex of leftTracks) {
        leftCount++;
        assignCoord(trackIndex, pipe.coord - leftCount * TRACK_SPACING);
      }

      if (neutralTracks.length === 0 && usedTracks.size > 0) {
        // If no neutral track, make the closest-to-center track neutral
        const bestTrack = [...usedTracks].sort(
          (a, b) => Math.abs(trackScores.get(a) ?? 0) - Math.abs(trackScores.get(b) ?? 0)
        )[0];
        const leftIdx = leftTracks.indexOf(bestTrack);
        if (leftIdx !== -1) {
          leftTracks.splice(leftIdx, 1);
        }
        const rightIdx = rightTracks.indexOf(bestTrack);
        if (rightIdx !== -1) {
          rightTracks.splice(rightIdx, 1);
        }
        neutralTracks.push(bestTrack);
      }

      let neutralAssigned = 0;
      for (const trackIndex of neutralTracks) {
        if (neutralAssigned === 0) {
          assignCoord(trackIndex, pipe.coord);
        } else {
          const dir = neutralAssigned % 2 === 1 ? 1 : -1;
          const magnitude = Math.ceil(neutralAssigned / 2);
          assignCoord(trackIndex, pipe.coord + dir * magnitude * TRACK_SPACING * 0.5);
        }
        neutralAssigned++;
      }

      let rightCount = 0;
      for (const trackIndex of rightTracks) {
        rightCount++;
        assignCoord(trackIndex, pipe.coord + rightCount * TRACK_SPACING);
      }
    }
  }

  // Strategy 1: no sibling to-label fan-out nudge is needed because
  // `-to-label` synthetic edges no longer exist; labelled originals route
  // as single A→B edges and share track assignment with every other edge.

  for (const [i, e] of edges.entries()) {
    const indices = edgeSegmentIndices[i] ?? [];
    if (indices.length === 0) {
      continue;
    }

    const newPoints: Point[] = [];

    // Recompute ports, honoring Step 6.2's side assignment.
    const src = nodeById.get(e.start!)!;
    const dst = nodeById.get(e.end!)!;
    const { pSrcPort, pDstPort } = portsForEdge(i, src, dst);

    const lines: RoutedLine[] = indices.map((idx) => {
      const s = allRoutedSegments[idx];
      // const track = s.pipe.tracks[s.trackIndex];
      const coord = segmentCoords.get(`${s.edgeIndex}-${s.segmentIndex}`) ?? s.pipe.coord;
      return {
        orient: s.orientation,
        coord: coord,
        from: s.from,
        to: s.to,
      };
    });

    newPoints.push(pSrcPort);

    for (let k = 0; k < lines.length; k++) {
      const line = lines[k];
      const prevPt = newPoints[newPoints.length - 1];
      const prevAlong = line.orient === 'vertical' ? prevPt.y : prevPt.x;
      const prevTrackCoord = line.orient === 'vertical' ? prevPt.x : prevPt.y;
      const nextLine = lines[k + 1];
      const hasNextLine = k < lines.length - 1;

      if (Math.abs(prevTrackCoord - line.coord) > EPS) {
        newPoints.push(pointOnLine(line, prevAlong));
      }

      if (hasNextLine && nextLine.orient === line.orient) {
        if (Math.abs(line.coord - nextLine.coord) > EPS) {
          const junction =
            line.orient === 'vertical'
              ? (prevAlong + nextLine.from) / 2
              : sharedLineEndpointCoord(line, nextLine);
          newPoints.push(pointOnLine(line, junction), pointOnLine(nextLine, junction));
        } else if (k === 0 || k === lines.length - 2) {
          newPoints.push(pointOnLine(line, sharedLineEndpointCoord(line, nextLine)));
        }
      } else if (hasNextLine) {
        newPoints.push(pointOnLine(line, nextLine.coord));
      } else {
        const endAlong =
          Math.abs(line.from - prevAlong) < Math.abs(line.to - prevAlong) ? line.to : line.from;
        newPoints.push(pointOnLine(line, endAlong));
      }
    }

    // Ensure we end at pDstPort to protect the last anchor from being eaten by the renderer's intersection logic
    const last = newPoints[newPoints.length - 1];
    if (Math.abs(last.x - pDstPort.x) > EPS || Math.abs(last.y - pDstPort.y) > EPS) {
      newPoints.push(pDstPort);
    }

    const filtered: Point[] = [];
    if (newPoints.length > 0) {
      filtered.push(newPoints[0]);
    }
    for (let k = 1; k < newPoints.length; k++) {
      const p = newPoints[k];
      const prev = filtered[filtered.length - 1];
      if (Math.abs(p.x - prev.x) > EPS || Math.abs(p.y - prev.y) > EPS) {
        filtered.push(p);
      }
    }

    e.points = filtered;
  }

  // Strategy 1: no shadow concatenation / L-bend bridge. Each labelled
  // original now routes as a single unbroken A→B polyline, so we simply
  // copy the routing view's polyline back onto the original edge.
  for (const re of edges) {
    const orig = re.__originalEdge as { points?: Point[] } | undefined;
    if (orig && re.points) {
      orig.points = re.points;
    }
  }

  // Strip `isLayoutOnly` virtual edges from the layout. They have served their
  // purpose by giving Sugiyama layering constraints through label nodes and
  // must not reach rendering, validation, or scoring.
  data.edges = (data.edges ?? []).filter((e) => !(e as { isLayoutOnly?: boolean }).isLayoutOnly);

  // Snap edge endpoints onto the rectangular boundary of their src / dst
  // nodes. Raykov's internal port-and-anchor logic leaves the polyline
  // terminating near the anchor offset (inside the node body); the renderer
  // normally clips to the node boundary via `tail.intersect()`, but the
  // validator sees the raw polyline points. Snapping here guarantees the
  // first and last points sit on the boundary regardless of downstream
  // rendering, and preserves the last/first segment's orientation.
  const nodeBoundaryClamp = (p: Point, node: MermaidNode): Point => {
    const cx = node.x ?? 0;
    const cy = node.y ?? 0;
    const w = node.width ?? 0;
    const h = node.height ?? 0;
    if (w <= 0 || h <= 0) {
      return p;
    }
    const left = cx - w / 2;
    const right = cx + w / 2;
    const top = cy - h / 2;
    const bottom = cy + h / 2;
    // Already outside the rect: leave alone.
    if (p.x < left || p.x > right || p.y < top || p.y > bottom) {
      return p;
    }
    // Inside (or on) the rect: project onto the nearest edge. Ties pick the
    // side closest to the node center in the orthogonal axis, which keeps
    // the snap consistent across similarly-positioned edges.
    const dLeft = p.x - left;
    const dRight = right - p.x;
    const dTop = p.y - top;
    const dBottom = bottom - p.y;
    const minD = Math.min(dLeft, dRight, dTop, dBottom);
    if (minD === dLeft) {
      return { x: left, y: p.y };
    }
    if (minD === dRight) {
      return { x: right, y: p.y };
    }
    if (minD === dTop) {
      return { x: p.x, y: top };
    }
    return { x: p.x, y: bottom };
  };

  for (const edge of data.edges) {
    const pts = (edge as { points?: Point[] }).points;
    if (!pts || pts.length < 2) {
      continue;
    }
    const srcId = (edge as { start?: string }).start;
    const dstId = (edge as { end?: string }).end;
    const src = srcId ? nodeById.get(srcId) : undefined;
    const dst = dstId ? nodeById.get(dstId) : undefined;
    if (src) {
      pts[0] = nodeBoundaryClamp(pts[0], src);
    }
    if (dst) {
      pts[pts.length - 1] = nodeBoundaryClamp(pts[pts.length - 1], dst);
    }
  }

  return data;
}
