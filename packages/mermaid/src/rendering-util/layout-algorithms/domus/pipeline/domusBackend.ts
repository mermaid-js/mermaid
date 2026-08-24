import type { LayoutData, Node } from '../../../types.js';
import { log } from '../../../../logger.js';
import { ORTHO_DEBUG } from '../debug.js';
import type { OrthogonalOptions, Point } from '../types.js';
import { checkLayout, type ValidateLayoutResult } from '../validateLayoutProxy.js';
import type { Issue } from '../validateLayoutProxy.js';
import { runDomusRouting } from '../domus/index.js';
import { layoutDataToDomusInput } from '../domus/conversion.js';
import { nudgeLeafNodesForMinimumSpacing } from '../minSpacingNudging.js';
import { nudgeEdgeLabelNodesAwayFromNeighbors } from '../labelNeighborGapNudging.js';
import { nudgeConnectedPairsForMinGap } from '../edgeGapNudging.js';
import {
  nudgeLeafNodesAwayFromNonAncestorGroups,
  nudgeOverlappingLeafNodes,
  separateOverlapsBySweep,
} from '../boxNudging.js';
import { nudgeEdgeLabelNodesToAvoidOverlaps } from '../labelNudging.js';
import { applyPortDirectionStubs } from './portStubs.js';
import { applyMultiCrossingCleanup } from './multiCrossing.js';
import { postProcessDomusOptionBMilestone1 } from '../optionB/postprocess.js';
import { directionViolationRatioForLayout, mirrorLeafNodesInPlace } from './domusDirection.js';
import { isHorizontalOrthoDirection, isVerticalOrthoDirection } from '../core/direction.js';
import { buildDirectionPositionConstraints } from './directionConstraints.js';
import { computeAntiparallelCorridorHints } from './antiparallelCorridorHint.js';
import { applyDomusPortDistribution, createPortTAllocator } from './portDistribution.js';
import { applyGxClassSnap } from './gxClassSnap.js';
import { applyStraightCollapsePass } from './straightCollapsePass.js';
import { liftObstacleIntersectingSegments } from './obstacleLiftPass.js';
import { applyObstacleDetourInsertPass } from './obstacleDetourInsertPass.js';
import { repairShortEndpointStubs } from './endpointStubRepair.js';
import { repairEndpointApproachesWhenIssuesImprove } from './endpointExteriorRepair.js';
import { repairNonOrthogonalEdgesWhenIssuesImprove } from './nonOrthogonalRepairPass.js';
import { applyLayeredPlacementFallback } from './layeredPlacementFallback.js';
import { snapEndpointsToBoundaries } from './snapEndpointsToBoundaries.js';
import {
  applyEdgePathsToLayout,
  createEdgePathsFromShapeAtPorts,
  derivePortPlanFromShape,
} from '../domus/edgePaths.js';
import { preprocessClusters } from '../cluster.js';
import { finalizeDummyLabelNodesToOverlayLabels } from '../finalizeOverlayLabels.js';

/**
 * R13 / iter-8: split DOMUS validation issues into "conventional" and "real".
 *
 * DOMUS emits polylines with endpoints at node centers — `insertEdge` clips
 * them to node borders at paint time (see comment in
 * `domus/edgePaths.ts:createMermaidStyleOrthogonalPath`). `validateLayout`
 * runs *before* paint, so it flags those center endpoints as
 * `edge-endpoint-inside-node` and the trivial first/last segment that exits
 * the rect as `edge-intersects-obstacle`. Both are artefacts of the
 * center-based convention, NOT real routing failures.
 *
 * An issue is "conventional" iff:
 *  - `type === 'edge-endpoint-inside-node'` AND the offending node is the
 *    edge's own start or end, OR
 *  - `type === 'edge-intersects-obstacle'` AND the obstacle is the edge's
 *    own start or end.
 *
 * Anything else (endpoint inside a third node, segment crossing a
 * non-endpoint obstacle, non-orthogonal segment, port-direction mismatch,
 * border hugging, label off edge, node overlap, etc.) is a "real" failure
 * and still triggers the routing-graph fallback at line 263.
 *
 * Without this split, every fixture with non-trivial geometry triggered the
 * fallback, wiping the shape-walked output produced by R1/Phase A1.
 */
export function partitionDomusValidationIssues(
  issues: readonly Issue[],
  data: LayoutData
): { conventional: Issue[]; real: Issue[] } {
  const edgeEndpoints = new Map<string, { start: string; end: string }>();
  const edgePointsLength = new Map<string, number>();
  for (const e of data.edges ?? []) {
    if (e?.id == null || e.start == null || e.end == null) {
      continue;
    }
    edgeEndpoints.set(String(e.id), { start: String(e.start), end: String(e.end) });
    edgePointsLength.set(String(e.id), e.points?.length ?? 0);
  }
  const conventional: Issue[] = [];
  const real: Issue[] = [];
  for (const iss of issues) {
    if (isConventionalCenterEndpointIssue(iss, edgeEndpoints, edgePointsLength)) {
      conventional.push(iss);
    } else {
      real.push(iss);
    }
  }
  return { conventional, real };
}

function cloneLayoutForCyclicShapeScoring(data: LayoutData): LayoutData {
  return {
    ...data,
    config: data.config ? { ...(data.config as Record<string, unknown>) } : data.config,
    nodes: (data.nodes ?? []).map((node) => ({
      ...(node as unknown as Record<string, unknown>),
    })) as unknown as LayoutData['nodes'],
    edges: (data.edges ?? []).map((edge) => ({
      ...(edge as unknown as Record<string, unknown>),
      points: edge.points?.map((point) => ({ x: point.x, y: point.y })),
    })) as LayoutData['edges'],
  };
}

function copyPoints(points: readonly Point[] | undefined): Point[] | undefined {
  return points?.map((point) => ({ x: point.x, y: point.y }));
}

function flipVerticalPortSide(side: string): string {
  if (side === 'N') {
    return 'S';
  }
  if (side === 'S') {
    return 'N';
  }
  return side;
}

function postFinalizeValidationScore(data: LayoutData): ValidateLayoutResult {
  const finalized = cloneLayoutForCyclicShapeScoring(data);
  finalizeDummyLabelNodesToOverlayLabels(finalized);
  return checkLayout(finalized);
}

function createCyclicShapeCandidatePaths(
  data: LayoutData,
  domusResult: NonNullable<ReturnType<typeof runDomusRouting>['domusResult']>,
  spacing: number
): Map<string, Point[]> {
  if (!domusResult.shape || !domusResult.graph) {
    return new Map();
  }

  const shapeCandidate = cloneLayoutForCyclicShapeScoring(data);
  const portPlan = derivePortPlanFromShape(
    domusResult,
    (shapeCandidate.edges ?? []) as readonly { id: string; start?: string; end?: string }[]
  );
  for (const entry of portPlan.values()) {
    entry.startSide = flipVerticalPortSide(entry.startSide) as typeof entry.startSide;
    entry.endSide = flipVerticalPortSide(entry.endSide) as typeof entry.endSide;
  }
  if (portPlan.size === 0) {
    return new Map();
  }

  const nodesById = new Map<string, Node>();
  for (const n of shapeCandidate.nodes ?? []) {
    if (n?.id != null) {
      nodesById.set(String(n.id), n);
    }
  }
  const { tByEdgeEndpointKey } = createPortTAllocator({
    data: shapeCandidate,
    nodesById,
    portPlan,
  });
  const paths = createEdgePathsFromShapeAtPorts(
    shapeCandidate,
    domusResult,
    portPlan,
    tByEdgeEndpointKey
  );
  applyEdgePathsToLayout(shapeCandidate, paths);
  snapEndpointsToBoundaries(shapeCandidate, { tolerance: 1.5 });
  repairShortEndpointStubs(shapeCandidate, { minLength: spacing });

  const candidatePaths = new Map<string, Point[]>();
  for (const edge of shapeCandidate.edges ?? []) {
    if (edge?.id != null && edge.points && edge.points.length >= 2) {
      candidatePaths.set(String(edge.id), copyPoints(edge.points) ?? []);
    }
  }
  return candidatePaths;
}

function applyCyclicShapeEdgeCandidatesWhenScoreImproves(
  data: LayoutData,
  candidatePaths: Map<string, Point[]>
): { accepted: number; fromScore: number; toScore: number } {
  if (candidatePaths.size === 0) {
    return { accepted: 0, fromScore: 0, toScore: 0 };
  }

  const baseline = postFinalizeValidationScore(data);
  if (!baseline.ok) {
    return { accepted: 0, fromScore: baseline.score, toScore: baseline.score };
  }

  let bestScore = baseline.score;
  let accepted = 0;
  for (const edge of data.edges ?? []) {
    if (edge?.id == null) {
      continue;
    }
    const edgeId = String(edge.id);
    const candidate = candidatePaths.get(edgeId);
    if (!candidate || candidate.length < 2) {
      continue;
    }

    const trial = cloneLayoutForCyclicShapeScoring(data);
    const trialEdge = (trial.edges ?? []).find((e) => String(e?.id ?? '') === edgeId);
    if (!trialEdge) {
      continue;
    }
    trialEdge.points = copyPoints(candidate);

    const trialResult = postFinalizeValidationScore(trial);
    if (!trialResult.ok || trialResult.score <= bestScore) {
      continue;
    }

    edge.points = copyPoints(candidate);
    bestScore = trialResult.score;
    accepted++;
  }

  return { accepted, fromScore: baseline.score, toScore: bestScore };
}

function isConventionalCenterEndpointIssue(
  iss: Issue,
  edgeEndpoints: Map<string, { start: string; end: string }>,
  edgePointsLength: Map<string, number>
): boolean {
  if (iss.type !== 'edge-endpoint-inside-node' && iss.type !== 'edge-intersects-obstacle') {
    return false;
  }
  if (!iss.edgeId) {
    return false;
  }
  const ep = edgeEndpoints.get(String(iss.edgeId));
  if (!ep) {
    return false;
  }
  const obstacleId = iss.nodeIds?.[0];
  if (!obstacleId) {
    return false;
  }
  if (obstacleId !== ep.start && obstacleId !== ep.end) {
    return false;
  }
  // iter-46: for `edge-intersects-obstacle`, require the segment to be
  // first (index 0) or last (index points.length - 2). Middle segments
  // crossing the edge's own endpoint node's interior are genuine routing
  // failures (Siebenhaller edge/vertex disjointness; DOMUS §2 segment-
  // interior invariant), not paint-time clip artefacts. `edge-endpoint-
  // inside-node` has no segmentIndex and retains the original suppression.
  if (iss.type === 'edge-intersects-obstacle') {
    const segIdx = (iss as { details?: { segmentIndex?: number } }).details?.segmentIndex;
    if (segIdx == null) {
      return false;
    }
    const pointsLen = edgePointsLength.get(String(iss.edgeId)) ?? 0;
    const lastSegIdx = pointsLen - 2;
    if (segIdx !== 0 && segIdx !== lastSegIdx) {
      return false;
    }
  }
  return true;
}

export function refreshClustersAfterLeafPlacement(
  data: LayoutData,
  options: OrthogonalOptions
): void {
  if (options.allowDomusWithGroups === false) {
    return;
  }
  const hasGroups = (data.nodes ?? []).some((node) => node?.isGroup);
  if (!hasGroups) {
    return;
  }
  preprocessClusters(data, options);
}

interface DomusBackendContext {
  analysis: {
    hasCycle: boolean;
    antiParallelPairs: unknown[];
    multiEdgeGroups: unknown[];
  };
  spacing: number;
  /**
   * Axis preference derived from flow direction: 'x' for vertical flow (TB/BT),
   * undefined for horizontal flow (LR/RL). Downstream nudgers accept
   * `preferAxis?: 'x' | 'y'` so undefined is the "no preference" sentinel.
   */
  preferAxisForVerticalFlow?: 'x' | 'y';
}

export function maybeHandleDomusBackend(args: {
  data: LayoutData;
  options: OrthogonalOptions;
  ctx: DomusBackendContext;
  backend: NonNullable<OrthogonalOptions['routingBackend']>;
  // Callback so this module doesn't import pipeline.ts (avoids circular deps).
  routeWithRoutingGraph: (overrides: Partial<OrthogonalOptions>) => LayoutData;
}): LayoutData | null {
  const { data, options, ctx, backend, routeWithRoutingGraph } = args;
  const analysis = ctx.analysis;

  if (backend !== 'domus') {
    return null;
  }

  // iter-25 / D1-v1 pragmatic (Phase D / R5). iter-27 flipped the default to
  // on: `allowDomusWithGroups` is considered true unless the caller
  // explicitly passes `false` (escape hatch). Size group rectangles from
  // children's bbox before running DOMUS; groups remain filtered out of
  // the DOMUS vertex list (`conversion.ts:26`) so only leaves enter
  // SAT/drawability. Mirrors `nonDomusPipeline.ts:69` for the
  // routing-graph path. Siebenhaller §3 paper-faithful `c_t/c_b`
  // vertices confirmed unnecessary for Mermaid by iter-26 diagnostic.
  refreshClustersAfterLeafPlacement(data, options);

  // A4: encode flowchart direction as hard SAT position constraints on the
  // FAS-reduced acyclic edge subset (SCC filter) so DOMUS produces a
  // direction-respecting shape directly, not via post-hoc mirroring. Only
  // applied when DOMUS is computing placement (useExistingPositions=false)
  // and the caller didn't already supply explicit positionConstraints. When
  // DOMUS is routing only (positions fixed by an upstream layout), direction
  // constraints don't help and can cause the SAT to emit geometries that
  // contradict the fixed positions. Paper: Siebenhaller §planarization
  // (source `21f7ca55`), DOMUS §5 (source `6784b3d1`).
  //
  // Gated on `options.respectFlowDirection` (default `false`). The DOMUS
  // paper layout is direction-agnostic; this is a Mermaid product extension.
  // Default-off keeps DOMUS paper-faithful for fixtures that reproduce
  // paper figures (e.g. `domus1.mmd`). Mermaid product code should opt in
  // explicitly when honouring user-declared flowchart direction matters.
  const effectiveOptions: OrthogonalOptions = (() => {
    const isPlacing = options.useExistingPositions === false;
    let next: OrthogonalOptions = options;

    // iter-3 / A4: direction position constraints (respectFlowDirection).
    if (options.respectFlowDirection && isPlacing) {
      const userConstraints = next.constraints ?? {};
      if ((userConstraints.positionConstraints ?? []).length === 0) {
        const directionConstraints = buildDirectionPositionConstraints(data);
        if (directionConstraints.length > 0) {
          next = {
            ...next,
            constraints: {
              ...userConstraints,
              positionConstraints: directionConstraints,
            },
          };
        }
      }
    }

    // iter-37: anti-parallel diagonal corridor hint (DOMUS §7 side-
    // constraints). For anti-parallel pairs, emits `allowedLabels`
    // restricting the two edges to a shared vertical/horizontal
    // corridor. Paper anchor: DOMUS §6 (source `6784b3d1`).
    //
    // **Default-on as of iter-37 (user decision)** — visible cleanup of
    // anti-parallel routing on company-simp (USC↔HKC pair lands in clean
    // vertical corridor, HKC→Wages becomes straight). Trade-off: SAT
    // placement reshuffle exposed other edge-routing pathologies (notably
    // USC→Expenses 5-bend detour through HK pill) — those become the
    // iter-38 targets. Opt-out: pass `enableAntiparallelCorridorHints:
    // false` to suppress.
    if (isPlacing && options.enableAntiparallelCorridorHints !== false) {
      const nodesById = new Map<string, Node>();
      for (const n of data.nodes ?? []) {
        if (n?.id != null && !n.isGroup) {
          nodesById.set(String(n.id), n);
        }
      }
      const corridorHints = computeAntiparallelCorridorHints(
        data,
        (analysis.antiParallelPairs ?? []) as Parameters<
          typeof computeAntiparallelCorridorHints
        >[1],
        nodesById
      );
      if (corridorHints.length > 0) {
        const userConstraints = next.constraints ?? {};
        next = {
          ...next,
          constraints: {
            ...userConstraints,
            edgeConstraints: [...(userConstraints.edgeConstraints ?? []), ...corridorHints],
          },
        };
        log.debug(ORTHO_DEBUG, 'ITER37_ANTIPARALLEL_CORRIDOR_HINTS', {
          hintCount: corridorHints.length,
          hints: corridorHints,
        });
      }
    }

    return next;
  })();

  // Step 2 (prompt.md): cycle removal for layout only.
  //
  // When the input has directed cycles, DOMUS placement can become unstable (overlaps),
  // especially with anti-parallel/multi-edge structures. Inspired by Sugiyama’s
  // “Cycle Removal” phase, we compute a layout-only acyclic view G_layout by
  // reversing a deterministic set of edges, run placement on G_layout, and then
  // route the original edges on the fixed node positions.
  //
  // Reference: `full-papers/diss.md`, §2.4.1 “Cycle Removal” (and Fig. 2.10(b)):
  // edges are reversed internally to obtain an acyclic graph; directions are restored
  // for the final drawing.
  if (options.useExistingPositions === false && analysis.hasCycle) {
    const { vertexIds, edges } = layoutDataToDomusInput(data as any);

    // Compute a layout-only acyclic view G_layout by reversing back-edges
    // identified via DFS. This preserves the intended hierarchy much better
    // than the previous alphabetical ordering.
    //
    // Reference: Sugiyama et al. (1981), Section 3.1
    const reversedEdgeIds = new Set<string>();
    const visited = new Set<string>();
    const stack = new Set<string>();

    const adj = new Map<string, { to: string; id: string }[]>();
    for (const v of vertexIds) {
      adj.set(v, []);
    }
    for (const e of edges) {
      adj.get(e.from)?.push({ to: e.to, id: e.id });
    }

    function dfs(u: string) {
      visited.add(u);
      stack.add(u);
      for (const { to, id } of adj.get(u) ?? []) {
        if (stack.has(to)) {
          reversedEdgeIds.add(id);
        } else if (!visited.has(to)) {
          dfs(to);
        }
      }
      stack.delete(u);
    }

    for (const v of vertexIds) {
      if (!visited.has(v)) {
        dfs(v);
      }
    }

    let reversedCount = 0;
    const edgesLayout = edges.map((e) => {
      if (reversedEdgeIds.has(e.id)) {
        reversedCount++;
        return { ...e, from: e.to, to: e.from };
      }
      return e;
    });

    if (reversedCount > 0) {
      log.debug(ORTHO_DEBUG, 'CYCLE_REMOVAL_DFS_LAYOUT', {
        reversedEdges: reversedCount,
        totalEdges: edgesLayout.length,
      });
    }

    // Preserve the pre-placement geometry for optional shape-candidate routing.
    // The main placement below may include anti-parallel corridor hints in
    // `effectiveOptions`; those are useful for node placement, but a separate
    // candidate-only shape run without the injected hints can produce simpler
    // edge candidates. Candidates remain guarded by full post-finalize
    // validation before they can affect `data`.
    const cycleInputForShapeCandidates = cloneLayoutForCyclicShapeScoring(data);

    // Placement on G_layout (no edge routing from DOMUS here).
    const cycleRemovalRouting = runDomusRouting(data, {
      ...effectiveOptions,
      useExistingPositions: false,
      placementOnly: true,
      edgesOverride: edgesLayout,
    } as any);

    // Placement-failure fallback. When DOMUS UNSAT (e.g. multi-edge
    // graphs that exceed per-vertex label distinctness once edges
    // are split), `runDomusRouting` returns early without calling
    // `updateNodePositions`, leaving every leaf node with `y === undefined`.
    // The downstream nudgers and the routing-graph fallback then operate
    // on a layout where every routed segment collapses to y ≈ 0. Apply
    // a Sugiyama-style longest-path layering (paper anchor: Sugiyama
    // 1981 §3.1, same paper that drives the cycle-removal step above) so
    // every leaf node ends with finite (x, y) before nudging / routing.
    if (!cycleRemovalRouting.success) {
      const fallbackResult = applyLayeredPlacementFallback(
        data,
        { vertexIds, edgesLayout },
        {
          xStep: Math.max(120, ctx.spacing * 12),
          yStep: Math.max(120, ctx.spacing * 12),
        }
      );
      log.debug(ORTHO_DEBUG, 'CYCLE_PATH_PLACEMENT_FALLBACK', {
        placed: fallbackResult.placedNodeIds.length,
        ranks: fallbackResult.rankCount,
        maxRankSize: fallbackResult.maxRankSize,
      });
    }

    let cyclicShapeCandidatePaths: Map<string, Point[]> | undefined;
    if (cycleRemovalRouting.success && cycleRemovalRouting.domusResult?.shape) {
      const candidateOnlyInput = cloneLayoutForCyclicShapeScoring(cycleInputForShapeCandidates);
      const candidateOnlyRouting = runDomusRouting(candidateOnlyInput, {
        ...options,
        useExistingPositions: false,
        placementOnly: true,
        edgesOverride: edgesLayout,
      } as any);
      cyclicShapeCandidatePaths =
        candidateOnlyRouting.success && candidateOnlyRouting.domusResult?.shape
          ? createCyclicShapeCandidatePaths(
              candidateOnlyInput,
              candidateOnlyRouting.domusResult,
              ctx.spacing
            )
          : createCyclicShapeCandidatePaths(data, cycleRemovalRouting.domusResult, ctx.spacing);
    }

    // Aesthetics hardening (gated to cyclic graphs): ensure a minimum gap between leaf boxes
    // so adjacent nodes don’t look “cramped” even when not overlapping (user feedback).
    nudgeLeafNodesForMinimumSpacing(data, {
      minGap: Math.max(30, ctx.spacing * 3),
      maxIterations: 60,
      // Prefer preserving vertical layering in flowchart TB/BT layouts.
      preferAxis: ctx.preferAxisForVerticalFlow,
    });

    // Ensure edge-label nodes have breathing room near their endpoints.
    nudgeEdgeLabelNodesAwayFromNeighbors(data, {
      minGap: Math.max(20, ctx.spacing * 2),
      preferAxis: ctx.preferAxisForVerticalFlow,
    });

    // Additional clearance for directly connected pairs so arrowheads have room.
    nudgeConnectedPairsForMinGap(data, {
      minGap: Math.max(50, ctx.spacing * 5),
      preferAxis: ctx.preferAxisForVerticalFlow,
    });

    // iter-48: Gx/Gy class-median snap on the cycle-removal path. Same
    // paper invariant as the fallback-block snap (DOMUS §3 Theorem 2 /
    // Siebenhaller §2.3.2.1) — the nudgers above are class-unaware and
    // routinely drift chain members by a few units to widen local gaps
    // (company-simp HKC ends up 5u LEFT of Customer/USC/Incomehk despite
    // all three chain edges being U/D labelled). Snap restores class
    // x/y equality before the routing-graph fallback lays down polylines.
    if (
      cycleRemovalRouting.success &&
      cycleRemovalRouting.domusResult?.shape &&
      cycleRemovalRouting.domusResult.graph
    ) {
      const snapThreshold = Math.max(4, ctx.spacing * 2);
      const snapStats = applyGxClassSnap(
        data,
        cycleRemovalRouting.domusResult.graph,
        cycleRemovalRouting.domusResult.shape,
        snapThreshold
      );
      log.debug(ORTHO_DEBUG, 'ITER48_GX_CLASS_SNAP_CYCLE_PATH', {
        ...snapStats,
        threshold: snapThreshold,
      });
    }

    // Coordinate assignment is finished here — the Gx snap above was the last
    // thing to move a leaf — and nothing has been routed yet, so this is the one
    // point where residual overlap can be cleared for free. Later is worse in
    // two ways: the snap undoes the separation, and moving an endpoint after
    // routing re-opens the route and every repair pass that already ran on it.
    separateOverlapsBySweep(data, {
      padding: Math.max(4, Math.min(40, ctx.spacing)),
      preferAxis: ctx.preferAxisForVerticalFlow,
    });

    // DOMUS moves only leaf vertices; refresh group rectangles from their
    // descendants before any routing pass reads group endpoints/boundaries.
    refreshClustersAfterLeafPlacement(data, options);

    // Now route the original edges on the fixed node positions.
    routeWithRoutingGraph({
      routingBackend: 'routing-graph',
      routingGraphModel: options.routingGraphModel ?? 'channels',
      useExistingPositions: true,
    });

    // Validate and apply the existing Step-4 safety net if needed.
    let after = checkLayout(data);
    if (!after.ok) {
      if (after.issues.some((iss) => iss.type === 'node-overlap')) {
        const pad = Math.max(4, Math.min(40, ctx.spacing));
        nudgeOverlappingLeafNodes(data, {
          padding: pad,
          maxIterations: 60,
          preferAxis: ctx.preferAxisForVerticalFlow,
        });
        // Re-snap: this nudger is class-unaware for exactly the reason iter-48
        // documents above, and it runs AFTER that snap, so any drift it
        // introduces reaches the router unsnapped. Cheap to demonstrate — it
        // knocked Company.mmd's `Income`/`Tax` column 5.8px out of alignment,
        // which is under the snap threshold but enough to stop
        // `applyStraightCollapsePass` recognising a same-column pair, turning a
        // straight 2-point edge into a 4-point zigzag.
        if (
          cycleRemovalRouting.success &&
          cycleRemovalRouting.domusResult?.shape &&
          cycleRemovalRouting.domusResult.graph
        ) {
          const snapThreshold = Math.max(4, ctx.spacing * 2);
          const reSnapStats = applyGxClassSnap(
            data,
            cycleRemovalRouting.domusResult.graph,
            cycleRemovalRouting.domusResult.shape,
            snapThreshold
          );
          log.debug(ORTHO_DEBUG, 'ITER48_GX_CLASS_SNAP_AFTER_OVERLAP_NUDGE', {
            ...reSnapStats,
            threshold: snapThreshold,
          });
        }
      }
      refreshClustersAfterLeafPlacement(data, options);
      routeWithRoutingGraph({
        routingBackend: 'routing-graph',
        routingGraphModel: options.routingGraphModel ?? 'channels',
        useExistingPositions: true,
      });
      after = checkLayout(data);
    }

    // Port-stub repair for any remaining port-direction mismatches.
    // (This mirrors the DOMUS fallback repair, but applies to the Step-2 placement path.)
    const portMismatchEdgeIds = new Set<string>(
      after.issues
        .filter((iss) => iss.type === 'edge-port-direction-mismatch' && iss.edgeId)
        .map((iss) => String(iss.edgeId))
    );
    if (!after.ok && portMismatchEdgeIds.size > 0) {
      const stubLen = Math.max(2, Math.min(20, options.spacing ?? 10));
      const { changed } = applyPortDirectionStubs(data, portMismatchEdgeIds, stubLen);
      const afterStubs = checkLayout(data);
      log.debug(ORTHO_DEBUG, 'CYCLE_REMOVAL_PORT_STUBS', {
        edgeCount: portMismatchEdgeIds.size,
        changed,
        stubLen,
        ok: afterStubs.ok,
        issueCount: afterStubs.issues.length,
      });
    }

    // iter-49: same-column / same-row straight-collapse + consecutive-
    // duplicate dedup. Siebenhaller §5.3 bend-stretching analogue. Closes
    // Income↔Tax 5-point zigzag on Company.mmd (both at x=462.5; port-stub
    // inflation above creates a U-turn through Income's interior). Safe-by-
    // default: collapse fires only when centers align AND the direct segment
    // is obstacle-clear.
    const collapseStats = applyStraightCollapsePass(data);
    if (collapseStats.collapsedEdges > 0 || collapseStats.dedupedEdges > 0) {
      log.debug(ORTHO_DEBUG, 'ITER49_STRAIGHT_COLLAPSE_CYCLE_PATH', collapseStats);
    }

    // iter-50: obstacle-lift pass (iter-38 helper wired into cycle-removal
    // path). Siebenhaller §2.3.2.1 edge-vertex disjointness (source
    // `0fb2d84f`) + Wybrow §3 OVG "no intervening object" (source
    // `e8804c93`). Handles middle-segment crossings of non-endpoint
    // obstacles (e.g., Company.mmd `L_HKC_ExpensesHK_0` running through
    // ExpensesHK's interior). iter-50 extended the helper with collinear-
    // run detection so a sequence of same-axis segments crossing an
    // obstacle is detoured as one logical run.
    const liftStats = liftObstacleIntersectingSegments(data, { spacing: ctx.spacing });
    if (liftStats.changed > 0) {
      log.debug(ORTHO_DEBUG, 'ITER50_OBSTACLE_LIFT_CYCLE_PATH', liftStats);
    }

    // iter-51: detour-insertion pass. Case A fallback when
    // `liftObstacleIntersectingSegments` can't shift the offending
    // segment (e.g. Company.mmd `L_HKC_ExpHK_0` — both shift candidates
    // fail because shifting puts pts[1] inside HKC or across Customer).
    // Inserts 2-3 detour waypoints that bend perpendicular BEFORE the
    // obstacle, traverse past it, then reconnect to the post-offender
    // anchor point. Port perpendicularity preserved.
    const detourStats = applyObstacleDetourInsertPass(data, { spacing: ctx.spacing });
    if (detourStats.changed > 0) {
      log.debug(ORTHO_DEBUG, 'ITER51_OBSTACLE_DETOUR_INSERT_CYCLE_PATH', detourStats);
    }

    const cyclePathSnapStats = snapEndpointsToBoundaries(data, { tolerance: 1.5 });
    if (cyclePathSnapStats.snapped > 0) {
      log.debug(ORTHO_DEBUG, 'CYCLE_PATH_ENDPOINT_BOUNDARY_SNAP', cyclePathSnapStats);
    }

    const endpointStats = repairShortEndpointStubs(data, { minLength: ctx.spacing });
    if (endpointStats.repaired > 0) {
      log.debug(ORTHO_DEBUG, 'CYCLE_PATH_ENDPOINT_STUB_REPAIR', endpointStats);
    }

    if (cyclicShapeCandidatePaths && cyclicShapeCandidatePaths.size > 0) {
      const shapeEdgeStats = applyCyclicShapeEdgeCandidatesWhenScoreImproves(
        data,
        cyclicShapeCandidatePaths
      );
      if (shapeEdgeStats.accepted > 0) {
        log.debug(ORTHO_DEBUG, 'CYCLE_PATH_SHAPE_EDGE_CANDIDATES_ACCEPTED', shapeEdgeStats);
      }
    }

    return data;
  }

  // iter-21 / R15 full — port-anchored A1 flow.
  //
  // Previous flow (iter-19 B+D):
  //   runDomusRouting → createEdgePathsFromShape (centres) → derivePortPlanFromPaths
  //   (geometric) → applyDomusPortDistribution (push endpoints to ports, may
  //   produce diagonals) → applyPortDirectionStubs (repair).
  //
  // New flow:
  //   runDomusRouting with skipEdgePaths=true → derivePortPlanFromShape (labels
  //   authoritative) → createPortTAllocator → createEdgePathsFromShapeAtPorts
  //   (polylines anchored at ports from the start) → applyDomusPortDistribution
  //   (safety no-op by idempotence guard) → iter-11 D stubs (residual cleanup).
  //
  // Paper anchors: DOMUS §3 (label IS segment direction); Siebenhaller
  // §2.3.2.1 (port distribution at vertex-expansion time).
  const domusRouting = runDomusRouting(data, {
    ...effectiveOptions,
    useExistingPositions: effectiveOptions.useExistingPositions ?? true,
    skipEdgePaths: (effectiveOptions.useExistingPositions ?? true) === true,
  });

  // iter-48: promote iter-47 Gx/Gy class snap to the happy path. DOMUS §3
  // Theorem 2 (source `6784b3d1`) + Siebenhaller §2.3.2.1 (source
  // `0fb2d84f`) make Gx-class x-equality (and Gy-class y-equality) a
  // structural LP invariant of pass-1 compaction — any post-metric drift
  // is a Mermaid pipeline bug, not a paper trade-off. Iter-47 landed the
  // snap inside the validation-failure fallback at line ~616, but fixtures
  // whose DOMUS output passes `validateLayout` (e.g. company-simp) never
  // entered the fallback, so the metric-phase splay went uncorrected.
  // Snap runs BEFORE R15/C1/R14 so downstream edge paths read snapped
  // coords directly — no polyline x-fixup needed. Threshold 2*spacing
  // keeps intentional larger placements untouched.
  if (domusRouting.success && domusRouting.domusResult?.shape && domusRouting.domusResult.graph) {
    const snapThreshold = Math.max(4, (options.spacing ?? 10) * 2);
    const snapStats = applyGxClassSnap(
      data,
      domusRouting.domusResult.graph,
      domusRouting.domusResult.shape,
      snapThreshold
    );
    log.debug(ORTHO_DEBUG, 'ITER48_GX_CLASS_SNAP_HAPPY_PATH', {
      ...snapStats,
      threshold: snapThreshold,
    });
  }

  // DOMUS placement excludes groups from the SAT vertex list, so group
  // rectangles must be recomputed around the newly placed leaves before
  // port planning/routing sees group endpoints.
  refreshClustersAfterLeafPlacement(data, options);

  const nodesByIdForC1 = new Map<string, Node>();
  for (const n of data.nodes ?? []) {
    if (n?.id != null) {
      nodesByIdForC1.set(String(n.id), n);
    }
  }

  let r15PortPlan: ReturnType<typeof derivePortPlanFromShape> | undefined;
  if (domusRouting.success && domusRouting.domusResult?.shape && domusRouting.domusResult.graph) {
    r15PortPlan = derivePortPlanFromShape(
      domusRouting.domusResult,
      (data.edges ?? []) as readonly { id: string; start?: string; end?: string }[]
    );

    if (r15PortPlan.size > 0) {
      const { tByEdgeEndpointKey } = createPortTAllocator({
        data,
        nodesById: nodesByIdForC1,
        portPlan: r15PortPlan,
      });
      const paths = createEdgePathsFromShapeAtPorts(
        data,
        domusRouting.domusResult,
        r15PortPlan,
        tByEdgeEndpointKey
      );
      applyEdgePathsToLayout(data, paths);
      log.debug(ORTHO_DEBUG, 'R15_PORT_ANCHORED_A1', {
        edges: paths.size,
        portPlanEntries: r15PortPlan.size,
      });
    }
  }

  // C1 / iter-9 — kept as a safety net. Idempotent per iter-21 guard: if
  // the R15 flow already anchored endpoints at the allocator's port t,
  // this is a no-op. When R15 flow fell through (shape absent, allocator
  // unavailable), C1 performs the pre-R15 push. portPlan source prefers
  // R15's shape-derived plan; falls back to geometric (iter-19 B).
  const effectivePortPlan =
    r15PortPlan && r15PortPlan.size > 0 ? r15PortPlan : domusRouting.portPlan;
  const c1Stats = applyDomusPortDistribution(data, nodesByIdForC1, effectivePortPlan);
  log.debug(ORTHO_DEBUG, 'C1_PORT_DISTRIBUTION', {
    ...c1Stats,
    portPlanEntries: effectivePortPlan?.size ?? 0,
    r15Active: r15PortPlan != null && r15PortPlan.size > 0,
  });

  // R14 / iter-11 — chained port-direction stub repair.
  //
  // C1's `computeOrthogonalElbow` only inserts an elbow when the first/last
  // segment is diagonal. When A1's shape walk produces an interior bend
  // collinear with the new boundary port (`dx<eps` for an E/W port, or
  // `dy<eps` for an N/S port), the segment is axis-aligned but on the WRONG
  // axis for the port side — leaves the validator with
  // `edge-port-direction-mismatch`. The stub helper at portStubs.ts already
  // handles this case in the cycle-removal path (line ~281); apply it here
  // too. Stub length matches the cycle-removal path. Reuses the same
  // `validateLayout` call below for the gate decision (no double-validation).
  //
  // iter-19 D — also pass edges whose first or last segment is diagonal
  // (flagged as `edge-non-orthogonal` at segmentIndex 0 or last). With B's
  // portPlan-driven side override, C1 can push an endpoint off-axis from
  // A1's centre-anchored bend, producing a diagonal first/last segment
  // that the validator does NOT emit as `edge-port-direction-mismatch`
  // (the mismatch check skips `dir === null`). The helper's extended
  // condition (firstDir !== sSide, null included) inserts the L-stub.
  // Paper anchor: Siebenhaller §5.2.2 "insert two additional bends".
  const preStubValidation = checkLayout(data);
  const portMismatchEdgeIds = new Set<string>(
    preStubValidation.issues
      .filter((iss) => iss.type === 'edge-port-direction-mismatch' && iss.edgeId)
      .map((iss) => String(iss.edgeId))
  );
  for (const iss of preStubValidation.issues) {
    if (iss.type !== 'edge-non-orthogonal' || !iss.edgeId) {
      continue;
    }
    const details = iss.details as { segmentIndex?: number; points?: unknown[] } | undefined;
    if (!details || typeof details.segmentIndex !== 'number') {
      continue;
    }
    const pointCount = Array.isArray(details.points) ? details.points.length : 0;
    if (pointCount < 2) {
      continue;
    }
    if (details.segmentIndex === 0 || details.segmentIndex === pointCount - 2) {
      portMismatchEdgeIds.add(String(iss.edgeId));
    }
  }
  if (portMismatchEdgeIds.size > 0) {
    const stubLen = Math.max(2, Math.min(20, options.spacing ?? 10));
    const { changed } = applyPortDirectionStubs(data, portMismatchEdgeIds, stubLen);
    log.debug(ORTHO_DEBUG, 'C1_PORT_STUBS', {
      mismatchCount: portMismatchEdgeIds.size,
      changed,
      stubLen,
    });
  }

  // Step 4 gate (prompt.md): validate and fall back only when invalid.
  // Rationale: preserve existing DOMUS output for happy cases; only change behavior when
  // correctness invariants are violated (e.g., non-orthogonal segments or node intersections).
  //
  // Iter-8 / R13 amendment: DOMUS emits center-based polylines that
  // `insertEdge` clips at paint time. `validateLayout` runs *before* paint
  // and flags those center endpoints as `edge-endpoint-inside-node` plus the
  // attachment segment as `edge-intersects-obstacle` — neither is a real
  // routing failure. Partition issues so the gate fires only on real
  // failures; without this split, R1/Phase A1's shape-walked output is
  // unconditionally wiped by the fallback. See `partitionDomusValidationIssues`
  // above for the rule.
  const domusValidation = checkLayout(data);
  const partitioned = partitionDomusValidationIssues(domusValidation.issues, data);

  // Log node positions before any nudging for overlap analysis
  const preNudgeNodes: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    isGroup: boolean;
  }[] = [];
  for (const node of data.nodes ?? []) {
    if (node?.id != null) {
      preNudgeNodes.push({
        id: String(node.id),
        x: node.x ?? 0,
        y: node.y ?? 0,
        width: node.width ?? 0,
        height: node.height ?? 0,
        isGroup: node.isGroup ?? false,
      });
    }
  }
  log.debug(ORTHO_DEBUG, 'PRE_NUDGE_NODE_POSITIONS', {
    validationOk: domusValidation.ok,
    nodeCount: preNudgeNodes.length,
    nodes: preNudgeNodes,
  });

  if (partitioned.real.length > 0) {
    log.debug(ORTHO_DEBUG, 'DOMUS_VALIDATION_FAILED_FALLBACK_ROUTING_GRAPH', {
      issueCount: domusValidation.issues.length,
      realIssueCount: partitioned.real.length,
      conventionalIssueCount: partitioned.conventional.length,
      issues: partitioned.real.slice(0, 10),
    });

    // If placement yielded leaf overlaps, apply a minimal “full nudging” pass (prompt.md Step 4)
    // that is allowed to move boxes slightly. This is gated on validator failure.
    const hasLeafOverlap = domusValidation.issues.some((iss) => iss.type === 'node-overlap');
    if (hasLeafOverlap) {
      const overlapIssues = domusValidation.issues.filter((iss) => iss.type === 'node-overlap');
      log.debug(ORTHO_DEBUG, 'NUDGE_BOX_ENTER', {
        hasLeafOverlap,
        overlapCount: overlapIssues.length,
        overlappingPairs: overlapIssues.map((iss) => iss.nodeIds),
        preferAxis: ctx.preferAxisForVerticalFlow,
      });
      const pad = Math.max(4, Math.min(40, options.spacing ?? 10));
      nudgeOverlappingLeafNodes(data, {
        padding: pad,
        maxIterations: 60,
        // Prefer preserving vertical layering in flowchart TB/BT/TD/DT layouts.
        preferAxis: ctx.preferAxisForVerticalFlow,
      });
      nudgeLeafNodesAwayFromNonAncestorGroups(data, {
        padding: pad,
        maxIterations: 60,
        preferAxis: ctx.preferAxisForVerticalFlow,
      });
      refreshClustersAfterLeafPlacement(data, options);
    }
    // If we had placement instability, also ensure minimum spacing so fixes aren’t razor-thin.
    nudgeLeafNodesForMinimumSpacing(data, {
      minGap: Math.max(30, (options.spacing ?? 10) * 3),
      maxIterations: 60,
      preferAxis: ctx.preferAxisForVerticalFlow,
    });
    nudgeEdgeLabelNodesAwayFromNeighbors(data, {
      minGap: Math.max(20, (options.spacing ?? 10) * 2),
      preferAxis: ctx.preferAxisForVerticalFlow,
    });
    nudgeConnectedPairsForMinGap(data, {
      minGap: Math.max(50, (options.spacing ?? 10) * 5),
      preferAxis: ctx.preferAxisForVerticalFlow,
    });
    refreshClustersAfterLeafPlacement(data, options);

    // If we have overlaps involving label nodes, nudge only the label nodes before routing fallback.
    // This addresses cases like Company.mmd where DOMUS placement puts `edge-label-*` on top of a real node.
    const hasLabelOverlap = domusValidation.issues.some(
      (iss) =>
        iss.type === 'node-overlap' &&
        (iss.nodeIds ?? []).some((id) => String(id).startsWith('edge-label-'))
    );
    if (hasLabelOverlap) {
      nudgeEdgeLabelNodesToAvoidOverlaps(data, { padding: 2, maxIterations: 25 });
      refreshClustersAfterLeafPlacement(data, options);
    }

    // iter-47: Gx/Gy equivalence-class snap. Nudgers above are class-
    // unaware and routinely shift chain members by a few units to gain
    // local spacing, breaking DOMUS §3 Theorem 2 (source `6784b3d1`) /
    // Siebenhaller KM99 equality-arc invariant (source `0fb2d84f`).
    // Snap re-aligns each class's members to their post-nudge median,
    // gated on class spread ≤ 2×spacing so intentional larger shifts
    // are preserved. Runs before routing-graph fallback so edges get
    // clean port placement on snapped positions.
    if (domusRouting.success && domusRouting.domusResult?.shape && domusRouting.domusResult.graph) {
      const snapThreshold = Math.max(4, (options.spacing ?? 10) * 2);
      const snapStats = applyGxClassSnap(
        data,
        domusRouting.domusResult.graph,
        domusRouting.domusResult.shape,
        snapThreshold
      );
      log.debug(ORTHO_DEBUG, 'ITER47_GX_CLASS_SNAP', { ...snapStats, threshold: snapThreshold });
    }

    // Same boundary as the cycle-removal branch: the snap was the last thing to
    // move a leaf, nothing is routed yet. `domus/architecture4` reaches the
    // router through here, which is why clearing overlap on that branch alone
    // left it untouched. Bounded by the sweep's own extent guard — this branch
    // carries the large fixtures, and an unbounded sweep on those is what made
    // the routing graph allocate itself to death.
    separateOverlapsBySweep(data, {
      padding: Math.max(4, Math.min(40, options.spacing ?? 10)),
      preferAxis: ctx.preferAxisForVerticalFlow,
    });

    // Re-run routing using the routing-graph backend while keeping node positions fixed.
    // This is a conservative fallback that aims to satisfy orthogonality + obstacle avoidance.
    // For graphs with cycles/multi-edges, prefer a stronger routing-graph model.
    const fallbackModel =
      options.routingGraphModel ??
      (analysis.hasCycle ||
      (analysis.antiParallelPairs ?? []).length > 0 ||
      (analysis.multiEdgeGroups ?? []).length > 0
        ? 'channels'
        : 'grid');

    routeWithRoutingGraph({
      routingBackend: 'routing-graph',
      routingGraphModel: fallbackModel,
      useExistingPositions: true,
    });
    const after = checkLayout(data);

    // If overlaps still remain after routing fallback, nudge boxes once more and reroute.
    // This stays within Step 4’s “full nudging safety net” and is gated on validator failure.
    if (after.issues.some((iss) => iss.type === 'node-overlap')) {
      const pad = Math.max(4, Math.min(40, options.spacing ?? 10));
      nudgeOverlappingLeafNodes(data, {
        padding: pad,
        maxIterations: 60,
        preferAxis: ctx.preferAxisForVerticalFlow,
      });
      nudgeLeafNodesAwayFromNonAncestorGroups(data, {
        padding: pad,
        maxIterations: 60,
        preferAxis: ctx.preferAxisForVerticalFlow,
      });
      refreshClustersAfterLeafPlacement(data, options);
      routeWithRoutingGraph({
        routingBackend: 'routing-graph',
        routingGraphModel: fallbackModel,
        useExistingPositions: true,
      });
    }
    const after2 = checkLayout(data);

    // If we still have any "port direction mismatch" issues, add short orthogonal
    // "stubs" outside the node boundary so the first/last segment direction
    // matches the boundary side. This is gated to validator failure and only
    // applies in the DOMUS fallback path.
    const portMismatchEdgeIds = new Set<string>(
      after2.issues
        .filter((iss) => iss.type === 'edge-port-direction-mismatch' && iss.edgeId)
        .map((iss) => String(iss.edgeId))
    );
    if (!after2.ok && portMismatchEdgeIds.size > 0) {
      const spacing = options.spacing ?? 10;
      const stubLen = Math.max(2, Math.min(20, spacing));
      const { changed } = applyPortDirectionStubs(data, portMismatchEdgeIds, stubLen);

      const afterStubs = checkLayout(data);
      log.debug(ORTHO_DEBUG, 'DOMUS_FALLBACK_PORT_STUBS', {
        edgeCount: portMismatchEdgeIds.size,
        changed,
        stubLen,
        ok: afterStubs.ok,
        issueCount: afterStubs.issues.length,
      });
    } else {
      log.debug(ORTHO_DEBUG, 'DOMUS_FALLBACK_VALIDATION', {
        ok: after2.ok,
        issueCount: after2.issues.length,
      });
    }

    const fallbackSnapStats = snapEndpointsToBoundaries(data, { tolerance: 1.5 });
    if (fallbackSnapStats.snapped > 0) {
      log.debug(ORTHO_DEBUG, 'DOMUS_FALLBACK_ENDPOINT_BOUNDARY_SNAP', fallbackSnapStats);
    }

    const endpointRepairs = repairShortEndpointStubs(data, { minLength: options.spacing ?? 10 });
    if (endpointRepairs.repaired > 0) {
      log.debug(ORTHO_DEBUG, 'DOMUS_FALLBACK_ENDPOINT_STUB_REPAIR', endpointRepairs);
    }

    const endpointExteriorRepairs = repairEndpointApproachesWhenIssuesImprove(data, {
      spacing: options.spacing ?? 10,
    });
    if (endpointExteriorRepairs.changed > 0) {
      log.debug(ORTHO_DEBUG, 'DOMUS_FALLBACK_ENDPOINT_EXTERIOR_REPAIR', endpointExteriorRepairs);
    }

    const nonOrthogonalRepairs = repairNonOrthogonalEdgesWhenIssuesImprove(data, {
      spacing: options.spacing ?? 10,
    });
    if (nonOrthogonalRepairs.changed > 0) {
      log.debug(ORTHO_DEBUG, 'DOMUS_FALLBACK_NON_ORTHOGONAL_REPAIR', nonOrthogonalRepairs);
    }
  }

  // Option B (Milestone 1): apply bundle ordering + nudging on top of DOMUS routes.
  const spacing = options.spacing ?? 10;
  const postProcessDomus = options.postProcessDomus ?? false;
  if (postProcessDomus && spacing > 0) {
    if (options.trace) {
      options.trace.stages.push({ name: 'path-ordering' });
      options.trace.stages.push({ name: 'spacing' });
    }

    // Use the Milestone-1 constrained nudger (χ + neighbor constraints + H→V→H)
    // rather than the legacy spacing helper.
    postProcessDomusOptionBMilestone1(data, options);
    applyMultiCrossingCleanup(data);
  }

  return data;
}

export function maybeApplyCompoundDomusPlacementOnly(args: {
  data: LayoutData;
  options: OrthogonalOptions;
  hasGroups: boolean;
  requestedBackend: NonNullable<OrthogonalOptions['routingBackend']>;
  backend: NonNullable<OrthogonalOptions['routingBackend']>;
}): void {
  const { data, options, hasGroups, requestedBackend, backend } = args;

  // Compound DOMUS placement-only: do DOMUS placement first, then proceed with
  // routing-graph compound routing.
  if (!(hasGroups && requestedBackend === 'domus' && options.useExistingPositions === false)) {
    return;
  }
  // Only do this if the chosen backend for routing is not already domus.
  if (backend === 'domus') {
    return;
  }

  runDomusRouting(data, {
    ...options,
    useExistingPositions: false,
  });

  // Strict direction correction: if DOMUS placement comes out "mostly reversed"
  // relative to the diagram direction, mirror leaf nodes along the primary axis.
  // This is intentionally orthogonal-scoped and only runs on the compound DOMUS placement path.
  const dir = (data as any)?.direction as string | undefined;
  const ratio = directionViolationRatioForLayout(data, dir);
  if (ratio > 0.5) {
    const axis: 'x' | 'y' | null = isVerticalOrthoDirection(dir)
      ? 'y'
      : isHorizontalOrthoDirection(dir)
        ? 'x'
        : null;
    if (axis) {
      log.debug(ORTHO_DEBUG, 'DOMUS_DIRECTION_MIRROR', { dir, ratio, axis });
      mirrorLeafNodesInPlace(data, axis);
    }
  }
}
