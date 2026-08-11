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
import type { HolaOptions } from '../options.js';
import type { DiagnosticCollector } from '../diagnostics.js';
import type {
  OrthogonalRouteResult,
  RouterConfig,
  RouterObstacle,
  Segment,
} from './orthogonalRouter.js';
import { routeAlternatives, segmentsOf, simplifyCollinear } from './orthogonalRouter.js';

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
  /**
   * Sides the route must use. Tree connectors lock theirs so the rank-facing
   * structure symmetric tree layout established survives final routing, while
   * the router still has to find an obstacle-free path (guide §15.2, §19.8).
   */
  lockedSourceSide?: Side;
  lockedTargetSide?: Side;
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
  };
}

/** How close to a corner a port may sit. */
const FAN_PORT_MARGIN = 8;

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
  const plan = planPorts(nodes, first.edges, options);

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

  return chosen;
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

function routePass(
  nodes: Map<string, HolaNode>,
  edges: FinalEdge[],
  options: HolaOptions,
  plan?: Map<string, PortPlan>
): FinalRoutingResult {
  const config = finalRouterConfig(options);
  const obstacles: RouterObstacle[] = [...nodes.values()]
    .filter((n) => n.width > 0 && n.height > 0)
    .map((n) => ({ id: n.id, rect: { x: n.x, y: n.y, width: n.width, height: n.height } }));
  const obstacleById = new Map(obstacles.map((o) => [o.id, o]));

  const existing: Segment[] = [];
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
      existing.push(...segmentsOf(loop));
      continue;
    }

    const assigned = plan?.get(edge.originalEdgeId);
    const parallel = parallelOffset(edge, options);
    const alternatives = routeAlternatives(
      {
        edgeId: edge.originalEdgeId,
        source: obstacleById.get(edge.source)!,
        target: obstacleById.get(edge.target)!,
        mandatoryWaypoints: edge.mandatoryWaypoints,
        obstacles,
        existingSegments: existing,
        sourcePortOffset: assigned?.source ? assigned.source.offset : parallel,
        targetPortOffset: assigned?.target ? assigned.target.offset : parallel,
        lockedSourceSide: assigned?.source?.side ?? edge.lockedSourceSide,
        lockedTargetSide: assigned?.target?.side ?? edge.lockedTargetSide,
      },
      config
    );

    const best = alternatives[0];
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
    existing.push(...segmentsOf(best.points));
  }

  return { edges: routed, failed };
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
  options: HolaOptions
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
  for (const group of groups.values()) {
    if (group.ends.length < 2) {
      continue;
    }
    const node = nodes.get(group.node);
    if (!node) {
      continue;
    }

    // `portPoint` offsets along y on the left and right sides, along x otherwise.
    const vertical = group.side === 'left' || group.side === 'right';
    const sideLength = vertical ? node.height : node.width;
    const centre = vertical ? node.y : node.x;
    const margin = Math.min(FAN_PORT_MARGIN, sideLength / 4);
    const low = centre - sideLength / 2 + margin;
    const high = centre + sideLength / 2 - margin;
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

    const spread = spreadPorts(
      order.map((entry) => wanted[entry.index]),
      low,
      high,
      options.treeFanPortSpacing
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
