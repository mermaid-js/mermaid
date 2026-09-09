/**
 * HOLA Step 4d: final routing (guide §18.4, §19).
 *
 * Runs against the *restored* graph — real tree nodes instead of placeholders,
 * copied roots merged back into their core nodes, and every original parallel
 * edge and self-loop present again. Deliberate chain bends are passed to the
 * router as ordered mandatory waypoints and survive simplification
 * (invariant 18); everything else is free to be re-optimised.
 */

import type { HolaNode, Point, Side } from '../model.js';
import { nodeBounds } from '../model.js';
import type { HolaOptions } from '../options.js';
import type { DiagnosticCollector } from '../diagnostics.js';
import type {
  OrthogonalRouteRequest,
  OrthogonalRouteResult,
  RouterConfig,
  RouterObstacle,
  Segment,
} from './orthogonalRouter.js';
import {
  countBends,
  countCollinearOverlaps,
  countCrossings,
  obstaclePort,
  pathLength,
  routeAlternatives,
  segmentCrossesInterior,
  segmentsOf,
  simplifyCollinear,
} from './orthogonalRouter.js';
import { silhouetteBand } from '../adapter/silhouette.js';

export interface FinalEdge {
  /** The original Mermaid edge id. */
  originalEdgeId: string;
  source: string;
  target: string;
  /** Ordered bends this route must pass through. */
  mandatoryWaypoints: Point[];
  /** Index among the parallel edges of the same node pair. */
  parallelIndex: number;
  parallelCount: number;
  /** Measured label size, carried only when this edge has a visible label. */
  labelWidth?: number;
  labelHeight?: number;
  /** Clearance between a label and nearby geometry. */
  labelClearance?: number;
  /**
   * Sides the route must use. Tree connectors lock theirs so the rank-facing
   * structure symmetric tree layout established survives final routing, while
   * the router still has to find an obstacle-free path (guide §15.2, §19.8).
   */
  lockedSourceSide?: Side;
  lockedTargetSide?: Side;
  /**
   * A clean external channel at a shared endpoint. It leaves and enters through
   * this same north/south face, using a lane just outside both endpoint boxes.
   */
  preferredOutsideSide?: 'top' | 'bottom';
}

export interface RoutedFinalEdge {
  originalEdgeId: string;
  source: string;
  target: string;
  points: Point[];
  sourceSide?: Side;
  targetSide?: Side;
  isSelfLoop: boolean;
}

export interface FinalRoutingResult {
  edges: RoutedFinalEdge[];
  failed: string[];
}

export function finalRouterConfig(options: HolaOptions): RouterConfig {
  return {
    clearance: options.routingClearance,
    bendPenalty: options.routingBendPenalty,
    crossingPenalty: options.routingCrossingPenalty,
    maxExpansions: options.routingMaxExpansions,
    minTerminalLegLength: options.minTerminalLegLength,
  };
}

/** How close to a corner a port may sit. */
const FAN_PORT_MARGIN = 8;
/**
 * Continuous placement and subgraph constraints can leave two intended grid
 * neighbours a fraction of a pixel apart. Treat that numerical residue as an
 * alignment only when an obstacle-free direct route proves it is safe.
 */
const NEAR_ALIGNMENT_EPSILON = 1;

/**
 * Final routing, in two passes (guide §19).
 *
 * Where an edge meets a node is not knowable until the router has chosen *which
 * side* it meets: the sides come out of the A\* search. So the first pass routes to
 * find the sides, `planPorts` then decides where along each side every edge should
 * attach, and the second pass re-routes with those sides locked and those ports
 * fixed. Without it two edges arriving at the same side of the same node both attach
 * at its middle and are drawn on top of each other.
 *
 * The second pass is kept only if it did not fail more edges than the first, so a
 * port assignment that some route cannot satisfy costs nothing.
 */
export function routeFinalEdges(
  nodes: Map<string, HolaNode>,
  edges: FinalEdge[],
  options: HolaOptions,
  diagnostics: DiagnosticCollector,
  componentId: string
): FinalRoutingResult {
  const first = routePass(nodes, edges, options);
  const plan = planPorts(nodes, first.edges, options, edges);

  let chosen = first;
  if (plan.size > 0) {
    const second = routePass(nodes, edges, options, plan);
    if (second.failed.length <= first.failed.length) {
      chosen = second;
    }
  }

  for (const edgeId of chosen.failed) {
    diagnostics.report({
      code: 'HOLA_FINAL_ROUTING_FAILED',
      stage: 'final-routing',
      componentId,
      edgeIds: [edgeId],
      message: 'No orthogonal route found; falling back to the straight endpoint pair.',
    });
  }

  return {
    ...chosen,
    edges: separateParallelMiddleLanes(nodes, chosen.edges, edges, options),
  };
}

/** Where one end of one edge should attach, once the side is known. */
interface PortAssignment {
  side: Side;
  offset: number;
}

interface PortPlan {
  source?: PortAssignment;
  target?: PortAssignment;
}

/** One routed segment, annotated with the endpoints of the route that owns it. */
interface OccupiedSegment {
  source: string;
  target: string;
  segment: Segment;
}

function routePass(
  nodes: Map<string, HolaNode>,
  edges: FinalEdge[],
  options: HolaOptions,
  plan?: Map<string, PortPlan>
): FinalRoutingResult {
  const config = finalRouterConfig(options);
  const obstacles: RouterObstacle[] = [...nodes.values()]
    .filter((n) => n.width > 0 && n.height > 0)
    .map((n) => ({
      id: n.id,
      rect: { x: n.x, y: n.y, width: n.width, height: n.height },
      silhouette: n.silhouette,
    }));
  const obstacleById = new Map(obstacles.map((o) => [o.id, o]));

  const existing: OccupiedSegment[] = [];
  const routed: RoutedFinalEdge[] = [];
  const failed: string[] = [];

  // Shorter edges first: they claim the direct corridors, longer ones detour.
  const ordered = [...edges].sort((a, b) => {
    const la = manhattan(nodes.get(a.source), nodes.get(a.target));
    const lb = manhattan(nodes.get(b.source), nodes.get(b.target));
    return la !== lb ? la - lb : a.originalEdgeId.localeCompare(b.originalEdgeId);
  });

  for (const edge of ordered) {
    const source = nodes.get(edge.source);
    const target = nodes.get(edge.target);
    if (!source || !target) {
      failed.push(edge.originalEdgeId);
      continue;
    }

    if (edge.source === edge.target) {
      const loop = routeSelfLoop(source, edge.parallelIndex, options);
      routed.push({
        originalEdgeId: edge.originalEdgeId,
        source: edge.source,
        target: edge.target,
        points: loop,
        isSelfLoop: true,
      });
      existing.push(...ownedSegments(loop, edge));
      continue;
    }

    const assigned = plan?.get(edge.originalEdgeId);
    const parallel = parallelOffset(edge, options);
    const request = {
      edgeId: edge.originalEdgeId,
      source: obstacleById.get(edge.source)!,
      target: obstacleById.get(edge.target)!,
      mandatoryWaypoints: edge.mandatoryWaypoints,
      obstacles,
      // A parallel bundle is one visual object. Letting each sibling score the
      // preceding sibling as an obstacle makes it flee into a different face,
      // producing a tangle of unrelated detours. Their common corridor is chosen
      // independently of one another; the subsequent port-planning pass gives
      // each one a distinct, ordered lane inside that corridor.
      existingSegments: existing
        .filter((occupied) => !sameEndpointPair(edge, occupied))
        .map((occupied) => occupied.segment),
      sourcePortOffset: assigned?.source ? assigned.source.offset : parallel,
      targetPortOffset: assigned?.target ? assigned.target.offset : parallel,
      lockedSourceSide: assigned?.source?.side ?? edge.lockedSourceSide,
      lockedTargetSide: assigned?.target?.side ?? edge.lockedTargetSide,
    };
    // A direct candidate is considered before the visibility search. The latter
    // correctly sees that two centres 0.5px apart are not collinear and produces
    // a four-point jog; a shared boundary coordinate is still a perfectly valid
    // straight connector when its corridor is clear.
    const direct = assigned ? undefined : nearAlignedDirectRoute(request, edge, config);
    const alternatives = direct ? [] : routeAlternatives(request, config);

    // A layout may know that a particular external channel keeps two branches at
    // one shared endpoint from crossing. It is a preference: if another box or
    // already-routed edge occupies that channel, retain the router's normal best
    // route instead.
    const preferred = edge.preferredOutsideSide
      ? outsideChannelRoute(request, edge.preferredOutsideSide, config)
      : undefined;
    const best = direct ?? preferred ?? alternatives[0];
    if (!best) {
      const fallback = [portOf(source, target), portOf(target, source)];
      routed.push({
        originalEdgeId: edge.originalEdgeId,
        source: edge.source,
        target: edge.target,
        points: fallback,
        isSelfLoop: false,
      });
      failed.push(edge.originalEdgeId);
      continue;
    }

    routed.push({
      originalEdgeId: edge.originalEdgeId,
      source: edge.source,
      target: edge.target,
      points: simplifyCollinear(best.points, edge.mandatoryWaypoints),
      sourceSide: best.sourceSide,
      targetSide: best.targetSide,
      isSelfLoop: false,
    });
    existing.push(...ownedSegments(best.points, edge));
  }

  return { edges: routed, failed };
}

/**
 * Return the shared-coordinate direct route for two almost-aligned endpoints.
 *
 * This is deliberately narrower than a generic simplifier: it never moves a
 * planned port, a parallel edge, or a mandatory waypoint. It also proves the
 * resulting segment clears every non-endpoint node and every earlier route, so a
 * one-pixel alignment tolerance cannot turn an intentional detour into a crossing.
 */
function nearAlignedDirectRoute(
  request: OrthogonalRouteRequest,
  edge: FinalEdge,
  config: RouterConfig
): OrthogonalRouteResult | undefined {
  if (edge.parallelCount > 1 || edge.mandatoryWaypoints.length > 0) {
    return undefined;
  }

  const source = request.source;
  const target = request.target;
  const deltaX = target.rect.x - source.rect.x;
  const deltaY = target.rect.y - source.rect.y;
  const vertical = Math.abs(deltaX) <= NEAR_ALIGNMENT_EPSILON;
  const horizontal = Math.abs(deltaY) <= NEAR_ALIGNMENT_EPSILON;
  if (vertical === horizontal) {
    return undefined;
  }

  const sourceSide: Side = vertical
    ? deltaY >= 0
      ? 'bottom'
      : 'top'
    : deltaX >= 0
      ? 'right'
      : 'left';
  const targetSide: Side = vertical
    ? sourceSide === 'bottom'
      ? 'top'
      : 'bottom'
    : sourceSide === 'right'
      ? 'left'
      : 'right';
  if (
    (request.lockedSourceSide && request.lockedSourceSide !== sourceSide) ||
    (request.lockedTargetSide && request.lockedTargetSide !== targetSide)
  ) {
    return undefined;
  }

  const coordinate = vertical
    ? (source.rect.x + target.rect.x) / 2
    : (source.rect.y + target.rect.y) / 2;
  const start = obstaclePort(
    source,
    sourceSide,
    vertical ? coordinate - source.rect.x : coordinate - source.rect.y
  );
  const end = obstaclePort(
    target,
    targetSide,
    vertical ? coordinate - target.rect.x : coordinate - target.rect.y
  );
  if (
    (vertical && Math.abs(start.x - end.x) > 1e-6) ||
    (horizontal && Math.abs(start.y - end.y) > 1e-6)
  ) {
    return undefined;
  }

  const minimumLeg = Math.max(config.clearance, config.minTerminalLegLength ?? 0, 1);
  if (Math.abs(vertical ? end.y - start.y : end.x - start.x) < minimumLeg) {
    return undefined;
  }

  for (const obstacle of request.obstacles) {
    if (obstacle.id === source.id || obstacle.id === target.id) {
      continue;
    }
    const bounds = nodeBounds(obstacle.rect);
    if (
      segmentCrossesInterior(start, end, {
        minX: bounds.minX - config.clearance,
        minY: bounds.minY - config.clearance,
        maxX: bounds.maxX + config.clearance,
        maxY: bounds.maxY + config.clearance,
      })
    ) {
      return undefined;
    }
  }

  const existing = request.existingSegments ?? [];
  if (
    countCrossings(start, end, existing) > 0 ||
    countCollinearOverlaps(start, end, existing) > 0
  ) {
    return undefined;
  }

  const points = [start, end];
  return {
    points,
    sourceSide,
    targetSide,
    bendCount: 0,
    length: pathLength(points),
    crossings: 0,
    cost: pathLength(points),
  };
}

function ownedSegments(points: Point[], edge: FinalEdge): OccupiedSegment[] {
  return segmentsOf(points).map((segment) => ({
    source: edge.source,
    target: edge.target,
    segment,
  }));
}

/** Parallelism is topological, so the Mermaid declaration direction does not matter. */
function sameEndpointPair(edge: FinalEdge, occupied: OccupiedSegment): boolean {
  return (
    (edge.source === occupied.source && edge.target === occupied.target) ||
    (edge.source === occupied.target && edge.target === occupied.source)
  );
}

/** One route whose two terminal runs surround one straight, adjustable middle lane. */
interface MiddleLaneRoute {
  route: RoutedFinalEdge;
  /** Vertical middle run uses an x lane; horizontal middle run uses a y lane. */
  vertical: boolean;
  sourceAxis: number;
  targetAxis: number;
  /** The transverse coordinate at the left or top endpoint of the corridor. */
  nearTransverse: number;
  lane: number;
}

/**
 * Give a simple parallel bundle separate tracks through its shared corridor.
 *
 * Routing siblings independently is necessary to let them choose the same face,
 * but it also means the visibility search picks the same cheapest middle grid
 * line for all of them. Their ports are separate, yet the long central segment
 * fuses into one line. For the common four-point shape we can safely fan that
 * middle line without changing sides, ports, or bend count.
 */
function separateParallelMiddleLanes(
  nodes: Map<string, HolaNode>,
  routed: RoutedFinalEdge[],
  inputEdges: readonly FinalEdge[],
  options: HolaOptions
): RoutedFinalEdge[] {
  const result = routed.map((route) => ({ ...route, points: [...route.points] }));
  const inputById = new Map(inputEdges.map((edge) => [edge.originalEdgeId, edge]));
  const groups = new Map<string, RoutedFinalEdge[]>();
  for (const route of result) {
    // Mermaid may reverse a non-directed (`---`) edge while lowering the graph.
    // It is still part of the same physical bundle, so group by unordered ends.
    const key =
      route.source < route.target
        ? `${route.source}\u0000${route.target}`
        : `${route.target}\u0000${route.source}`;
    const group = groups.get(key);
    if (group) {
      group.push(route);
    } else {
      groups.set(key, [route]);
    }
  }

  const obstacles = [...nodes.values()]
    .filter((node) => node.width > 0 && node.height > 0)
    .map((node) => ({
      id: node.id,
      rect: { x: node.x, y: node.y, width: node.width, height: node.height },
    }));
  const config = finalRouterConfig(options);

  for (const group of groups.values()) {
    if (
      group.length < 2 ||
      group.some((route) => inputById.get(route.originalEdgeId)?.mandatoryWaypoints.length)
    ) {
      continue;
    }
    const lanes = group
      .map(middleLaneOf)
      .filter((lane): lane is MiddleLaneRoute => lane !== undefined);
    if (lanes.length !== group.length || new Set(lanes.map((lane) => lane.vertical)).size !== 1) {
      continue;
    }

    const sourceAxis = lanes.map((lane) => lane.sourceAxis);
    const targetAxis = lanes.map((lane) => lane.targetAxis);
    const low = Math.max(
      ...lanes.map(
        (lane, index) => Math.min(sourceAxis[index], targetAxis[index]) + config.clearance
      )
    );
    const high = Math.min(
      ...lanes.map(
        (lane, index) => Math.max(sourceAxis[index], targetAxis[index]) - config.clearance
      )
    );
    if (high - low < 1e-6) {
      continue;
    }

    const centre = lanes.reduce((sum, lane) => sum + lane.lane, 0) / lanes.length;
    const corridorLanes = centredLanes(
      lanes.length,
      centre,
      low,
      high,
      Math.max(options.treeFanPortSpacing, options.routingClearance)
    );
    // The upper (or leftmost) physical endpoint takes the lane nearest the far
    // side of the corridor. This nesting keeps terminal horizontal (or vertical)
    // runs from cutting through another bundle member's middle run, and remains
    // correct when Mermaid happened to reverse an undirected edge internally.
    const ordered = [...lanes].sort(
      (first, second) => first.nearTransverse - second.nearTransverse
    );
    corridorLanes.reverse();
    const candidates = ordered.map((lane, index) => ({
      lane,
      points: withMiddleLane(lane, corridorLanes[index]),
    }));
    if (!parallelLanesAreClear(candidates, group, obstacles, config)) {
      continue;
    }
    for (const candidate of candidates) {
      candidate.lane.route.points = candidate.points;
    }
  }

  return result;
}

function middleLaneOf(route: RoutedFinalEdge): MiddleLaneRoute | undefined {
  if (route.points.length !== 4) {
    return undefined;
  }
  const [source, firstBend, secondBend, target] = route.points;
  const sourceHorizontal = sameCoordinate(source.y, firstBend.y);
  const middleVertical = sameCoordinate(firstBend.x, secondBend.x);
  const targetHorizontal = sameCoordinate(secondBend.y, target.y);
  if (sourceHorizontal && middleVertical && targetHorizontal) {
    const sourceIsNear = source.x <= target.x;
    return {
      route,
      vertical: true,
      sourceAxis: source.x,
      targetAxis: target.x,
      nearTransverse: sourceIsNear ? source.y : target.y,
      lane: firstBend.x,
    };
  }

  const sourceVertical = sameCoordinate(source.x, firstBend.x);
  const middleHorizontal = sameCoordinate(firstBend.y, secondBend.y);
  const targetVertical = sameCoordinate(secondBend.x, target.x);
  if (sourceVertical && middleHorizontal && targetVertical) {
    const sourceIsNear = source.y <= target.y;
    return {
      route,
      vertical: false,
      sourceAxis: source.y,
      targetAxis: target.y,
      nearTransverse: sourceIsNear ? source.x : target.x,
      lane: firstBend.y,
    };
  }
  return undefined;
}

function centredLanes(
  count: number,
  centre: number,
  low: number,
  high: number,
  gap: number
): number[] {
  const spacing = count > 1 ? Math.min(gap, (high - low) / (count - 1)) : 0;
  const span = spacing * (count - 1);
  const first = Math.max(low, Math.min(high - span, centre - span / 2));
  return Array.from({ length: count }, (_, index) => first + index * spacing);
}

function withMiddleLane(lane: MiddleLaneRoute, coordinate: number): Point[] {
  const [source, firstBend, secondBend, target] = lane.route.points;
  return lane.vertical
    ? [source, { x: coordinate, y: firstBend.y }, { x: coordinate, y: secondBend.y }, target]
    : [source, { x: firstBend.x, y: coordinate }, { x: secondBend.x, y: coordinate }, target];
}

function parallelLanesAreClear(
  candidates: { lane: MiddleLaneRoute; points: Point[] }[],
  group: RoutedFinalEdge[],
  obstacles: { id: string; rect: { x: number; y: number; width: number; height: number } }[],
  config: RouterConfig
): boolean {
  const endpoints = new Set([group[0].source, group[0].target]);
  for (const candidate of candidates) {
    for (const segment of segmentsOf(candidate.points)) {
      for (const obstacle of obstacles) {
        if (endpoints.has(obstacle.id)) {
          continue;
        }
        const bounds = nodeBounds(obstacle.rect);
        if (
          segmentCrossesInterior(segment.a, segment.b, {
            minX: bounds.minX - config.clearance,
            minY: bounds.minY - config.clearance,
            maxX: bounds.maxX + config.clearance,
            maxY: bounds.maxY + config.clearance,
          })
        ) {
          return false;
        }
      }
    }
  }

  for (let index = 0; index < candidates.length; index++) {
    for (let other = index + 1; other < candidates.length; other++) {
      for (const segment of segmentsOf(candidates[index].points)) {
        const otherSegments = segmentsOf(candidates[other].points);
        if (
          countCrossings(segment.a, segment.b, otherSegments) > 0 ||
          countCollinearOverlaps(segment.a, segment.b, otherSegments) > 0
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

function sameCoordinate(first: number, second: number): boolean {
  return Math.abs(first - second) < 1e-6;
}

/**
 * A simple external channel between two horizontally aligned endpoints.
 *
 * The normal visibility router cannot always form this shape: two almost-level
 * bottom ports can leave a terminal stub too short for its grid search. This
 * explicit candidate is the same orthogonal route, but fixes its lane one
 * clearance outside both endpoint boxes. It is used only after proving that the
 * whole channel is obstacle- and edge-free.
 */
function outsideChannelRoute(
  request: OrthogonalRouteRequest,
  side: 'top' | 'bottom',
  config: RouterConfig
): OrthogonalRouteResult | undefined {
  if (
    (request.lockedSourceSide && request.lockedSourceSide !== side) ||
    (request.lockedTargetSide && request.lockedTargetSide !== side)
  ) {
    return undefined;
  }

  const start = obstaclePort(request.source, side, request.sourcePortOffset ?? 0);
  const end = obstaclePort(request.target, side, request.targetPortOffset ?? 0);
  const lane =
    side === 'bottom'
      ? Math.max(start.y, end.y) + config.clearance
      : Math.min(start.y, end.y) - config.clearance;
  const points = simplifyCollinear([start, { x: start.x, y: lane }, { x: end.x, y: lane }, end]);

  // This rule is for sideways branches. A zero-width channel doubles back on
  // itself and is neither clearer nor a valid terminal approach.
  if (points.length < 4) {
    return undefined;
  }

  for (let index = 1; index < points.length; index++) {
    const from = points[index - 1];
    const to = points[index];
    for (const obstacle of request.obstacles) {
      if (obstacle.id === request.source.id || obstacle.id === request.target.id) {
        continue;
      }
      const bounds = nodeBounds(obstacle.rect);
      const expanded = {
        minX: bounds.minX - config.clearance,
        minY: bounds.minY - config.clearance,
        maxX: bounds.maxX + config.clearance,
        maxY: bounds.maxY + config.clearance,
      };
      if (segmentCrossesInterior(from, to, expanded)) {
        return undefined;
      }
    }
  }

  const occupied = request.existingSegments ?? [];
  let crossings = 0;
  for (let index = 1; index < points.length; index++) {
    crossings += countCrossings(points[index - 1], points[index], occupied);
    crossings += countCollinearOverlaps(points[index - 1], points[index], occupied);
  }
  if (crossings > 0) {
    return undefined;
  }

  const bendCount = countBends(points);
  const length = pathLength(points);
  return {
    points,
    sourceSide: side,
    targetSide: side,
    bendCount,
    length,
    crossings,
    cost: length + bendCount * config.bendPenalty,
  };
}

/**
 * Decide where every edge attaches along the side it was routed to.
 *
 * Each end asks for the point on the side nearest its own far end — that is the
 * attachment that needs no bend, so an edge that can run straight keeps running
 * straight. Ends that ask for the same place are then pushed apart by
 * `spreadPorts`, which honours the requests as closely as a minimum separation and
 * the length of the side allow. Sides with a single edge are left at the middle.
 */
function planPorts(
  nodes: Map<string, HolaNode>,
  routed: RoutedFinalEdge[],
  options: HolaOptions,
  inputEdges: readonly FinalEdge[]
): Map<string, PortPlan> {
  interface End {
    edgeId: string;
    role: 'source' | 'target';
    /** The node at the other end, whose position says where this port wants to be. */
    otherId: string;
  }

  const groups = new Map<string, { node: string; side: Side; ends: End[] }>();
  const add = (node: string, side: Side, end: End): void => {
    const key = `${node} ${side}`;
    const group = groups.get(key);
    if (group) {
      group.ends.push(end);
    } else {
      groups.set(key, { node, side, ends: [end] });
    }
  };

  for (const edge of routed) {
    if (edge.isSelfLoop || !edge.sourceSide || !edge.targetSide) {
      continue;
    }
    add(edge.source, edge.sourceSide, {
      edgeId: edge.originalEdgeId,
      role: 'source',
      otherId: edge.target,
    });
    add(edge.target, edge.targetSide, {
      edgeId: edge.originalEdgeId,
      role: 'target',
      otherId: edge.source,
    });
  }

  const plan = new Map<string, PortPlan>();
  const edgeById = new Map(inputEdges.map((edge) => [edge.originalEdgeId, edge]));
  for (const group of groups.values()) {
    if (group.ends.length < 2) {
      continue;
    }
    const node = nodes.get(group.node);
    if (!node) {
      continue;
    }

    // `obstaclePort` offsets along y on the left and right sides, along x otherwise.
    const vertical = group.side === 'left' || group.side === 'right';
    const sideLength = vertical ? node.height : node.width;
    const centre = vertical ? node.y : node.x;
    const margin = Math.min(FAN_PORT_MARGIN, sideLength / 4);
    // A non-rectangular shape does not reach its own corners, so the usable part
    // of the side is narrower than the box. Spreading over the box instead would
    // put ports where the boundary has receded and the approach only grazes it.
    const band = node.silhouette
      ? silhouetteBand(node.silhouette, node, group.side)
      : { min: -sideLength / 2, max: sideLength / 2 };
    const low = centre + Math.max(-sideLength / 2 + margin, band.min);
    const high = centre + Math.min(sideLength / 2 - margin, band.max);
    if (high <= low) {
      continue;
    }

    // Where each end would like to attach: the point on this side nearest its own
    // far end. `raw` is that position, `wanted` is it clamped onto the side.
    const raw = group.ends.map((end) => {
      const other = nodes.get(end.otherId);
      return other ? (vertical ? other.y : other.x) : centre;
    });
    const wanted = raw.map((position) => Math.max(low, Math.min(high, position)));

    // Order by the *unclamped* position. Every end whose far node lies beyond the
    // side clamps to the same limit, so ordering on the clamped value leaves those
    // ends tied and settles them on their edge id — which is unrelated to where they
    // are going, and puts a nearer branch outside a further one. Their corridors then
    // cross and run along each other. Clamping is monotone, so ordering on `raw`
    // still hands `spreadPorts` an ascending list.
    const order = group.ends
      .map((end, index) => ({ end, index }))
      .sort((a, b) => {
        const delta = raw[a.index] - raw[b.index];
        return delta !== 0 ? delta : a.end.edgeId.localeCompare(b.end.edgeId);
      });

    // A label on a vertical route extends along x; one on a horizontal route
    // extends along y. If neighbouring ports sit within that cross-axis extent,
    // the other route visibly crosses the label's background and the reader can
    // no longer tell which edge the label names. Make the port lane wide enough
    // for the largest label in this side group, while retaining the usual compact
    // fan spacing for unlabelled routes.
    const labelPortGap = Math.max(
      0,
      ...group.ends.map((end) => {
        const edge = edgeById.get(end.edgeId);
        const labelExtent = vertical ? (edge?.labelHeight ?? 0) : (edge?.labelWidth ?? 0);
        return labelExtent > 0
          ? labelExtent / 2 + (edge?.labelClearance ?? options.routingClearance)
          : 0;
      })
    );
    const spread = spreadPorts(
      order.map((entry) => wanted[entry.index]),
      low,
      high,
      Math.max(options.treeFanPortSpacing, labelPortGap)
    );

    order.forEach((entry, position) => {
      const existingPlan = plan.get(entry.end.edgeId) ?? {};
      existingPlan[entry.end.role] = { side: group.side, offset: spread[position] - centre };
      plan.set(entry.end.edgeId, existingPlan);
    });
  }

  return plan;
}

/**
 * Positions inside `[low, high]`, at least `gap` apart, in the given order, as
 * close to `wanted` as those two conditions allow. `wanted` must be sorted.
 *
 * The gap is reduced first if the side cannot hold that many ports, so the two
 * sweeps below can always satisfy both bounds: the forward sweep pushes each port
 * right far enough to clear its predecessor and `low`, the backward sweep pulls it
 * left far enough to stay under `high`.
 */
export function spreadPorts(wanted: number[], low: number, high: number, gap: number): number[] {
  const count = wanted.length;
  const spacing = count > 1 ? Math.min(gap, (high - low) / (count - 1)) : 0;
  const spread = [...wanted];

  let bound = low;
  for (let index = 0; index < count; index++) {
    spread[index] = Math.max(spread[index], bound);
    bound = spread[index] + spacing;
  }

  bound = high;
  for (let index = count - 1; index >= 0; index--) {
    spread[index] = Math.min(spread[index], bound);
    bound = spread[index] - spacing;
  }

  return spread;
}

function manhattan(a?: HolaNode, b?: HolaNode): number {
  if (!a || !b) {
    return Number.MAX_SAFE_INTEGER;
  }
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function parallelOffset(edge: FinalEdge, options: HolaOptions): number {
  if (edge.parallelCount <= 1) {
    return 0;
  }
  const spacing = Math.max(options.routingClearance, 8);
  return (edge.parallelIndex - (edge.parallelCount - 1) / 2) * spacing;
}

function portOf(from: HolaNode, towards: HolaNode): Point {
  const dx = towards.x - from.x;
  const dy = towards.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return { x: from.x + Math.sign(dx || 1) * (from.width / 2), y: from.y };
  }
  return { x: from.x, y: from.y + Math.sign(dy || 1) * (from.height / 2) };
}

/**
 * Self-loops leave and re-enter the same side as a rectangular detour, so the
 * whole drawing stays orthogonal (guide §23, final output).
 */
export function routeSelfLoop(node: HolaNode, index: number, options: HolaOptions): Point[] {
  const depth = options.routingClearance * 2 + index * options.routingClearance;
  const halfSpan = Math.max(node.width / 4, 8);
  const top = node.y - node.height / 2;
  return [
    { x: node.x - halfSpan, y: top },
    { x: node.x - halfSpan, y: top - depth },
    { x: node.x + halfSpan, y: top - depth },
    { x: node.x + halfSpan, y: top },
  ];
}

export function routeCost(result: OrthogonalRouteResult): number {
  return result.cost;
}
