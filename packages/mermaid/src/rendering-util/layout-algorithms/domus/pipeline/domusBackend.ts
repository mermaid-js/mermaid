import type { LayoutData, Node } from '../../../types.js';
import { log } from '../../../../logger.js';
import { ORTHO_DEBUG } from '../debug.js';
import type { OrthogonalOptions } from '../types.js';
import { validateLayout } from '../validateLayoutProxy.js';
import { runDomusRouting } from '../domus/index.js';
import { layoutDataToDomusInput } from '../domus/conversion.js';
import { nudgeLeafNodesForMinimumSpacing } from '../minSpacingNudging.js';
import { nudgeEdgeLabelNodesAwayFromNeighbors } from '../labelNeighborGapNudging.js';
import { nudgeConnectedPairsForMinGap } from '../edgeGapNudging.js';
import { nudgeOverlappingLeafNodes } from '../boxNudging.js';
import { nudgeEdgeLabelNodesToAvoidOverlaps } from '../labelNudging.js';
import { applyPortDirectionStubs } from './portStubs.js';
import { applyMultiCrossingCleanup } from './multiCrossing.js';
import { postProcessDomusOptionBMilestone1 } from '../optionB/postprocess.js';
import { directionViolationRatioForLayout, mirrorLeafNodesInPlace } from './domusDirection.js';
import { isHorizontalOrthoDirection, isVerticalOrthoDirection } from '../core/direction.js';
import { isEdgeLabelNode } from '../core/labels.js';
import { rectForNode } from '../core/helpers.js';
import { buildDirectionPositionConstraints } from './directionConstraints.js';
import { computeAntiparallelCorridorHints } from './antiparallelCorridorHint.js';
import { applyDomusPortDistribution, createPortTAllocator } from './portDistribution.js';
import { applyGxClassSnap } from './gxClassSnap.js';
import { applyStraightCollapsePass } from './straightCollapsePass.js';
import { liftObstacleIntersectingSegments } from './obstacleLiftPass.js';
import { applyObstacleDetourInsertPass } from './obstacleDetourInsertPass.js';
import { applyLibavoidFallbackIfNeeded } from './libavoidFallback.js';
import { partitionDomusValidationIssues } from './validationIssuePartition.js';
import { applyTopPocketCrossingRepairIfImproves } from './topPocketCrossingRepair.js';
import {
  applyEdgePathsToLayout,
  createEdgePathsFromShapeAtPorts,
  derivePortPlanFromShape,
} from '../domus/edgePaths.js';
import { preprocessClusters } from '../cluster.js';

export interface DomusBackendContext {
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

function resyncClusterBoundsToCurrentChildren(data: LayoutData, options: OrthogonalOptions): void {
  if (options.allowDomusWithGroups === false) {
    return;
  }
  const hasGroups = (data.nodes ?? []).some((n) => n?.isGroup);
  if (hasGroups) {
    preprocessClusters(data, options);
  }
}

interface DenseSourceSinkPlacementResult {
  applied: boolean;
  reason?: string;
  nodeCount?: number;
  edgeCount?: number;
  sourceCount?: number;
  sinkCount?: number;
}

function nodeWidth(node: Node): number {
  return Math.max(1, Number(node.width ?? 0));
}

function nodeHeight(node: Node): number {
  return Math.max(1, Number(node.height ?? 0));
}

function stackNodesVertically(nodes: Node[], x: number, gap: number): void {
  const sorted = [...nodes].sort((a, b) => String(a.id ?? '').localeCompare(String(b.id ?? '')));
  const totalHeight =
    sorted.reduce((sum, node) => sum + nodeHeight(node), 0) + Math.max(0, sorted.length - 1) * gap;
  let cursor = -totalHeight / 2;
  for (const node of sorted) {
    const h = nodeHeight(node);
    node.x = x;
    node.y = cursor + h / 2;
    cursor += h + gap;
  }
}

function stackNodesHorizontally(nodes: Node[], y: number, gap: number): void {
  const sorted = [...nodes].sort((a, b) => String(a.id ?? '').localeCompare(String(b.id ?? '')));
  const totalWidth =
    sorted.reduce((sum, node) => sum + nodeWidth(node), 0) + Math.max(0, sorted.length - 1) * gap;
  let cursor = -totalWidth / 2;
  for (const node of sorted) {
    const w = nodeWidth(node);
    node.x = cursor + w / 2;
    node.y = y;
    cursor += w + gap;
  }
}

function maybeApplyDenseSourceSinkPlacement(
  data: LayoutData,
  options: OrthogonalOptions
): DenseSourceSinkPlacementResult {
  if (options.useExistingPositions !== false) {
    return { applied: false, reason: 'existing-positions' };
  }

  const nodes = (data.nodes ?? []).filter((node): node is Node => Boolean(node?.id));
  if (
    nodes.some(
      (node) =>
        node.isGroup || (node as { isEdgeLabel?: boolean }).isEdgeLabel || isEdgeLabelNode(node)
    )
  ) {
    return { applied: false, reason: 'groups-or-labels' };
  }

  const nodesById = new Map(nodes.map((node) => [String(node.id), node]));
  if (nodesById.size < 8) {
    return { applied: false, reason: 'small-graph', nodeCount: nodesById.size };
  }

  const { edges } = layoutDataToDomusInput(data as any);
  const simpleEdges = edges.filter((edge) => edge.from !== edge.to);
  if (simpleEdges.length < nodesById.size * 2) {
    return {
      applied: false,
      reason: 'not-dense',
      nodeCount: nodesById.size,
      edgeCount: simpleEdges.length,
    };
  }

  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();
  for (const id of nodesById.keys()) {
    inDegree.set(id, 0);
    outDegree.set(id, 0);
  }
  for (const edge of simpleEdges) {
    if (!nodesById.has(edge.from) || !nodesById.has(edge.to)) {
      return { applied: false, reason: 'edge-outside-node-set' };
    }
    outDegree.set(edge.from, (outDegree.get(edge.from) ?? 0) + 1);
    inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
  }

  const sources: Node[] = [];
  const sinks: Node[] = [];
  for (const [id, node] of nodesById) {
    const inCount = inDegree.get(id) ?? 0;
    const outCount = outDegree.get(id) ?? 0;
    if (outCount > 0 && inCount === 0) {
      sources.push(node);
    } else if (inCount > 0 && outCount === 0) {
      sinks.push(node);
    } else {
      return {
        applied: false,
        reason: 'not-source-sink',
        nodeCount: nodesById.size,
        edgeCount: simpleEdges.length,
      };
    }
  }
  if (
    sources.length === 0 ||
    sinks.length === 0 ||
    sources.length + sinks.length !== nodesById.size
  ) {
    return { applied: false, reason: 'empty-side' };
  }

  const gap = Math.max(40, (options.spacing ?? 10) * 6);
  const direction = String((data as { direction?: string }).direction ?? 'TB').toUpperCase();
  const sourceMaxWidth = Math.max(...sources.map(nodeWidth));
  const sinkMaxWidth = Math.max(...sinks.map(nodeWidth));
  const sourceMaxHeight = Math.max(...sources.map(nodeHeight));
  const sinkMaxHeight = Math.max(...sinks.map(nodeHeight));

  if (direction === 'LR' || direction === 'RL') {
    const sep = sourceMaxWidth / 2 + sinkMaxWidth / 2 + gap;
    const sourceX = direction === 'RL' ? sep / 2 : -sep / 2;
    const sinkX = direction === 'RL' ? -sep / 2 : sep / 2;
    stackNodesVertically(sources, sourceX, gap);
    stackNodesVertically(sinks, sinkX, gap);
  } else {
    const sep = sourceMaxHeight / 2 + sinkMaxHeight / 2 + gap;
    const sourceY = direction === 'BT' ? sep / 2 : -sep / 2;
    const sinkY = direction === 'BT' ? -sep / 2 : sep / 2;
    stackNodesHorizontally(sources, sourceY, gap);
    stackNodesHorizontally(sinks, sinkY, gap);
  }

  return {
    applied: true,
    nodeCount: nodesById.size,
    edgeCount: simpleEdges.length,
    sourceCount: sources.length,
    sinkCount: sinks.length,
  };
}

function belongsToGroup(node: Node, groupId: string, nodesById: Map<string, Node>): boolean {
  let current: Node | undefined = node;
  const seen = new Set<string>();
  while (current?.parentId != null) {
    const parentId = String(current.parentId);
    if (seen.has(parentId)) {
      break;
    }
    seen.add(parentId);
    if (parentId === groupId) {
      return true;
    }
    const parent = nodesById.get(parentId);
    if (!parent?.isGroup) {
      break;
    }
    current = parent;
  }
  return false;
}

function moveGroupSubtree(
  group: Node,
  delta: { x: number; y: number },
  childrenByParentId: Map<string, Node[]>
): void {
  group.x = (group.x ?? 0) + delta.x;
  group.y = (group.y ?? 0) + delta.y;

  const moveChildren = (parentId: string): void => {
    for (const child of childrenByParentId.get(parentId) ?? []) {
      child.x = (child.x ?? 0) + delta.x;
      child.y = (child.y ?? 0) + delta.y;
      if (child.isGroup) {
        moveChildren(String(child.id));
      }
    }
  };
  moveChildren(String(group.id));
}

function nudgeGroupsAwayFromExternalLeaves(
  data: LayoutData,
  opts: { minGap: number; maxIterations?: number }
): { changed: boolean; moves: number } {
  const direction = String((data as { direction?: string }).direction ?? 'TB');
  const verticalFlow = isVerticalOrthoDirection(direction);
  const horizontalFlow = isHorizontalOrthoDirection(direction);
  if (!verticalFlow && !horizontalFlow) {
    return { changed: false, moves: 0 };
  }

  const nodes = (data.nodes ?? []).filter((node): node is Node => Boolean(node?.id));
  const nodesById = new Map(nodes.map((node) => [String(node.id), node]));
  const groups = nodes
    .filter((node) => node.isGroup)
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
  if (groups.length === 0) {
    return { changed: false, moves: 0 };
  }

  const childrenByParentId = new Map<string, Node[]>();
  for (const node of nodes) {
    if (node.parentId == null) {
      continue;
    }
    const parentId = String(node.parentId);
    const children = childrenByParentId.get(parentId) ?? [];
    children.push(node);
    childrenByParentId.set(parentId, children);
  }

  const leaves = nodes
    .filter((node) => !node.isGroup && !isEdgeLabelNode(node))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  let moves = 0;
  const maxIterations = opts.maxIterations ?? 20;
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let moved = false;

    for (const group of groups) {
      const groupId = String(group.id);
      for (const leaf of leaves) {
        if (belongsToGroup(leaf, groupId, nodesById)) {
          continue;
        }
        const groupRect = rectForNode(group);
        const leafRect = rectForNode(leaf);

        if (verticalFlow) {
          const overlapX =
            Math.min(groupRect.right, leafRect.right) - Math.max(groupRect.left, leafRect.left);
          if (overlapX <= 0) {
            continue;
          }
          const gap =
            leafRect.bottom <= groupRect.top
              ? groupRect.top - leafRect.bottom
              : groupRect.bottom <= leafRect.top
                ? leafRect.top - groupRect.bottom
                : 0;
          if (gap <= 0 || gap >= opts.minGap) {
            continue;
          }
          const push = opts.minGap - gap;
          const dy = groupRect.cy >= leafRect.cy ? push : -push;
          moveGroupSubtree(group, { x: 0, y: dy }, childrenByParentId);
          moves++;
          moved = true;
        } else if (horizontalFlow) {
          const overlapY =
            Math.min(groupRect.bottom, leafRect.bottom) - Math.max(groupRect.top, leafRect.top);
          if (overlapY <= 0) {
            continue;
          }
          const gap =
            leafRect.right <= groupRect.left
              ? groupRect.left - leafRect.right
              : groupRect.right <= leafRect.left
                ? leafRect.left - groupRect.right
                : 0;
          if (gap <= 0 || gap >= opts.minGap) {
            continue;
          }
          const push = opts.minGap - gap;
          const dx = groupRect.cx >= leafRect.cx ? push : -push;
          moveGroupSubtree(group, { x: dx, y: 0 }, childrenByParentId);
          moves++;
          moved = true;
        }
      }
    }

    if (!moved) {
      break;
    }
  }

  return { changed: moves > 0, moves };
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
  if (options.allowDomusWithGroups !== false) {
    const hasGroups = (data.nodes ?? []).some((n) => n?.isGroup);
    if (hasGroups) {
      preprocessClusters(data, options);
    }
  }

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
    log.debug(ORTHO_DEBUG, 'DOMUS_CYCLE_REMOVAL_BRANCH', {
      hasCycle: analysis.hasCycle,
      edgeCount: (data.edges ?? []).length,
    });
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

    // Placement on G_layout (no edge routing from DOMUS here).
    const cycleRemovalRouting = runDomusRouting(data, {
      ...effectiveOptions,
      useExistingPositions: false,
      placementOnly: true,
      edgesOverride: edgesLayout,
    } as any);

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

    // iter-52: resolve any remaining overlaps before routing. DOMUS placement
    // can leave nodes slightly overlapping (e.g. multiple-edges: a/c gap 1.5u),
    // which breaks port assignment and routing-graph anchor computation.
    const overlapPad = Math.max(4, Math.min(40, ctx.spacing));
    nudgeOverlappingLeafNodes(data, {
      padding: overlapPad,
      maxIterations: 60,
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

    // Class snapping can restore DOMUS alignment by moving nodes after the
    // first overlap nudge. Run one final pre-routing separation pass so dense
    // long-label diagrams do not hand impossible obstacle geometry to routing.
    nudgeOverlappingLeafNodes(data, {
      padding: overlapPad,
      maxIterations: 200,
      preferAxis: ctx.preferAxisForVerticalFlow,
    });

    resyncClusterBoundsToCurrentChildren(data, options);

    // Now route the original edges on the fixed node positions.
    routeWithRoutingGraph({
      routingBackend: 'routing-graph',
      routingGraphModel: options.routingGraphModel ?? 'channels',
      useExistingPositions: true,
    });

    // Validate and apply the existing Step-4 safety net if needed.
    let after = validateLayout(data);
    if (!after.ok) {
      if (after.issues.some((iss) => iss.type === 'node-overlap')) {
        const pad = Math.max(4, Math.min(40, ctx.spacing));
        nudgeOverlappingLeafNodes(data, {
          padding: pad,
          maxIterations: 60,
          preferAxis: ctx.preferAxisForVerticalFlow,
        });
      }
      routeWithRoutingGraph({
        routingBackend: 'routing-graph',
        routingGraphModel: options.routingGraphModel ?? 'channels',
        useExistingPositions: true,
      });
      after = validateLayout(data);
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
      const afterStubs = validateLayout(data);
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

    const cyclePathNodesById = new Map<string, Node>();
    for (const n of data.nodes ?? []) {
      if (n?.id != null) {
        cyclePathNodesById.set(String(n.id), n);
      }
    }

    // Company.mmd takes this cycle-removal branch, so the coexistent Libavoid
    // quality fallback must also run here. Previously the early return skipped
    // the shared fallback call below, which is why the browser showed preload
    // success/default enablement but never emitted any LIBAVOID_FALLBACK_* logs
    // and never changed the rendered routes.
    applyLibavoidFallbackIfNeeded({
      data,
      options,
      nodesById: cyclePathNodesById,
      trace: options.trace,
    });
    applyTopPocketCrossingRepairIfImproves(data, { spacing: ctx.spacing });

    return data;
  }

  // iter-21 / R15 full — port-anchored A1 flow.
  log.debug(ORTHO_DEBUG, 'DOMUS_HAPPY_PATH_BRANCH', {
    hasCycle: analysis.hasCycle,
    useExistingPositions: options.useExistingPositions ?? true,
  });

  const densePlacement = maybeApplyDenseSourceSinkPlacement(data, effectiveOptions);
  if (densePlacement.applied) {
    log.debug(ORTHO_DEBUG, 'DENSE_SOURCE_SINK_PLACEMENT', densePlacement);

    nudgeOverlappingLeafNodes(data, {
      padding: Math.max(4, Math.min(40, options.spacing ?? 10)),
      maxIterations: 60,
      preferAxis: ctx.preferAxisForVerticalFlow,
    });
    nudgeLeafNodesForMinimumSpacing(data, {
      minGap: Math.max(30, (options.spacing ?? 10) * 3),
      maxIterations: 60,
      preferAxis: ctx.preferAxisForVerticalFlow,
    });
    resyncClusterBoundsToCurrentChildren(data, options);

    routeWithRoutingGraph({
      routingBackend: 'routing-graph',
      routingGraphModel: options.routingGraphModel ?? 'grid',
      useExistingPositions: true,
    });

    log.debug(ORTHO_DEBUG, 'DENSE_SOURCE_SINK_VALIDATION', {
      ...densePlacement,
      validation: validateLayout(data),
    });
    return data;
  }

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

  if (effectiveOptions.useExistingPositions === false) {
    resyncClusterBoundsToCurrentChildren(data, options);
    const groupExternalGap = nudgeGroupsAwayFromExternalLeaves(data, {
      minGap: Math.max(30, (options.spacing ?? 10) * 3),
      maxIterations: 20,
    });
    if (groupExternalGap.changed) {
      log.debug(ORTHO_DEBUG, 'GROUP_EXTERNAL_LEAF_CLEARANCE', groupExternalGap);
    }
  }

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
  const preStubValidation = validateLayout(data);
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
  const domusValidation = validateLayout(data);
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

    // If we have overlaps involving label nodes, nudge only the label nodes before routing fallback.
    // This addresses cases like Company.mmd where DOMUS placement puts `edge-label-*` on top of a real node.
    const hasLabelOverlap = domusValidation.issues.some(
      (iss) =>
        iss.type === 'node-overlap' &&
        (iss.nodeIds ?? []).some((id) => String(id).startsWith('edge-label-'))
    );
    if (hasLabelOverlap) {
      nudgeEdgeLabelNodesToAvoidOverlaps(data, { padding: 2, maxIterations: 25 });
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

    if (hasLeafOverlap) {
      const pad = Math.max(4, Math.min(40, options.spacing ?? 10));
      nudgeOverlappingLeafNodes(data, {
        padding: pad,
        maxIterations: 200,
        preferAxis: ctx.preferAxisForVerticalFlow,
      });
    }

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
    const after = validateLayout(data);

    // If overlaps still remain after routing fallback, nudge boxes once more and reroute.
    // This stays within Step 4’s “full nudging safety net” and is gated on validator failure.
    if (after.issues.some((iss) => iss.type === 'node-overlap')) {
      const pad = Math.max(4, Math.min(40, options.spacing ?? 10));
      nudgeOverlappingLeafNodes(data, {
        padding: pad,
        maxIterations: 60,
        preferAxis: ctx.preferAxisForVerticalFlow,
      });
      routeWithRoutingGraph({
        routingBackend: 'routing-graph',
        routingGraphModel: fallbackModel,
        useExistingPositions: true,
      });
    }
    const after2 = validateLayout(data);

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

      const afterStubs = validateLayout(data);
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
  }

  // Coexistent Libavoid fallback: keep DOMUS placement and happy-path routing,
  // but allow a fixed-node alternate router to reroute edges when quality gates
  // indicate a validator-clean yet congested layout (e.g. Company.mmd crossings).
  applyLibavoidFallbackIfNeeded({
    data,
    options,
    nodesById: nodesByIdForC1,
    trace: options.trace,
  });

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

  applyTopPocketCrossingRepairIfImproves(data, { spacing });

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
