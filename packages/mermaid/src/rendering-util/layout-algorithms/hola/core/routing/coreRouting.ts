/**
 * HOLA Step 2c: orthogonal core routing (guide §14).
 *
 * Runs *before* planarisation (invariant 8) so the planariser only ever sees
 * axis-aligned geometry, and enforces the two-side invariant (invariant 9):
 * every core node must have connectors on at least two distinct sides, which
 * is what makes the faces around it meaningful for tree placement.
 */

import type { HolaEdge, HolaNode, Side } from '../model.js';
import type { CoreLayoutState } from '../state.js';
import type {
  OrthogonalRouteResult,
  RouterConfig,
  RouterObstacle,
  Segment,
} from './orthogonalRouter.js';
import { isOrthogonal, routeAlternatives, segmentsOf } from './orthogonalRouter.js';

const ALIGN_EPSILON = 1e-6;
const ALL_SIDES: Side[] = ['top', 'right', 'bottom', 'left'];

export interface CoreRoutingResult {
  routed: number;
  failed: string[];
  sideUsage: Map<string, Set<Side>>;
  sideDiversitySatisfied: boolean;
}

export function routerConfigFrom(state: CoreLayoutState): RouterConfig {
  return {
    clearance: state.options.routingClearance,
    bendPenalty: state.options.routingBendPenalty,
    crossingPenalty: state.options.routingCrossingPenalty,
    maxExpansions: state.options.routingMaxExpansions,
    minTerminalLegLength: state.options.minTerminalLegLength,
  };
}

export function obstaclesFrom(entities: Map<string, HolaNode>): RouterObstacle[] {
  return [...entities.values()]
    .filter((n) => n.width > 0 && n.height > 0)
    .map((n) => ({
      id: n.id,
      rect: { x: n.x, y: n.y, width: n.width, height: n.height },
      silhouette: n.silhouette,
    }));
}

/**
 * Sides that would keep an already axis-aligned edge straight. HOLA aligns
 * chains and hub neighbours on purpose; the router must not undo that.
 */
export function preferredSides(
  source: HolaNode,
  target: HolaNode
): { source: Side[]; target: Side[] } {
  if (
    Math.abs(source.y - target.y) < ALIGN_EPSILON &&
    Math.abs(source.x - target.x) > ALIGN_EPSILON
  ) {
    return source.x < target.x
      ? { source: ['right'], target: ['left'] }
      : { source: ['left'], target: ['right'] };
  }
  if (
    Math.abs(source.x - target.x) < ALIGN_EPSILON &&
    Math.abs(source.y - target.y) > ALIGN_EPSILON
  ) {
    return source.y < target.y
      ? { source: ['bottom'], target: ['top'] }
      : { source: ['top'], target: ['bottom'] };
  }
  return { source: ALL_SIDES, target: ALL_SIDES };
}

export function routeCoreEdges(state: CoreLayoutState): CoreRoutingResult {
  const config = routerConfigFrom(state);
  const obstacles = obstaclesFrom(state.entities);
  const obstacleById = new Map(obstacles.map((o) => [o.id, o]));

  const edges = [...state.core.edges.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
  const existingSegments: Segment[] = [];
  const sideUsage = new Map<string, Set<Side>>();
  for (const id of state.core.nodes.keys()) {
    sideUsage.set(id, new Set());
  }

  const failed: string[] = [];
  let routed = 0;

  const routeOne = (
    edge: HolaEdge,
    lockedSource?: Side,
    lockedTarget?: Side
  ): OrthogonalRouteResult[] => {
    const source = obstacleById.get(edge.source);
    const target = obstacleById.get(edge.target);
    if (!source || !target) {
      return [];
    }
    const sourceNode = state.entities.get(edge.source)!;
    const targetNode = state.entities.get(edge.target)!;
    const preferred = preferredSides(sourceNode, targetNode);
    return routeAlternatives(
      {
        edgeId: edge.id,
        source,
        target,
        allowedSourceSides: preferred.source,
        allowedTargetSides: preferred.target,
        lockedSourceSide: lockedSource,
        lockedTargetSide: lockedTarget,
        mandatoryWaypoints: [...edge.mandatoryWaypoints]
          .sort((a, b) => a.order - b.order)
          .map((w) => ({ x: w.x, y: w.y })),
        obstacles,
        existingSegments,
      },
      config
    );
  };

  for (const edge of edges) {
    let alternatives = routeOne(edge);
    if (alternatives.length === 0) {
      // Preferred sides were too restrictive (an obstacle sits in the straight
      // corridor); fall back to every side.
      const source = obstacleById.get(edge.source);
      const target = obstacleById.get(edge.target);
      if (source && target) {
        alternatives = routeAlternatives(
          {
            edgeId: edge.id,
            source,
            target,
            allowedSourceSides: ALL_SIDES,
            allowedTargetSides: ALL_SIDES,
            mandatoryWaypoints: edge.mandatoryWaypoints.map((w) => ({ x: w.x, y: w.y })),
            obstacles,
            existingSegments,
          },
          config
        );
      }
    }

    const best = alternatives[0];
    if (!best) {
      failed.push(edge.id);
      state.diagnostics.report({
        code: 'HOLA_CORE_ROUTING_FAILED',
        stage: 'core-routing',
        componentId: state.componentId,
        edgeIds: [edge.id],
        message: 'No orthogonal route found for a core edge.',
      });
      continue;
    }

    applyRoute(edge, best, sideUsage);
    existingSegments.push(...segmentsOf(best.points));
    routed++;
  }

  const sideDiversitySatisfied = enforceTwoSideInvariant(
    state,
    edges,
    sideUsage,
    existingSegments,
    routeOne
  );

  return { routed, failed, sideUsage, sideDiversitySatisfied };
}

function applyRoute(
  edge: HolaEdge,
  result: OrthogonalRouteResult,
  sideUsage: Map<string, Set<Side>>
): void {
  edge.route = result.points;
  edge.sourceSide = result.sourceSide;
  edge.targetSide = result.targetSide;
  sideUsage.get(edge.source)?.add(result.sourceSide);
  sideUsage.get(edge.target)?.add(result.targetSide);
}

/**
 * Guide §14.2: while some core node uses only one side, move its cheapest
 * incident edge onto a second side.
 */
function enforceTwoSideInvariant(
  state: CoreLayoutState,
  edges: HolaEdge[],
  sideUsage: Map<string, Set<Side>>,
  existingSegments: Segment[],
  routeOne: (edge: HolaEdge, lockedSource?: Side, lockedTarget?: Side) => OrthogonalRouteResult[]
): boolean {
  const incident = new Map<string, HolaEdge[]>();
  for (const edge of edges) {
    if (!edge.route.length) {
      continue;
    }
    push(incident, edge.source, edge);
    push(incident, edge.target, edge);
  }

  for (let round = 0; round < edges.length + 4; round++) {
    const offender = [...sideUsage.entries()]
      .filter(([id, sides]) => sides.size < 2 && (incident.get(id)?.length ?? 0) >= 2)
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))[0];

    if (!offender) {
      return true;
    }

    const [nodeId, used] = offender;
    const usedSide = [...used][0];
    let applied = false;

    const candidates = [...(incident.get(nodeId) ?? [])].sort((a, b) => (a.id < b.id ? -1 : 1));

    for (const edge of candidates) {
      const isSource = edge.source === nodeId;
      const alternative = routeOne(edge).find((r) =>
        isSource ? r.sourceSide !== usedSide : r.targetSide !== usedSide
      );
      const replacement = alternative;
      if (!replacement) {
        continue;
      }

      // Withdraw the old route from the crossing set before adding the new one.
      removeSegments(existingSegments, edge.route);
      recomputeUsage(sideUsage, edges, edge, replacement);
      applyRoute(edge, replacement, sideUsage);
      existingSegments.push(...segmentsOf(replacement.points));
      applied = true;
      break;
    }

    if (!applied) {
      state.diagnostics.report({
        code: 'HOLA_CORE_SIDE_DIVERSITY_FAILED',
        stage: 'core-routing',
        componentId: state.componentId,
        nodeIds: [nodeId],
        message: 'Could not move any incident edge onto a second side of this core node.',
      });
      return false;
    }
  }

  return false;
}

function recomputeUsage(
  sideUsage: Map<string, Set<Side>>,
  edges: HolaEdge[],
  changed: HolaEdge,
  replacement: OrthogonalRouteResult
): void {
  changed.sourceSide = replacement.sourceSide;
  changed.targetSide = replacement.targetSide;
  for (const [id, set] of sideUsage) {
    set.clear();
    void id;
  }
  for (const edge of edges) {
    if (!edge.route.length && edge !== changed) {
      continue;
    }
    if (edge.sourceSide) {
      sideUsage.get(edge.source)?.add(edge.sourceSide);
    }
    if (edge.targetSide) {
      sideUsage.get(edge.target)?.add(edge.targetSide);
    }
  }
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const list = map.get(key);
  if (list) {
    list.push(value);
  } else {
    map.set(key, [value]);
  }
}

function removeSegments(segments: Segment[], points: { x: number; y: number }[]): void {
  const doomed = segmentsOf(points);
  for (const d of doomed) {
    const index = segments.findIndex(
      (s) => s.a.x === d.a.x && s.a.y === d.a.y && s.b.x === d.b.x && s.b.y === d.b.y
    );
    if (index >= 0) {
      segments.splice(index, 1);
    }
  }
}

/** Invariant check used by tests and by the planarisation entry point. */
export function assertRoutesOrthogonal(edges: Iterable<HolaEdge>): string[] {
  const offenders: string[] = [];
  for (const edge of edges) {
    if (edge.route.length >= 2 && !isOrthogonal(edge.route)) {
      offenders.push(edge.id);
    }
  }
  return offenders;
}
