import type { Point } from '../../../types.js';
import type { Edge, LayoutData } from '../../types.js';
import { clamp, compareCodeUnits, rectForNode } from '../layout-utils/helpers.js';
import type { GridRoutingOptions } from './router.js';
import {
  boundaryAttachment,
  boundedAlternativePortalCoordinates,
  buildRoutingContext,
  combinePointChains,
  groupBoundaryEndpointAttachment,
  itemAttachment,
  portalAttachment,
  prepareRoutingModes,
  reversePoints,
  rootContainerMeta,
  routeWithinContainer,
  validatedCompatibilitySegment,
  type PreparedRoutingModes,
  type SegmentAttachment,
  type SegmentAttachmentAlternative,
} from './routerCompatibility.js';
import {
  isPairSeparationError,
  routeHasDistinctPairPorts,
  routeSatisfiesPairConstraints,
  routerRect,
} from './routerConstraint.js';
import {
  ownerGroupTitle,
  prepareEdgeRoutes,
  sideInterval,
  type EdgeEndpointEntry,
  type EdgeEndpointPlan,
  type EdgeRoutePlan,
  type PreparedEdgeRoutes,
} from './routerPlanning.js';
import {
  createGridRoutingInstrumentationCheckpoint,
  recordGridRoute,
  restoreGridRoutingInstrumentationCheckpoint,
  type GridRoutingInstrumentation,
  type GridRoutingInstrumentationCheckpoint,
} from './routerInstrumentation.js';
import { RouterSearchWorkspace } from './routerSearch.js';
import {
  sparseContainerSegment,
  sparseSameContainerRoute,
  sparseSelfLoopRoute,
} from './routerSparse.js';
import { buildPairedPortal, derivePortalRanges, EndpointOverlayScratch } from './routerTopology.js';
import type {
  GridContainerId,
  GridLayoutResult,
  GridRoutingContext,
  PairedPortal,
} from './types.js';
import { ROOT_CONTAINER_ID, gridError } from './types.js';

// The session is the transaction boundary for one routing invocation. It owns mutable reservations,
// reusable search memory, and retry state while the base layout geometry remains read-only.
interface BundleEdgeCheckpoint {
  edge: Edge;
  // Geometry and its rendering contract commit together; retries must not leak either half.
  points: Edge['points'];
  curve: Edge['curve'];
  cornerRadius: Edge['cornerRadius'];
}

interface BundleCheckpoint {
  pairKey: string;
  pairRoutes: Point[][] | undefined;
  pairedPortals: Map<string, PairedPortal>;
  demandCoords: Map<string, number>;
  edges: BundleEdgeCheckpoint[];
  instrumentedRoutesLength: number | undefined;
  metrics: GridRoutingInstrumentationCheckpoint | undefined;
}

function createBundleCheckpoint(
  pairPlans: readonly EdgeRoutePlan[],
  pairRoutes: ReadonlyMap<string, Point[][]>,
  pairedPortals: ReadonlyMap<string, PairedPortal>,
  demandCoords: ReadonlyMap<string, number>,
  instrumentedRoutes: readonly Point[][] | undefined,
  metrics: GridRoutingInstrumentation | undefined
): BundleCheckpoint {
  // Snapshot only state a failed bundle can mutate. Topologies and prepared plans are immutable and
  // intentionally shared across attempts.
  const pairKey = pairPlans[0].pairKey;
  const committedPairRoutes = pairRoutes.get(pairKey);
  return {
    pairKey,
    pairRoutes: committedPairRoutes ? [...committedPairRoutes] : undefined,
    pairedPortals: new Map(pairedPortals),
    demandCoords: new Map(demandCoords),
    edges: pairPlans.map(({ edge }) => ({
      edge,
      points: edge.points,
      curve: edge.curve,
      cornerRadius: edge.cornerRadius,
    })),
    instrumentedRoutesLength: instrumentedRoutes?.length,
    metrics: metrics ? createGridRoutingInstrumentationCheckpoint(metrics) : undefined,
  };
}

function restoreBundleCheckpoint(
  checkpoint: BundleCheckpoint,
  pairRoutes: Map<string, Point[][]>,
  pairedPortals: Map<string, PairedPortal>,
  demandCoords: Map<string, number>,
  instrumentedRoutes: Point[][] | undefined,
  metrics: GridRoutingInstrumentation | undefined
): void {
  if (checkpoint.pairRoutes) {
    pairRoutes.set(checkpoint.pairKey, [...checkpoint.pairRoutes]);
  } else {
    pairRoutes.delete(checkpoint.pairKey);
  }
  pairedPortals.clear();
  for (const [key, portal] of checkpoint.pairedPortals) {
    pairedPortals.set(key, portal);
  }
  demandCoords.clear();
  for (const [key, coordinate] of checkpoint.demandCoords) {
    demandCoords.set(key, coordinate);
  }
  for (const edgeCheckpoint of checkpoint.edges) {
    edgeCheckpoint.edge.points = edgeCheckpoint.points;
    edgeCheckpoint.edge.curve = edgeCheckpoint.curve;
    edgeCheckpoint.edge.cornerRadius = edgeCheckpoint.cornerRadius;
  }
  if (instrumentedRoutes && checkpoint.instrumentedRoutesLength !== undefined) {
    instrumentedRoutes.length = checkpoint.instrumentedRoutesLength;
  }
  if (metrics && checkpoint.metrics) {
    restoreGridRoutingInstrumentationCheckpoint(metrics, checkpoint.metrics);
  }
}

export class GridEdgeRoutingSession {
  private prepared!: PreparedEdgeRoutes;
  private modes!: PreparedRoutingModes;
  private routingContext!: GridRoutingContext;
  private readonly searchWorkspace = new RouterSearchWorkspace();
  private endpointOverlayScratch!: Map<GridContainerId, EndpointOverlayScratch>;
  private readonly pairedPortals = new Map<string, PairedPortal>();
  private readonly ownerSideCounts = new Map<string, number>();
  private instrumentedRoutes!: Point[][] | undefined;
  private readonly selfLoopCounts = new Map<string, number>();
  private readonly pairRoutes = new Map<string, Point[][]>();
  private routed = false;

  constructor(
    private readonly layout: LayoutData,
    private readonly result: GridLayoutResult,
    private readonly metrics: GridRoutingInstrumentation | undefined,
    private readonly options: GridRoutingOptions
  ) {}

  route(): void {
    if (this.routed) {
      throw new Error('Grid edge routing session can only be run once');
    }
    this.routed = true;
    this.prepare();

    // Pair insertion order follows the already canonical plan order; Map preserves that order when
    // bundles are routed as indivisible retry units.
    const plansByPair = new Map<string, EdgeRoutePlan[]>();
    for (const plan of this.prepared.orderedPlans) {
      const pairPlans = plansByPair.get(plan.pairKey) ?? [];
      pairPlans.push(plan);
      plansByPair.set(plan.pairKey, pairPlans);
    }
    for (const pairPlans of plansByPair.values()) {
      this.routeBundle(pairPlans);
    }
  }

  private prepare(): void {
    // Preparation is front-loaded so routing attempts never observe partially built planning or
    // topology state.
    rootContainerMeta(this.result);
    this.prepared = prepareEdgeRoutes(this.layout, this.result);

    this.modes = prepareRoutingModes(this.prepared, this.result, this.metrics, this.options);
    this.routingContext = buildRoutingContext(
      this.modes.routedContainerIds,
      this.result,
      this.metrics,
      this.options
    );
    this.endpointOverlayScratch = new Map(
      [...this.routingContext.topologies].map(([containerId, topology]) => [
        containerId,
        new EndpointOverlayScratch(topology),
      ])
    );
    this.instrumentedRoutes = this.metrics ? [] : undefined;
    for (const demandKey of this.prepared.demandCoords.keys()) {
      const [, , ownerId, side] = demandKey.split(':');
      const key = `${ownerId}:${side}`;
      this.ownerSideCounts.set(key, (this.ownerSideCounts.get(key) ?? 0) + 1);
    }
  }

  private pairedPortal(entry: EdgeEndpointEntry): PairedPortal {
    const existing = this.pairedPortals.get(entry.demandKey);
    if (existing) {
      return existing;
    }
    const owner = this.result.forest.nodeById.get(entry.ownerId);
    if (!owner?.isGroup) {
      throw gridError('GRID_ROUTE_NOT_FOUND', `Missing portal owner "${entry.ownerId}"`);
    }
    const rect = routerRect(owner);
    const coordinate =
      this.prepared.demandCoords.get(entry.demandKey) ??
      (entry.side === 'left' || entry.side === 'right'
        ? (rect.top + rect.bottom) / 2
        : (rect.left + rect.right) / 2);
    const range = derivePortalRanges(entry.ownerId, rect, owner.groupTitleRect).find(
      ({ side }) => side === entry.side
    );
    if (!range) {
      throw gridError(
        'GRID_ROUTE_NOT_FOUND',
        `No legal ${entry.side} portal for "${entry.ownerId}"`
      );
    }
    const portal = buildPairedPortal(
      entry.ownerId,
      rect,
      owner.groupTitleRect ? { ...owner.groupTitleRect } : undefined,
      entry.side,
      clamp(coordinate, range.low, range.high)
    );
    this.pairedPortals.set(entry.demandKey, portal);
    if (this.metrics) {
      this.metrics.hierarchyPortalPairs++;
      this.metrics.hierarchyPortalTransitionLength += portal.transition.length;
    }
    return portal;
  }

  private alternativePairedPortals(
    entry: EdgeEndpointEntry,
    interior = true
  ): SegmentAttachmentAlternative[] {
    const selected = this.pairedPortal(entry);
    const owner = this.result.forest.nodeById.get(entry.ownerId);
    if (!owner?.isGroup) {
      return [];
    }
    const rect = routerRect(owner);
    const range = derivePortalRanges(entry.ownerId, rect, owner.groupTitleRect).find(
      ({ side }) => side === entry.side
    );
    if (!range) {
      return [];
    }
    const container = this.result.containers.get(owner.id);
    const corridors =
      entry.side === 'left' || entry.side === 'right'
        ? container?.horizontalCorridors
        : container?.verticalCorridors;
    // Keep retries bounded and deterministic: nearby established corridors are preferred, with
    // range endpoints available when the originally selected portal blocks a hierarchy segment.
    return boundedAlternativePortalCoordinates(
      selected.tangentialCoordinate,
      range.low,
      range.high,
      corridors ?? []
    ).map((coordinate) => {
      const portal = buildPairedPortal(
        entry.ownerId,
        rect,
        owner.groupTitleRect ? { ...owner.groupTitleRect } : undefined,
        entry.side,
        coordinate
      );
      return {
        attachment: portalAttachment(portal, interior),
        select: () => {
          this.pairedPortals.set(entry.demandKey, portal);
          this.prepared.demandCoords.set(entry.demandKey, coordinate);
        },
      };
    });
  }

  private itemSegmentAttachment(
    entry: EdgeEndpointEntry,
    containerId: GridContainerId
  ): SegmentAttachment {
    return {
      ownerId: entry.ownerId,
      ...itemAttachment(
        entry.ownerId,
        entry.side,
        entry.demandKey,
        containerId,
        this.result,
        this.prepared.demandCoords
      ),
    };
  }

  private alternativeItemAttachments(
    plan: EdgeRoutePlan,
    entry: EdgeEndpointEntry,
    containerId: GridContainerId
  ): SegmentAttachmentAlternative[] {
    const current = this.itemSegmentAttachment(entry, containerId);
    const owner = this.result.forest.nodeById.get(entry.ownerId);
    if (!owner) {
      return [];
    }
    return (['right', 'bottom', 'left', 'top'] as const)
      .filter((side) => side !== current.side && !(side === 'top' && ownerGroupTitle(owner)))
      .map((side) => {
        const interval = sideInterval(owner, side);
        if (!interval) {
          return undefined;
        }
        const rect = rectForNode(owner);
        const center = side === 'left' || side === 'right' ? rect.cy : rect.cx;
        const coordinate = Math.max(
          interval.low,
          Math.min(interval.high, center + plan.laneOffset)
        );
        return {
          ownerId: entry.ownerId,
          ...itemAttachment(
            entry.ownerId,
            side,
            entry.demandKey,
            containerId,
            this.result,
            this.prepared.demandCoords,
            coordinate
          ),
        };
      })
      .filter((attachment): attachment is SegmentAttachment => attachment !== undefined)
      .slice(0, 3)
      .map((attachment) => ({
        attachment,
        select: () => undefined,
      }));
  }

  private routePlan(plan: EdgeRoutePlan, allowHierarchyRelaxation = true): void {
    // A plan is routed in three phases: source ascent, one LCA-container segment, and reversed
    // target descent. The chains are committed only after the combined route satisfies pair rules.
    const result = this.result;
    const routingContext = this.routingContext;
    const searchWorkspace = this.searchWorkspace;
    const endpointOverlayScratch = this.endpointOverlayScratch;
    const demandCoords = this.prepared.demandCoords;
    const ownerSideCounts = this.ownerSideCounts;
    const selfLoopCounts = this.selfLoopCounts;
    const pairRoutes = this.pairRoutes;
    const instrumentedRoutes = this.instrumentedRoutes;
    const metrics = this.metrics;
    const options = this.options;
    const eligibleIds = this.prepared.eligibleIds;
    const endpointCandidatesByEdge = this.prepared.endpointCandidatesByEdge;
    const compatibilityFastRoutes = this.modes.compatibilityFastRoutes;
    const sparseHierarchyIds = this.modes.sparseHierarchyIds;
    const sparseLcaIds = this.modes.sparseLcaIds;
    const edge = plan.edge;
    const sourceNode = edge.start ? result.forest.nodeById.get(edge.start) : undefined;
    const targetNode = edge.end ? result.forest.nodeById.get(edge.end) : undefined;
    if (!sourceNode || !targetNode) {
      throw gridError('GRID_MISSING_ENDPOINT', `Missing endpoint for edge "${edge.id}"`, {
        edgeId: edge.id,
      });
    }

    if (sourceNode.id === targetNode.id) {
      const committedPairRoutes = pairRoutes.get(plan.pairKey) ?? [];
      const { points, side, index } = sparseSelfLoopRoute(
        plan,
        sourceNode,
        result,
        routingContext,
        searchWorkspace,
        endpointOverlayScratch.get(sourceNode.parentId ?? ROOT_CONTAINER_ID),
        ownerSideCounts,
        selfLoopCounts,
        committedPairRoutes,
        options
      );
      const countKey = `${sourceNode.id}:${side}`;
      selfLoopCounts.set(countKey, index + 1);
      edge.points = points;
      // The router owns the polyline; attach its curve contract at the same commit boundary.
      edge.curve = result.config.curve;
      edge.cornerRadius = result.config.edgeCornerRadius;
      committedPairRoutes.push(points);
      pairRoutes.set(plan.pairKey, committedPairRoutes);
      if (metrics && instrumentedRoutes) {
        recordGridRoute(metrics, edge.id, points, instrumentedRoutes, 0, plan.laneOffset);
        instrumentedRoutes.push(points);
      }
      return;
    }

    const sourceFinal = plan.source.chain[plan.source.chain.length - 1];
    const targetFinal = plan.target.chain[plan.target.chain.length - 1];
    const useSparseLca = sparseLcaIds.has(edge.id);
    const lcaStart: SegmentAttachment = useSparseLca
      ? plan.source.finalKind === 'boundary'
        ? groupBoundaryEndpointAttachment(
            sourceFinal.ownerId,
            sourceFinal.side,
            sourceFinal.demandKey,
            result,
            demandCoords
          )
        : plan.source.chain.length > 1
          ? portalAttachment(this.pairedPortal(sourceFinal), false)
          : this.itemSegmentAttachment(sourceFinal, plan.lcaContainerId)
      : {
          ownerId: sourceFinal.ownerId,
          ...(plan.source.finalKind === 'boundary'
            ? boundaryAttachment(
                plan.lcaContainerId,
                sourceFinal.side,
                sourceFinal.demandKey,
                result,
                demandCoords
              )
            : itemAttachment(
                sourceFinal.ownerId,
                sourceFinal.side,
                sourceFinal.demandKey,
                plan.lcaContainerId,
                result,
                demandCoords
              )),
        };
    const lcaEnd: SegmentAttachment = useSparseLca
      ? plan.target.finalKind === 'boundary'
        ? groupBoundaryEndpointAttachment(
            targetFinal.ownerId,
            targetFinal.side,
            targetFinal.demandKey,
            result,
            demandCoords
          )
        : plan.target.chain.length > 1
          ? portalAttachment(this.pairedPortal(targetFinal), false)
          : this.itemSegmentAttachment(targetFinal, plan.lcaContainerId)
      : {
          ownerId: targetFinal.ownerId,
          ...(plan.target.finalKind === 'boundary'
            ? boundaryAttachment(
                plan.lcaContainerId,
                targetFinal.side,
                targetFinal.demandKey,
                result,
                demandCoords
              )
            : itemAttachment(
                targetFinal.ownerId,
                targetFinal.side,
                targetFinal.demandKey,
                plan.lcaContainerId,
                result,
                demandCoords
              )),
        };
    let legacyLcaPoints: Point[] | undefined;
    const legacyRoute = () =>
      (legacyLcaPoints ??= routeWithinContainer(
        plan.lcaContainerId,
        result,
        lcaStart,
        lcaEnd,
        plan.laneIndex
      ));
    const compatibilityFastRoute = compatibilityFastRoutes.get(edge.id);
    const lcaPoints = compatibilityFastRoute
      ? (() => {
          if (metrics) {
            metrics.compatibilityFastPaths++;
          }
          return compatibilityFastRoute;
        })()
      : eligibleIds.has(edge.id)
        ? sparseSameContainerRoute(
            plan,
            endpointCandidatesByEdge.get(edge.id)!.sources,
            endpointCandidatesByEdge.get(edge.id)!.targets,
            sourceNode,
            targetNode,
            legacyRoute,
            result,
            routingContext,
            searchWorkspace,
            endpointOverlayScratch.get(plan.lcaContainerId)!,
            options,
            pairRoutes.get(plan.pairKey) ?? []
          )
        : useSparseLca
          ? sparseContainerSegment(
              edge.id,
              plan.lcaContainerId,
              lcaStart,
              lcaEnd,
              legacyRoute,
              result,
              routingContext,
              searchWorkspace,
              endpointOverlayScratch.get(plan.lcaContainerId),
              options,
              pairRoutes.get(plan.pairKey) ?? [],
              () =>
                plan.target.finalKind === 'item' && plan.target.chain.length > 1
                  ? this.alternativePairedPortals(targetFinal, false)
                  : [],
              () =>
                plan.source.finalKind === 'item' && plan.source.chain.length > 1
                  ? this.alternativePairedPortals(sourceFinal, false)
                  : [],
              plan.bundleSize > 1
            )
          : validatedCompatibilitySegment(
              edge.id,
              plan.lcaContainerId,
              lcaStart,
              lcaEnd,
              legacyRoute,
              result,
              metrics
            );

    const routeHierarchyChain = (endpoint: EdgeEndpointPlan, chains: Point[][]): void => {
      for (let index = 0; index < endpoint.chain.length - 1; index++) {
        const from = endpoint.chain[index];
        const to = endpoint.chain[index + 1];
        if (!sparseHierarchyIds.has(edge.id)) {
          const start: SegmentAttachment = {
            ownerId: from.ownerId,
            ...itemAttachment(
              from.ownerId,
              from.side,
              from.demandKey,
              to.ownerId,
              result,
              demandCoords
            ),
          };
          const end: SegmentAttachment = {
            ownerId: to.ownerId,
            ...boundaryAttachment(to.ownerId, to.side, to.demandKey, result, demandCoords),
          };
          chains.push(
            validatedCompatibilitySegment(
              edge.id,
              to.ownerId,
              start,
              end,
              () => routeWithinContainer(to.ownerId, result, start, end, plan.laneIndex),
              result,
              metrics
            )
          );
          continue;
        }
        const start =
          index === 0
            ? this.itemSegmentAttachment(from, to.ownerId)
            : portalAttachment(this.pairedPortal(from), false);
        const end = portalAttachment(this.pairedPortal(to), true);
        chains.push(
          sparseContainerSegment(
            edge.id,
            to.ownerId,
            start,
            end,
            () => routeWithinContainer(to.ownerId, result, start, end, plan.laneIndex),
            result,
            routingContext,
            searchWorkspace,
            endpointOverlayScratch.get(to.ownerId),
            options,
            pairRoutes.get(plan.pairKey) ?? [],
            () => this.alternativePairedPortals(to),
            () => (index === 0 ? this.alternativeItemAttachments(plan, from, to.ownerId) : []),
            plan.bundleSize > 1
          )
        );
      }
    };
    const sourceChains: Point[][] = [];
    const targetChains: Point[][] = [];
    routeHierarchyChain(plan.source, sourceChains);
    routeHierarchyChain(plan.target, targetChains);

    const points = combinePointChains([
      ...sourceChains,
      lcaPoints,
      ...targetChains.reverse().map((chain) => reversePoints(chain)),
    ]);
    const committedPairRoutes = pairRoutes.get(plan.pairKey) ?? [];
    const satisfiesPairConstraints = routeSatisfiesPairConstraints(points, committedPairRoutes);
    const relaxHierarchySeparation =
      !satisfiesPairConstraints &&
      plan.bundleSize > 1 &&
      plan.source.chain.length + plan.target.chain.length > 2 &&
      routeHasDistinctPairPorts(points, committedPairRoutes);
    if (
      plan.bundleSize > 1 &&
      !satisfiesPairConstraints &&
      (!relaxHierarchySeparation || !allowHierarchyRelaxation)
    ) {
      if (metrics) {
        metrics.routesImpossible++;
      }
      throw gridError('GRID_ROUTE_NOT_FOUND', `No distinct lane route for "${edge.id}"`, {
        edgeId: edge.id,
        reason: relaxHierarchySeparation ? 'pair-separation' : 'no-distinct-route',
      });
    }
    if (relaxHierarchySeparation && metrics) {
      metrics.bundleSeparationRelaxations++;
    }
    edge.points = points;
    // Publish style only after the route satisfies terminal and pair-separation invariants.
    edge.curve = result.config.curve;
    edge.cornerRadius = result.config.edgeCornerRadius;
    committedPairRoutes.push(points);
    pairRoutes.set(plan.pairKey, committedPairRoutes);
    if (metrics && instrumentedRoutes) {
      const boundaryTransitionCount = plan.source.chain.length + plan.target.chain.length - 2;
      recordGridRoute(
        metrics,
        edge.id,
        points,
        instrumentedRoutes,
        boundaryTransitionCount,
        plan.laneOffset
      );
      instrumentedRoutes.push(points);
    }
  }

  private createBundleCheckpoint(pairPlans: readonly EdgeRoutePlan[]): BundleCheckpoint {
    return createBundleCheckpoint(
      pairPlans,
      this.pairRoutes,
      this.pairedPortals,
      this.prepared.demandCoords,
      this.instrumentedRoutes,
      this.metrics
    );
  }

  private restoreBundleCheckpoint(checkpoint: BundleCheckpoint): void {
    restoreBundleCheckpoint(
      checkpoint,
      this.pairRoutes,
      this.pairedPortals,
      this.prepared.demandCoords,
      this.instrumentedRoutes,
      this.metrics
    );
  }

  private routeBundle(pairPlans: EdgeRoutePlan[]): void {
    // Factorial retry strategies are deliberately avoided. Small bundles get one alternate stable
    // ordering, then a final pass that may relax interior hierarchy separation while preserving
    // distinct endpoint ports.
    const canRetry =
      pairPlans.length > 1 &&
      pairPlans.length <= 8 &&
      pairPlans.every(({ edge }) => edge.start !== edge.end);
    if (!canRetry) {
      for (const plan of pairPlans) {
        this.routePlan(plan);
      }
      return;
    }

    // A bundle is the retry unit because earlier siblings reserve pair corridors and portals for
    // later ones. Restore every shared structure before changing route order or the retry becomes
    // biased.
    const checkpoint = this.createBundleCheckpoint(pairPlans);
    let initialError: unknown;
    try {
      for (const plan of pairPlans) {
        this.routePlan(plan, false);
      }
      return;
    } catch (error) {
      initialError = error;
      this.restoreBundleCheckpoint(checkpoint);
      if (this.metrics) {
        this.metrics.bundleRetryAttempts++;
      }
    }

    const retryPlans = [...pairPlans].sort((a, b) => {
      const aBoundaryCount = a.source.chain.length + a.target.chain.length - 2;
      const bBoundaryCount = b.source.chain.length + b.target.chain.length - 2;
      return (
        bBoundaryCount - aBoundaryCount ||
        Math.abs(b.laneOffset) - Math.abs(a.laneOffset) ||
        a.laneOffset - b.laneOffset ||
        compareCodeUnits(a.edge.id, b.edge.id)
      );
    });
    let retryError: unknown;
    try {
      for (const plan of retryPlans) {
        this.routePlan(plan, false);
      }
      if (this.metrics) {
        this.metrics.bundleRetrySuccesses++;
      }
      return;
    } catch (error) {
      retryError = error;
      this.restoreBundleCheckpoint(checkpoint);
    }
    if (!isPairSeparationError(initialError) || !isPairSeparationError(retryError)) {
      throw initialError;
    }
    for (const plan of pairPlans) {
      this.routePlan(plan);
    }
  }
}
