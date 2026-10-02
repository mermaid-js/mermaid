import { log } from '../../../logger.js';
import type { Point } from '../../../types.js';
import type { Node } from '../../types.js';
import { normalizePolyline } from '../layout-utils/geometry.js';
import { manhattanLength, rectForNode } from '../layout-utils/helpers.js';
import type { GridRoutingOptions } from './router.js';
import {
  SELF_LOOP_PORT_GAP,
  SELF_LOOP_PORT_OFFSET_STEP,
  areExactlyAxisAligned,
  orderedSelfLoopSides,
  routeObstacleClearSelfLoop,
  type SegmentAttachment,
  type SegmentAttachmentAlternative,
} from './routerCompatibility.js';
import {
  endpointPairLowerBound,
  pairArcAllowed,
  routeHasDistinctPairPorts,
  routeSatisfiesPairConstraints,
  validateContainerSegment,
  validateSameContainerRoute,
} from './routerConstraint.js';
import {
  TERMINAL_APPROACH_PX,
  routingPointKey,
  sideInterval,
  sideOrder,
  type EdgeRoutePlan,
  type EndpointCandidate,
} from './routerPlanning.js';
import {
  GridRoutingResourceLimitError,
  type GridRoutingFallbackReason,
} from './routerInstrumentation.js';
import {
  compareTupleCost,
  findShortestRoute,
  type RouterSearchResult,
  type RouterSearchWorkspace,
  type RouterTupleCost,
} from './routerSearch.js';
import {
  buildEndpointRoutingOverlay,
  DEFAULT_MAX_ROUTING_ESTIMATED_BYTES,
  type EndpointOverlayScratch,
} from './routerTopology.js';
import type {
  GridContainerId,
  GridLayoutResult,
  GridOrientation,
  GridRoutingContext,
  GridSide,
} from './types.js';
import { ROOT_CONTAINER_ID, gridError } from './types.js';

// Sparse routing overlays edge-specific endpoints onto immutable container visibility graphs, then
// validates every result before it can replace the deterministic corridor route.
const ROUTER_DEBUG_KEY = 'grid-router';

function recordFallback(
  context: GridRoutingContext,
  reason: GridRoutingFallbackReason,
  edgeId: string,
  containerId: GridContainerId,
  searchStateScope?: GridRoutingResourceLimitError['searchStateScope']
): void {
  if (context.metrics) {
    context.metrics.resourceLimitFallbacks++;
    context.metrics.fallbackReasons[reason]++;
  }
  log.debug(ROUTER_DEBUG_KEY, 'GRID_ROUTING_RESOURCE_FALLBACK', {
    edgeId,
    containerId,
    reason,
  });
  if (
    reason === 'search_state_cap' &&
    searchStateScope === 'invocation' &&
    !context.searchBudgetWarningEmitted
  ) {
    context.searchBudgetWarningEmitted = true;
    log.warn(ROUTER_DEBUG_KEY, 'GRID_ROUTING_INVOCATION_SEARCH_BUDGET_EXHAUSTED', {
      edgeId,
      containerId,
      expandedStates: context.searchBudget.expandedStates,
    });
  }
}

/*
 * TODO: Consider an opt-in `grid.routingPolicy: 'best-effort'` mode while keeping validated
 * routing as the default.
 *
 * A minimal implementation could catch recoverable per-edge routing exhaustion after both the
 * sparse router and validated compatibility route fail, then construct a deterministic orthogonal
 * dogleg between the measured source and target bounds. Self-loops would need a similarly
 * deterministic rectangular loop. The fallback could cross protected geometry or share bundle
 * lanes, but it must still use finite coordinates, preserve valid endpoints, avoid partially
 * committed state, and emit a warning containing the edge id and original failure reason.
 *
 * A production-quality implementation would need:
 * - Explicit classification of recoverable geometry exhaustion versus malformed input and internal
 *   invariants. Invalid coordinates, containment, measurements, endpoints, and topology state must
 *   remain errors in every mode.
 * - Transactional per-edge fallback that updates pair-route, portal, instrumentation, and retry
 *   state consistently.
 * - Documented constraints that best-effort routing may relax, with deterministic output and
 *   observable warnings or metrics for every degraded edge.
 * - A matching label policy that restores provisional label-routing state before placing a label
 *   at a deterministic fallback position or omitting it.
 * - Tests for both policies using the same production paths, including hierarchy routes,
 *   self-loops, bundles, resource-limit fallbacks, and label-placement exhaustion.
 */
export function sparseSameContainerRoute(
  plan: EdgeRoutePlan,
  sources: readonly EndpointCandidate[],
  targets: readonly EndpointCandidate[],
  source: Node,
  target: Node,
  legacyRoute: () => Point[],
  result: GridLayoutResult,
  context: GridRoutingContext,
  searchWorkspace: RouterSearchWorkspace,
  overlayScratch: EndpointOverlayScratch,
  options: GridRoutingOptions,
  pairRoutes: readonly (readonly Point[])[]
): Point[] {
  const fallbackReason = context.fallbackContainers.get(plan.lcaContainerId) as
    | GridRoutingFallbackReason
    | undefined;
  if (fallbackReason) {
    const legacy = legacyRoute();
    recordFallback(context, fallbackReason, plan.edge.id, plan.lcaContainerId);
    if (
      !validateSameContainerRoute(legacy, source, target, plan.lcaContainerId, result) ||
      (plan.bundleSize > 1 && !routeSatisfiesPairConstraints(legacy, pairRoutes))
    ) {
      if (context.metrics) {
        context.metrics.fallbackValidationFailures++;
      }
      throw gridError('GRID_ROUTE_NOT_FOUND', `Invalid legacy fallback for "${plan.edge.id}"`, {
        edgeId: plan.edge.id,
        reason: fallbackReason,
      });
    }
    return legacy;
  }
  const topology = context.topologies.get(plan.lcaContainerId);
  if (!topology) {
    throw gridError('GRID_ROUTE_NOT_FOUND', `Missing routing topology "${plan.lcaContainerId}"`);
  }
  if (sources.length === 0 || targets.length === 0) {
    if (context.metrics) {
      context.metrics.routesImpossible++;
    }
    throw gridError(
      'GRID_ROUTE_NOT_FOUND',
      plan.bundleSize > 1
        ? `No distinct lane route for "${plan.edge.id}"`
        : `No legal endpoint candidates for "${plan.edge.id}"`,
      { edgeId: plan.edge.id }
    );
  }

  let best: { result: RouterSearchResult; points: Point[] } | undefined;
  let searchCap: GridRoutingResourceLimitError | undefined;
  const pairs = sources
    .flatMap((sourceCandidate) =>
      targets.map((targetCandidate) => {
        const pairRank = sourceCandidate.rank * targets.length + targetCandidate.rank;
        const [length, bends] = endpointPairLowerBound(sourceCandidate, targetCandidate);
        const lowerCost: RouterTupleCost = [length, bends, 0, pairRank];
        return { sourceCandidate, targetCandidate, pairRank, lowerCost };
      })
    )
    .sort(
      (a, b) =>
        compareTupleCost(a.lowerCost, b.lowerCost) ||
        sideOrder(a.sourceCandidate.side) - sideOrder(b.sourceCandidate.side) ||
        sideOrder(a.targetCandidate.side) - sideOrder(b.targetCandidate.side)
    );

  // Candidate pairs are ordered by an admissible lower bound. Once a completed route is no worse
  // than that bound, the pair cannot improve the current best and its overlay/search is skipped.
  for (const { sourceCandidate, targetCandidate, pairRank, lowerCost } of pairs) {
    if (best && compareTupleCost(best.result.cost, lowerCost) <= 0) {
      continue;
    }
    try {
      const overlay = buildEndpointRoutingOverlay(
        topology,
        sourceCandidate.connect,
        targetCandidate.connect,
        context.metrics,
        overlayScratch,
        plan.bundleSize > 1 &&
          (sourceCandidate.connect.x === targetCandidate.connect.x ||
            sourceCandidate.connect.y === targetCandidate.connect.y)
          ? [
              {
                x: (sourceCandidate.connect.x + targetCandidate.connect.x) / 2,
                y: (sourceCandidate.connect.y + targetCandidate.connect.y) / 2,
              },
            ]
          : []
      );
      const liveEstimatedBytes =
        context.baseEstimatedBytes + overlay.estimatedBytes - topology.estimatedBytes;
      if (
        liveEstimatedBytes >
        (options.topologyCaps?.maxEstimatedBytes ?? DEFAULT_MAX_ROUTING_ESTIMATED_BYTES)
      ) {
        throw new GridRoutingResourceLimitError(
          'estimated_memory_cap',
          'Grid routing estimated_memory_cap exceeded'
        );
      }
      if (context.metrics) {
        context.metrics.estimatedBytes = Math.max(
          context.metrics.estimatedBytes,
          liveEstimatedBytes
        );
      }
      const sourceId = overlay.pointVertexIds.get(routingPointKey(sourceCandidate.connect));
      const targetId = overlay.pointVertexIds.get(routingPointKey(targetCandidate.connect));
      if (sourceId === undefined || targetId === undefined) {
        throw gridError(
          'GRID_ROUTE_NOT_FOUND',
          `Endpoint projection is missing from the routing overlay for "${plan.edge.id}"`,
          {
            edgeId: plan.edge.id,
            containerId: plan.lcaContainerId,
            source: sourceCandidate.connect,
            target: targetCandidate.connect,
          }
        );
      }
      const sourceOrientation: GridOrientation =
        sourceCandidate.side === 'left' || sourceCandidate.side === 'right' ? 'H' : 'V';
      const targetOrientation: GridOrientation =
        targetCandidate.side === 'left' || targetCandidate.side === 'right' ? 'H' : 'V';
      const resultForPair = findShortestRoute(overlay, sourceId, targetId, {
        metrics: context.metrics,
        caps: {
          ...options.searchCaps,
          maxEstimatedBytes:
            options.searchCaps?.maxEstimatedBytes ??
            options.topologyCaps?.maxEstimatedBytes ??
            DEFAULT_MAX_ROUTING_ESTIMATED_BYTES,
        },
        endpointCandidateRank: pairRank,
        recordOutcome: false,
        budget: context.searchBudget,
        initialOrientation: sourceOrientation,
        initialLength: TERMINAL_APPROACH_PX,
        targetOrientation,
        targetLength: TERMINAL_APPROACH_PX,
        topologyValidated: true,
        workspace: searchWorkspace,
        estimatedBytesBase: liveEstimatedBytes,
        arcAllowed:
          plan.bundleSize > 1 ? (from, to) => pairArcAllowed(from, to, pairRoutes) : undefined,
      });
      if (!resultForPair) {
        continue;
      }
      const points = normalizePolyline([
        sourceCandidate.port,
        ...resultForPair.points,
        targetCandidate.port,
      ]).points;
      if (!validateSameContainerRoute(points, source, target, plan.lcaContainerId, result)) {
        continue;
      }
      if (plan.bundleSize > 1 && !routeSatisfiesPairConstraints(points, pairRoutes)) {
        continue;
      }
      if (!best || compareTupleCost(resultForPair.cost, best.result.cost) < 0) {
        best = { result: resultForPair, points };
      }
    } catch (error) {
      if (!(error instanceof GridRoutingResourceLimitError)) {
        throw error;
      }
      if (best) {
        break;
      }
      searchCap = error;
      break;
    }
  }
  if (searchCap) {
    // Resource caps select the compatibility route only after it passes the same geometry and bundle
    // constraints; caps never weaken correctness.
    const legacy = legacyRoute();
    recordFallback(
      context,
      searchCap.reason,
      plan.edge.id,
      plan.lcaContainerId,
      searchCap.searchStateScope
    );
    if (
      !validateSameContainerRoute(legacy, source, target, plan.lcaContainerId, result) ||
      (plan.bundleSize > 1 && !routeSatisfiesPairConstraints(legacy, pairRoutes))
    ) {
      if (context.metrics) {
        context.metrics.fallbackValidationFailures++;
      }
      throw gridError('GRID_ROUTE_NOT_FOUND', `Invalid legacy fallback for "${plan.edge.id}"`, {
        edgeId: plan.edge.id,
        reason: searchCap.reason,
      });
    }
    return legacy;
  }
  if (!best) {
    if (context.metrics) {
      context.metrics.routesImpossible++;
    }
    throw gridError(
      'GRID_ROUTE_NOT_FOUND',
      plan.bundleSize > 1
        ? `No distinct lane route for "${plan.edge.id}"`
        : `No cell-aware route for "${plan.edge.id}"`,
      {
        edgeId: plan.edge.id,
      }
    );
  }
  if (options.onDualRouteComparison) {
    const legacy = legacyRoute();
    const sparseNormalized = normalizePolyline(best.points);
    const legacyNormalized = normalizePolyline(legacy);
    options.onDualRouteComparison({
      edgeId: plan.edge.id,
      sparse: {
        valid: true,
        length: manhattanLength(sparseNormalized.points),
        bends: sparseNormalized.bends,
      },
      legacy: {
        valid: validateSameContainerRoute(legacy, source, target, plan.lcaContainerId, result),
        length: manhattanLength(legacyNormalized.points),
        bends: legacyNormalized.bends,
      },
    });
  }
  return best.points;
}

function selfLoopAttachments(
  owner: Node,
  side: GridSide,
  index: number
): { start: EndpointCandidate; target: EndpointCandidate } | undefined {
  const interval = sideInterval(owner, side);
  if (!interval || interval.high - interval.low < SELF_LOOP_PORT_GAP) {
    return undefined;
  }
  const rect = rectForNode(owner);
  const center = (interval.low + interval.high) / 2;
  const portOffset = index * SELF_LOOP_PORT_OFFSET_STEP;
  const coordinates = [
    center - SELF_LOOP_PORT_GAP / 2 - portOffset,
    center + SELF_LOOP_PORT_GAP / 2 + portOffset,
  ];
  if (coordinates[0] < interval.low || coordinates[1] > interval.high) {
    return undefined;
  }
  const candidate = (coordinate: number): EndpointCandidate => {
    const port =
      side === 'left' || side === 'right'
        ? { x: side === 'left' ? rect.left : rect.right, y: coordinate }
        : { x: coordinate, y: side === 'top' ? rect.top : rect.bottom };
    return {
      ownerId: owner.id,
      side,
      port,
      connect: {
        x:
          port.x +
          (side === 'left' ? -TERMINAL_APPROACH_PX : side === 'right' ? TERMINAL_APPROACH_PX : 0),
        y:
          port.y +
          (side === 'top' ? -TERMINAL_APPROACH_PX : side === 'bottom' ? TERMINAL_APPROACH_PX : 0),
      },
      rank: 0,
    };
  };
  return { start: candidate(coordinates[0]), target: candidate(coordinates[1]) };
}

export function sparseSelfLoopRoute(
  plan: EdgeRoutePlan,
  owner: Node,
  result: GridLayoutResult,
  context: GridRoutingContext,
  searchWorkspace: RouterSearchWorkspace,
  overlayScratch: EndpointOverlayScratch | undefined,
  ownerSideCounts: Map<string, number>,
  selfLoopCounts: Map<string, number>,
  pairRoutes: readonly (readonly Point[])[],
  options: GridRoutingOptions
): { points: Point[]; side: GridSide; index: number } {
  // Try sides in load order and reserve progressively wider port pairs for repeated loops on the
  // same side.
  const containerId = owner.parentId ?? ROOT_CONTAINER_ID;
  const fallbackReason = context.fallbackContainers.get(containerId) as
    | GridRoutingFallbackReason
    | undefined;
  const legacyRoute = (): { points: Point[]; side: GridSide; index: number } =>
    routeObstacleClearSelfLoop(owner, ownerSideCounts, selfLoopCounts, result);
  if (fallbackReason) {
    const legacy = legacyRoute();
    recordFallback(context, fallbackReason, plan.edge.id, containerId);
    if (
      !validateSameContainerRoute(legacy.points, owner, owner, containerId, result) ||
      !routeSatisfiesPairConstraints(legacy.points, pairRoutes)
    ) {
      if (context.metrics) {
        context.metrics.fallbackValidationFailures++;
      }
      throw gridError('GRID_ROUTE_NOT_FOUND', `Invalid legacy fallback for "${plan.edge.id}"`, {
        edgeId: plan.edge.id,
        reason: fallbackReason,
      });
    }
    return legacy;
  }
  const topology = context.topologies.get(containerId);
  if (!topology || !overlayScratch) {
    throw gridError('GRID_ROUTE_NOT_FOUND', `Missing routing topology "${containerId}"`);
  }
  for (const side of orderedSelfLoopSides(owner, ownerSideCounts, selfLoopCounts)) {
    const index = selfLoopCounts.get(`${owner.id}:${side}`) ?? 0;
    const attachments = selfLoopAttachments(owner, side, index);
    if (!attachments) {
      continue;
    }
    const { start, target } = attachments;
    try {
      const overlay = buildEndpointRoutingOverlay(
        topology,
        start.connect,
        target.connect,
        context.metrics,
        overlayScratch,
        [
          {
            x: (start.connect.x + target.connect.x) / 2,
            y: (start.connect.y + target.connect.y) / 2,
          },
        ]
      );
      const sourceId = overlay.pointVertexIds.get(routingPointKey(start.connect));
      const targetId = overlay.pointVertexIds.get(routingPointKey(target.connect));
      if (sourceId === undefined || targetId === undefined) {
        throw gridError(
          'GRID_ROUTE_NOT_FOUND',
          `Self-loop endpoint projection is missing from the routing overlay for "${plan.edge.id}"`,
          {
            edgeId: plan.edge.id,
            containerId,
            source: start.connect,
            target: target.connect,
            side,
          }
        );
      }
      const orientation: GridOrientation = side === 'left' || side === 'right' ? 'H' : 'V';
      const route = findShortestRoute(overlay, sourceId, targetId, {
        metrics: context.metrics,
        caps: {
          ...options.searchCaps,
          maxEstimatedBytes:
            options.searchCaps?.maxEstimatedBytes ??
            options.topologyCaps?.maxEstimatedBytes ??
            DEFAULT_MAX_ROUTING_ESTIMATED_BYTES,
        },
        recordOutcome: false,
        budget: context.searchBudget,
        initialOrientation: orientation,
        initialSide: side,
        initialLength: TERMINAL_APPROACH_PX,
        targetOrientation: orientation,
        targetSide: side,
        targetLength: TERMINAL_APPROACH_PX,
        topologyValidated: true,
        workspace: searchWorkspace,
        estimatedBytesBase:
          context.baseEstimatedBytes + overlay.estimatedBytes - topology.estimatedBytes,
        arcAllowed: (from, to) => pairArcAllowed(from, to, pairRoutes),
      });
      if (!route) {
        continue;
      }
      const points = normalizePolyline([start.port, ...route.points, target.port]).points;
      if (
        validateSameContainerRoute(points, owner, owner, containerId, result) &&
        routeSatisfiesPairConstraints(points, pairRoutes)
      ) {
        return {
          points,
          side,
          index,
        };
      }
    } catch (error) {
      if (!(error instanceof GridRoutingResourceLimitError)) {
        throw error;
      }
      const legacy = legacyRoute();
      recordFallback(context, error.reason, plan.edge.id, containerId, error.searchStateScope);
      if (
        !validateSameContainerRoute(legacy.points, owner, owner, containerId, result) ||
        !routeSatisfiesPairConstraints(legacy.points, pairRoutes)
      ) {
        if (context.metrics) {
          context.metrics.fallbackValidationFailures++;
        }
        throw gridError('GRID_ROUTE_NOT_FOUND', `Invalid legacy fallback for "${plan.edge.id}"`, {
          edgeId: plan.edge.id,
          reason: error.reason,
        });
      }
      return legacy;
    }
  }
  if (context.metrics) {
    context.metrics.routesImpossible++;
  }
  throw gridError('GRID_ROUTE_NOT_FOUND', `No distinct self-loop route for "${plan.edge.id}"`, {
    edgeId: plan.edge.id,
    nodeId: owner.id,
  });
}

export function sparseContainerSegment(
  edgeId: string,
  containerId: GridContainerId,
  start: SegmentAttachment,
  end: SegmentAttachment,
  legacyRoute: () => Point[],
  result: GridLayoutResult,
  context: GridRoutingContext,
  searchWorkspace: RouterSearchWorkspace,
  overlayScratch: EndpointOverlayScratch | undefined,
  options: GridRoutingOptions,
  pairRoutes: readonly (readonly Point[])[] = [],
  endAlternatives: () => readonly SegmentAttachmentAlternative[] = () => [],
  startAlternatives: () => readonly SegmentAttachmentAlternative[] = () => [],
  allowSharedPairCorridors = false
): Point[] {
  const fallbackReason = context.fallbackContainers.get(containerId) as
    | GridRoutingFallbackReason
    | undefined;
  if (fallbackReason) {
    const legacy = legacyRoute();
    recordFallback(context, fallbackReason, edgeId, containerId);
    if (
      !validateContainerSegment(legacy, start.ownerId, end.ownerId, containerId, result) ||
      !routeSatisfiesPairConstraints(legacy, pairRoutes)
    ) {
      if (context.metrics) {
        context.metrics.fallbackValidationFailures++;
      }
      throw gridError('GRID_ROUTE_NOT_FOUND', `Invalid legacy fallback for "${edgeId}"`, {
        edgeId,
        containerId,
        reason: fallbackReason,
      });
    }
    return legacy;
  }
  const topology = context.topologies.get(containerId);
  if (!topology || !overlayScratch) {
    throw gridError('GRID_ROUTE_NOT_FOUND', `Missing routing topology "${containerId}"`);
  }
  const attempts: {
    start: SegmentAttachment;
    end: SegmentAttachment;
    select: readonly (() => void)[];
  }[] = [{ start, end, select: [] }];
  // Alternatives are generated lazily only after the selected attachments fail. Their `select`
  // callbacks commit portal-coordinate changes after a complete route validates.
  let alternativesAdded = false;
  const appendAlternatives = (): void => {
    if (alternativesAdded) {
      return;
    }
    alternativesAdded = true;
    const starts = startAlternatives();
    const ends = endAlternatives();
    attempts.push(
      ...ends.map((alternative) => ({
        start,
        end: alternative.attachment,
        select: [alternative.select],
      })),
      ...starts.map((alternative) => ({
        start: alternative.attachment,
        end,
        select: [alternative.select],
      })),
      ...starts.flatMap((startAlternative) =>
        ends.map((endAlternative) => ({
          start: startAlternative.attachment,
          end: endAlternative.attachment,
          select: [startAlternative.select, endAlternative.select],
        }))
      )
    );
  };
  try {
    for (const [attemptIndex, attempt] of attempts.entries()) {
      const attemptedStart = attempt.start;
      const attemptedEnd = attempt.end;
      if (attemptIndex > 0 && context.metrics) {
        context.metrics.hierarchyPortalAlternativeAttempts++;
      }
      const aligned = areExactlyAxisAligned(attemptedStart.connect, attemptedEnd.connect);
      if (aligned) {
        const direct = normalizePolyline([
          attemptedStart.port,
          attemptedStart.connect,
          attemptedEnd.connect,
          attemptedEnd.port,
        ]).points;
        if (
          validateContainerSegment(
            direct,
            attemptedStart.ownerId,
            attemptedEnd.ownerId,
            containerId,
            result
          ) &&
          routeSatisfiesPairConstraints(direct, pairRoutes)
        ) {
          for (const select of attempt.select) {
            select();
          }
          if (attemptIndex > 0 && context.metrics) {
            context.metrics.hierarchyPortalAlternativeSelections++;
          }
          return direct;
        }
      }
      const overlay = buildEndpointRoutingOverlay(
        topology,
        attemptedStart.connect,
        attemptedEnd.connect,
        context.metrics,
        overlayScratch
      );
      const liveEstimatedBytes =
        context.baseEstimatedBytes + overlay.estimatedBytes - topology.estimatedBytes;
      if (
        liveEstimatedBytes >
        (options.topologyCaps?.maxEstimatedBytes ?? DEFAULT_MAX_ROUTING_ESTIMATED_BYTES)
      ) {
        throw new GridRoutingResourceLimitError(
          'estimated_memory_cap',
          'Grid routing estimated_memory_cap exceeded'
        );
      }
      const sourceId = overlay.pointVertexIds.get(routingPointKey(attemptedStart.connect));
      const targetId = overlay.pointVertexIds.get(routingPointKey(attemptedEnd.connect));
      if (sourceId === undefined || targetId === undefined) {
        if (attemptIndex === 0) {
          appendAlternatives();
        }
        continue;
      }
      const route = findShortestRoute(overlay, sourceId, targetId, {
        metrics: context.metrics,
        caps: {
          ...options.searchCaps,
          maxEstimatedBytes:
            options.searchCaps?.maxEstimatedBytes ??
            options.topologyCaps?.maxEstimatedBytes ??
            DEFAULT_MAX_ROUTING_ESTIMATED_BYTES,
        },
        recordOutcome: false,
        budget: context.searchBudget,
        initialOrientation:
          attemptedStart.side === 'left' || attemptedStart.side === 'right' ? 'H' : 'V',
        initialSide: attemptedStart.side,
        initialLength:
          Math.abs(attemptedStart.port.x - attemptedStart.connect.x) +
          Math.abs(attemptedStart.port.y - attemptedStart.connect.y),
        targetOrientation:
          attemptedEnd.side === 'left' || attemptedEnd.side === 'right' ? 'H' : 'V',
        targetSide: attemptedEnd.side,
        targetLength:
          Math.abs(attemptedEnd.port.x - attemptedEnd.connect.x) +
          Math.abs(attemptedEnd.port.y - attemptedEnd.connect.y),
        topologyValidated: true,
        workspace: searchWorkspace,
        estimatedBytesBase: liveEstimatedBytes,
        arcAllowed:
          pairRoutes.length > 0 ? (from, to) => pairArcAllowed(from, to, pairRoutes) : undefined,
      });
      if (!route) {
        if (attemptIndex === 0) {
          appendAlternatives();
        }
        continue;
      }
      const points = normalizePolyline([
        attemptedStart.port,
        ...route.points,
        attemptedEnd.port,
      ]).points;
      if (
        !validateContainerSegment(
          points,
          attemptedStart.ownerId,
          attemptedEnd.ownerId,
          containerId,
          result
        ) ||
        !routeSatisfiesPairConstraints(points, pairRoutes)
      ) {
        if (attemptIndex === 0) {
          appendAlternatives();
        }
        continue;
      }
      for (const select of attempt.select) {
        select();
      }
      if (attemptIndex > 0 && context.metrics) {
        context.metrics.hierarchyPortalAlternativeSelections++;
      }
      return points;
    }
  } catch (error) {
    if (!(error instanceof GridRoutingResourceLimitError)) {
      throw error;
    }
    const legacy = legacyRoute();
    recordFallback(context, error.reason, edgeId, containerId, error.searchStateScope);
    if (
      !validateContainerSegment(legacy, start.ownerId, end.ownerId, containerId, result) ||
      !routeSatisfiesPairConstraints(legacy, pairRoutes)
    ) {
      if (context.metrics) {
        context.metrics.fallbackValidationFailures++;
      }
      throw gridError('GRID_ROUTE_NOT_FOUND', `Invalid legacy fallback for "${edgeId}"`, {
        edgeId,
        containerId,
        reason: error.reason,
      });
    }
    return legacy;
  }
  const compatibility = legacyRoute();
  // Exhausted sparse geometry may recover through the corridor router. Bundled hierarchy segments
  // can share interior corridors only when their endpoint ports remain distinct.
  if (
    validateContainerSegment(compatibility, start.ownerId, end.ownerId, containerId, result) &&
    (routeSatisfiesPairConstraints(compatibility, pairRoutes) ||
      (allowSharedPairCorridors && routeHasDistinctPairPorts(compatibility, pairRoutes)))
  ) {
    if (context.metrics) {
      context.metrics.compatibilitySegments++;
      context.metrics.compatibilityRecoveries++;
    }
    return compatibility;
  }
  throw gridError(
    'GRID_ROUTE_NOT_FOUND',
    `No hierarchy route for "${edgeId}" in "${containerId}" from ${routingPointKey(start.connect)} to ${routingPointKey(end.connect)}`,
    { edgeId, containerId }
  );
}
