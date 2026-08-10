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

export function routeFinalEdges(
  nodes: Map<string, HolaNode>,
  edges: FinalEdge[],
  options: HolaOptions,
  diagnostics: DiagnosticCollector,
  componentId: string
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

    const offset = parallelOffset(edge, options);
    const alternatives = routeAlternatives(
      {
        edgeId: edge.originalEdgeId,
        source: obstacleById.get(edge.source)!,
        target: obstacleById.get(edge.target)!,
        mandatoryWaypoints: edge.mandatoryWaypoints,
        obstacles,
        existingSegments: existing,
        sourcePortOffset: offset,
        targetPortOffset: offset,
        lockedSourceSide: edge.lockedSourceSide,
        lockedTargetSide: edge.lockedTargetSide,
      },
      config
    );

    const best = alternatives[0];
    if (!best) {
      diagnostics.report({
        code: 'HOLA_FINAL_ROUTING_FAILED',
        stage: 'final-routing',
        componentId,
        edgeIds: [edge.originalEdgeId],
        message: 'No orthogonal route found; falling back to the straight endpoint pair.',
      });
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
