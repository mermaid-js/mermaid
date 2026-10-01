import type { Point } from '../../../types.js';
import { normalizePolyline, segmentsCross } from '../layout-utils/geometry.js';
import { manhattanLength } from '../layout-utils/helpers.js';

export type GridRoutingFallbackReason =
  | 'vertex_cap'
  | 'adjacency_cap'
  | 'estimated_memory_cap'
  | 'search_state_cap';

export class GridRoutingResourceLimitError extends Error {
  constructor(
    public readonly reason: GridRoutingFallbackReason,
    message: string,
    public readonly searchStateScope?: 'edge' | 'invocation'
  ) {
    super(message);
    this.name = 'GridRoutingResourceLimitError';
  }
}

export interface GridRouteInstrumentation {
  edgeId: string;
  routeOrder: number;
  laneOffset: number;
  routeLength: number;
  bendCount: number;
  crossingCount: number;
  sharedLength: number;
  boundaryTransitionCount: number;
  routeSignature: string;
}

export interface GridRoutingInstrumentation {
  containersBuilt: number;
  baseTopologyBuilds: number;
  baseVertices: number;
  baseAdjacencyEntries: number;
  buildSweepEvents: number;
  endpointOverlayBuilds: number;
  endpointOverlayVertices: number;
  hierarchyPortalPairs: number;
  hierarchyPortalTransitionLength: number;
  hierarchyPortalAlternativeAttempts: number;
  hierarchyPortalAlternativeSelections: number;
  hierarchyBoundaryTransitions: number;
  labelOverlayBuilds: number;
  labelOverlayVertices: number;
  searches: number;
  expandedStates: number;
  maxOpenSet: number;
  routesFound: number;
  routesImpossible: number;
  resourceLimitFallbacks: number;
  fallbackReasons: Record<GridRoutingFallbackReason, number>;
  fallbackValidationFailures: number;
  compatibilitySegments: number;
  compatibilityFastPathAttempts: number;
  compatibilityFastPaths: number;
  compatibilityFastPathValidationFailures: number;
  compatibilityFastPathNonMinimalRoutes: number;
  compatibilityRecoveries: number;
  compatibilityValidationFailures: number;
  bundleRetryAttempts: number;
  bundleRetrySuccesses: number;
  bundleSeparationRelaxations: number;
  routeLength: number;
  bendCount: number;
  crossingCount: number;
  sharedLength: number;
  estimatedBytes: number;
  searchWorkspaceBytes: number;
  routeOrder: string[];
  routes: GridRouteInstrumentation[];
}

export const gridRoutingMetricDisposition = {
  containersBuilt: 'cumulative',
  baseTopologyBuilds: 'cumulative',
  baseVertices: 'cumulative',
  baseAdjacencyEntries: 'cumulative',
  buildSweepEvents: 'cumulative',
  endpointOverlayBuilds: 'cumulative',
  endpointOverlayVertices: 'cumulative',
  hierarchyPortalPairs: 'transactional',
  hierarchyPortalTransitionLength: 'transactional',
  hierarchyPortalAlternativeAttempts: 'cumulative',
  hierarchyPortalAlternativeSelections: 'transactional',
  hierarchyBoundaryTransitions: 'transactional',
  labelOverlayBuilds: 'cumulative',
  labelOverlayVertices: 'cumulative',
  searches: 'cumulative',
  expandedStates: 'cumulative',
  maxOpenSet: 'cumulative',
  routesFound: 'transactional',
  routesImpossible: 'transactional',
  resourceLimitFallbacks: 'cumulative',
  fallbackReasons: 'cumulative',
  fallbackValidationFailures: 'cumulative',
  compatibilitySegments: 'transactional',
  compatibilityFastPathAttempts: 'cumulative',
  compatibilityFastPaths: 'cumulative',
  compatibilityFastPathValidationFailures: 'cumulative',
  compatibilityFastPathNonMinimalRoutes: 'cumulative',
  compatibilityRecoveries: 'transactional',
  compatibilityValidationFailures: 'cumulative',
  bundleRetryAttempts: 'cumulative',
  bundleRetrySuccesses: 'cumulative',
  bundleSeparationRelaxations: 'transactional',
  routeLength: 'transactional',
  bendCount: 'transactional',
  crossingCount: 'transactional',
  sharedLength: 'transactional',
  estimatedBytes: 'cumulative',
  searchWorkspaceBytes: 'cumulative',
  routeOrder: 'transactional',
  routes: 'transactional',
} as const satisfies Record<keyof GridRoutingInstrumentation, 'transactional' | 'cumulative'>;

type TransactionalGridRoutingMetric = {
  [K in keyof typeof gridRoutingMetricDisposition]: (typeof gridRoutingMetricDisposition)[K] extends 'transactional'
    ? K
    : never;
}[keyof typeof gridRoutingMetricDisposition];

type TransactionalGridRoutingValueMetric = Exclude<
  TransactionalGridRoutingMetric,
  'routeOrder' | 'routes'
>;

const transactionalGridRoutingValueMetrics = (
  Object.keys(gridRoutingMetricDisposition) as (keyof GridRoutingInstrumentation)[]
).filter(
  (key): key is TransactionalGridRoutingValueMetric =>
    gridRoutingMetricDisposition[key] === 'transactional' &&
    key !== 'routeOrder' &&
    key !== 'routes'
);

export interface GridRoutingInstrumentationCheckpoint {
  routeOrderLength: number;
  routesLength: number;
  values: Pick<GridRoutingInstrumentation, TransactionalGridRoutingValueMetric>;
}

export function createGridRoutingInstrumentationCheckpoint(
  metrics: GridRoutingInstrumentation
): GridRoutingInstrumentationCheckpoint {
  return {
    routeOrderLength: metrics.routeOrder.length,
    routesLength: metrics.routes.length,
    values: Object.fromEntries(
      transactionalGridRoutingValueMetrics.map((key) => [key, metrics[key]])
    ) as GridRoutingInstrumentationCheckpoint['values'],
  };
}

export function restoreGridRoutingInstrumentationCheckpoint(
  metrics: GridRoutingInstrumentation,
  checkpoint: GridRoutingInstrumentationCheckpoint
): void {
  metrics.routeOrder.length = checkpoint.routeOrderLength;
  metrics.routes.length = checkpoint.routesLength;
  Object.assign(metrics, checkpoint.values);
}

export function createGridRoutingInstrumentation(): GridRoutingInstrumentation {
  return {
    containersBuilt: 0,
    baseTopologyBuilds: 0,
    baseVertices: 0,
    baseAdjacencyEntries: 0,
    buildSweepEvents: 0,
    endpointOverlayBuilds: 0,
    endpointOverlayVertices: 0,
    hierarchyPortalPairs: 0,
    hierarchyPortalTransitionLength: 0,
    hierarchyPortalAlternativeAttempts: 0,
    hierarchyPortalAlternativeSelections: 0,
    hierarchyBoundaryTransitions: 0,
    labelOverlayBuilds: 0,
    labelOverlayVertices: 0,
    searches: 0,
    expandedStates: 0,
    maxOpenSet: 0,
    routesFound: 0,
    routesImpossible: 0,
    resourceLimitFallbacks: 0,
    fallbackReasons: {
      vertex_cap: 0,
      adjacency_cap: 0,
      estimated_memory_cap: 0,
      search_state_cap: 0,
    },
    fallbackValidationFailures: 0,
    compatibilitySegments: 0,
    compatibilityFastPathAttempts: 0,
    compatibilityFastPaths: 0,
    compatibilityFastPathValidationFailures: 0,
    compatibilityFastPathNonMinimalRoutes: 0,
    compatibilityRecoveries: 0,
    compatibilityValidationFailures: 0,
    bundleRetryAttempts: 0,
    bundleRetrySuccesses: 0,
    bundleSeparationRelaxations: 0,
    routeLength: 0,
    bendCount: 0,
    crossingCount: 0,
    sharedLength: 0,
    estimatedBytes: 0,
    searchWorkspaceBytes: 0,
    routeOrder: [],
    routes: [],
  };
}

function intervalOverlap(
  firstStart: number,
  firstEnd: number,
  secondStart: number,
  secondEnd: number
): number {
  return Math.max(
    0,
    Math.min(Math.max(firstStart, firstEnd), Math.max(secondStart, secondEnd)) -
      Math.max(Math.min(firstStart, firstEnd), Math.min(secondStart, secondEnd))
  );
}

function sharedSegmentLength(first: Point[], second: Point[]): number {
  const firstSegments = normalizePolyline(first).segments;
  const secondSegments = normalizePolyline(second).segments;
  let total = 0;

  for (const a of firstSegments) {
    for (const b of secondSegments) {
      if (a.orientation !== b.orientation) {
        continue;
      }
      if (a.orientation === 'H' && a.a.y === b.a.y) {
        total += intervalOverlap(a.a.x, a.b.x, b.a.x, b.b.x);
      } else if (a.orientation === 'V' && a.a.x === b.a.x) {
        total += intervalOverlap(a.a.y, a.b.y, b.a.y, b.b.y);
      }
    }
  }
  return total;
}

export function recordGridRoute(
  metrics: GridRoutingInstrumentation,
  edgeId: string,
  points: Point[],
  previousRoutes: readonly Point[][],
  boundaryTransitionCount = 0,
  laneOffset = 0
): void {
  const normalized = normalizePolyline(points);
  let crossingCount = 0;
  let sharedLength = 0;

  for (const previous of previousRoutes) {
    const previousSegments = normalizePolyline(previous).segments;
    for (const segment of normalized.segments) {
      for (const previousSegment of previousSegments) {
        if (segmentsCross(segment, previousSegment)) {
          crossingCount++;
        }
      }
    }
    sharedLength += sharedSegmentLength(normalized.points, previous);
  }

  const route: GridRouteInstrumentation = {
    edgeId,
    routeOrder: metrics.routes.length,
    laneOffset,
    routeLength: manhattanLength(normalized.points),
    bendCount: normalized.bends,
    crossingCount,
    sharedLength,
    boundaryTransitionCount,
    routeSignature: JSON.stringify(normalized.points),
  };
  metrics.routeOrder.push(edgeId);
  metrics.routes.push(route);
  metrics.routesFound++;
  metrics.routeLength += route.routeLength;
  metrics.bendCount += route.bendCount;
  metrics.crossingCount += route.crossingCount;
  metrics.sharedLength += route.sharedLength;
  metrics.hierarchyBoundaryTransitions += boundaryTransitionCount;
}
