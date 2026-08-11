/**
 * DOMUS Runner
 *
 * This module provides the high-level entry point for running DOMUS-based
 * routing on Mermaid LayoutData.
 */

import type { LayoutData } from '../../../types.js';
import type { Point } from '../types.js';
import { log } from '../../../../logger.js';
import { ORTHO_DEBUG } from '../debug.js';
import { runDomus, gridToPixelCoordinates, reconstructEdgePaths } from './domus.js';
import type { DomusResult, DomusOptions } from './types.js';
import { layoutDataToDomusInput, extractNodeSizes, updateNodePositions } from './conversion.js';
import {
  createEdgePathsFromShape,
  applyEdgePathsToLayout,
  derivePortPlanFromPaths,
} from './edgePaths.js';
import type { PortPlan } from './edgePaths.js';
import type { PortSide } from '../types.js';
import { rectForNode } from '../core/helpers.js';
import { computeBoundaryPortAtT } from '../core/geometry.js';
import type { AssignedPortPlan } from '../core/portAssignment.js';
import { assignPortsForGraph } from '../core/portAssignment.js';

/**
 * Options for DOMUS-based routing.
 */
export interface DomusRoutingOptions extends DomusOptions {
  /** Grid spacing for coordinate conversion (default: 100) */
  gridSpacing?: number;
  /** Base offset for coordinates (default: `\{ x: 50, y: 50 \}`) */
  baseOffset?: Point;
  /** Whether to prefer existing node positions (default: true) */
  useExistingPositions?: boolean;
  /**
   * Orthogonal pipeline spacing (passed through from `OrthogonalOptions.spacing`).
   * Used to derive padding for self-loops and node padding for DOMUS compaction.
   */
  spacing?: number;

  /**
   * Optional override for the DOMUS input edge list.
   *
   * Used for layout-only cycle removal (prompt.md Step 2): run placement on a
   * modified graph while keeping rendered semantics (original LayoutData edges)
   * unchanged for routing.
   */
  edgesOverride?: { id: string; from: string; to: string }[];

  /**
   * If true, run DOMUS to compute node positions only (when `useExistingPositions=false`)
   * and do not generate/apply edge paths.
   *
   * This enables “placement on G_layout, routing on original graph” workflows.
   */
  placementOnly?: boolean;

  /**
   * iter-21 / R15 — if true and `useExistingPositions=true`, skip the
   * default `createEdgePathsFromShape` call so the caller can derive
   * portPlan from shape labels first and then invoke
   * `createEdgePathsFromShapeAtPorts` with port anchors. The caller
   * gets `{ success, domusResult }` only; no edgePaths, no portPlan,
   * no self-loop routing (caller must handle self-loops).
   */
  skipEdgePaths?: boolean;
}

/**
 * Result of DOMUS routing.
 */
export interface DomusRoutingResult {
  /** Whether routing was successful */
  success: boolean;
  /** DOMUS algorithm result */
  domusResult?: DomusResult;
  /** Edge paths as polylines */
  edgePaths?: Map<string, Point[]>;
  /**
   * Per-edge port plan derived from the walked shape (iter-19 / Phase B).
   * Authoritative over `assignPortsForEdge`'s positional heuristic when
   * downstream port distribution consumes it.
   */
  portPlan?: PortPlan;
}

/**
 * Run DOMUS-based routing on a LayoutData.
 *
 * This is the main entry point for using DOMUS in the orthogonal pipeline.
 *
 * @param layout - The LayoutData with nodes (positions set) and edges
 * @param options - DOMUS routing options
 * @returns The routing result
 */
export function runDomusRouting(
  layout: LayoutData,
  options: DomusRoutingOptions = {}
): DomusRoutingResult {
  const {
    gridSpacing = 100,
    baseOffset = { x: 50, y: 50 },
    useExistingPositions = true,
    debug = false,
    edgesOverride,
    placementOnly = false,
    skipEdgePaths = false,
    ...domusOptions
  } = options;

  // Always-visible (at debug log level) execution markers for real-world debugging.
  // We intentionally do not depend on `options.debug` here; log level controls visibility.
  log.debug(ORTHO_DEBUG, 'DOMUS_RUN_ENTER', {
    useExistingPositions,
    gridSpacing,
    baseOffset,
  });

  // Convert LayoutData to DOMUS input
  const { vertexIds, edges: defaultEdges } = layoutDataToDomusInput(layout);
  const edges = edgesOverride ?? defaultEdges;

  // Extract node sizes for dimension-aware compaction
  const nodeSizes = extractNodeSizes(layout);

  if (vertexIds.length === 0) {
    return { success: true }; // No nodes to route
  }

  const applySelfLoopRoutes = (): void => {
    const nodesById = new Map<string, any>();
    for (const n of layout.nodes ?? []) {
      if (n?.id != null) {
        nodesById.set(String(n.id), n);
      }
    }
    const pad = Math.max(20, (options.spacing ?? 10) * 4);
    let loopPlan: AssignedPortPlan | null = null;
    for (const e of layout.edges ?? []) {
      if (e?.start == null || e?.end == null) {
        continue;
      }
      const s = String(e.start);
      const t = String(e.end);
      if (s !== t) {
        continue;
      }
      const n = nodesById.get(s);
      if (!n) {
        continue;
      }
      const r = rectForNode(n);
      const edgeIdKey = String((e as any).id ?? `${s}->${t}`);
      loopPlan ??= assignPortsForGraph(layout as any, nodesById as any, options.spacing ?? 10);
      const startEp = loopPlan.startByEdgeId.get(edgeIdKey);
      const endEp = loopPlan.endByEdgeId.get(edgeIdKey);
      const side: PortSide = startEp?.side ?? endEp?.side ?? 'E';
      const pStart = startEp?.port ?? computeBoundaryPortAtT(r, side, 0.4);
      const pEnd = endEp?.port ?? computeBoundaryPortAtT(r, side, 0.6);

      // Route: boundary → outside corner → outside corner → boundary
      let points: Point[];
      if (side === 'E' || side === 'W') {
        const xOut = side === 'E' ? r.right + pad : r.left - pad;
        points = [pStart, { x: xOut, y: pStart.y }, { x: xOut, y: pEnd.y }, pEnd];
      } else {
        const yOut = side === 'S' ? r.bottom + pad : r.top - pad;
        points = [pStart, { x: pStart.x, y: yOut }, { x: pEnd.x, y: yOut }, pEnd];
      }

      (e as any).points = points;
    }
  };

  if (edges.length === 0) {
    // No non-self-loop edges for DOMUS; still ensure self-loops have usable geometry.
    applySelfLoopRoutes();
    return { success: true };
  }

  log.debug(ORTHO_DEBUG, 'DOMUS_RUN_GRAPH', {
    vertexIds: vertexIds.length,
    edges: edges.length,
  });

  if (debug) {
    log.debug(ORTHO_DEBUG, 'domus_runner_input', {
      vertexIds: vertexIds.length,
      edges: edges.length,
    });
  }

  // Run DOMUS
  // Automatic orientation heuristic: since layoutOrthogonalNodes currently
  // produces a top-down layered layout, we prefer vertical edges by default
  // to maintain the hierarchical flow.
  const finalOptions: DomusOptions = {
    debug,
    nodeSizes,
    nodePadding: options.spacing ? options.spacing * 4 : 40,
    constraints: {
      preferVertical: true,
      ...domusOptions.constraints,
    },
    ...domusOptions,
  };

  const domusResult = runDomus(vertexIds, edges, finalOptions);

  if (!domusResult.success) {
    log.debug(ORTHO_DEBUG, 'DOMUS_RUN_RESULT', {
      success: false,
      stats: domusResult.stats,
    });
    if (debug) {
      log.debug(ORTHO_DEBUG, 'domus_runner_failed', domusResult.stats);
    }
    return { success: false, domusResult };
  }

  // Create edge paths
  let edgePaths: Map<string, Point[]>;
  let portPlan: PortPlan | undefined;

  // iter-21 / R15 — when the caller is orchestrating the port-anchored
  // A1 flow externally (derivePortPlanFromShape → allocator →
  // createEdgePathsFromShapeAtPorts), short-circuit here so we don't
  // produce the pre-R15 centre-anchored polylines that the caller will
  // immediately throw away. Self-loops stay inside this entry point
  // (DOMUS input excludes them; the loop router is local here) so the
  // caller doesn't need to re-implement it.
  if (skipEdgePaths && useExistingPositions) {
    applySelfLoopRoutes();
    log.debug(ORTHO_DEBUG, 'DOMUS_RUN_RESULT', {
      success: true,
      pathsGenerated: 0,
      stats: domusResult.stats,
      skipEdgePaths: true,
    });
    return { success: true, domusResult };
  }

  if (useExistingPositions) {
    // Use existing node positions from LayoutData
    edgePaths = createEdgePathsFromShape(layout, domusResult);
    // iter-19 B — derive portPlan from walked polylines so C1 distribution
    // picks sides by shape label (paper-backed, DOMUS §3) instead of the
    // positional `|dx|>=|dy|` fallback in `assignPortsForEdge`.
    portPlan = derivePortPlanFromPaths(edgePaths, layout);
  } else {
    // Use DOMUS-computed coordinates
    // If nodeSizes were used, coordinates are already in pixel scale
    const usedNodeSizes = nodeSizes.size > 0;
    // IMPORTANT:
    // - `fullCoordinates` are on the *expanded* graph (e.g. `USCompany_core`, `USCompany_port_*`)
    //   and do NOT necessarily include the original high-degree vertex ids.
    // - `coordinates` are the *collapsed* coordinates and DO include the original ids.
    //
    // We need expanded coords to trace paths through the expanded graph, but we must use
    // collapsed coords to update `LayoutData.nodes[*].x/y` for original vertices.
    const coordsForRouting = domusResult.fullCoordinates ?? domusResult.coordinates!;
    const coordsForNodes =
      domusResult.coordinates ?? domusResult.fullCoordinates ?? coordsForRouting;

    // Grid y points up, pixel y points down (see `gridToPixelCoordinates`), so
    // the conversion reflects y. Reflect both maps about the SAME grid y — the
    // maximum over both — or the expanded routing frame and the collapsed node
    // frame end up translated relative to each other and every edge detaches
    // from its endpoints. Using the maximum also keeps the drawing in the
    // positive pixel range it occupied before the reflection.
    const yFlipReference = Math.max(
      0,
      ...[...coordsForRouting.values()].map((p) => p.y),
      ...[...coordsForNodes.values()].map((p) => p.y)
    );
    const pixelCoordsForRouting = gridToPixelCoordinates(
      coordsForRouting,
      usedNodeSizes ? 1 : gridSpacing,
      usedNodeSizes ? { x: 50, y: 50 } : baseOffset,
      yFlipReference
    );
    const pixelCoordsForNodes = gridToPixelCoordinates(
      coordsForNodes,
      usedNodeSizes ? 1 : gridSpacing,
      usedNodeSizes ? { x: 50, y: 50 } : baseOffset,
      yFlipReference
    );

    // Placement-only: update node positions but skip routing.
    if (placementOnly) {
      updateNodePositions(layout, pixelCoordsForNodes);
      // Log node positions after placement for debugging
      const placementResult: {
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
      }[] = [];
      for (const node of layout.nodes ?? []) {
        if (node?.id != null && !node.isGroup) {
          placementResult.push({
            id: String(node.id),
            x: node.x ?? 0,
            y: node.y ?? 0,
            width: node.width ?? 0,
            height: node.height ?? 0,
          });
        }
      }
      log.debug(ORTHO_DEBUG, 'DOMUS_PLACEMENT_RESULT', {
        nodeCount: placementResult.length,
        nodes: placementResult,
      });
      log.debug(ORTHO_DEBUG, 'DOMUS_RUN_RESULT', {
        success: true,
        pathsGenerated: 0,
        stats: domusResult.stats,
        placementOnly: true,
      });
      return {
        success: true,
        domusResult,
        edgePaths: new Map(),
      };
    }

    edgePaths = reconstructEdgePaths(domusResult, pixelCoordsForRouting, edges, nodeSizes);

    // Update node positions in layout if not using existing ones
    // Reference: (DOMUS, p.7, §3, Theorem 2 proof) - coordinate assignment
    updateNodePositions(layout, pixelCoordsForNodes);
  }

  // Apply paths to layout
  applyEdgePathsToLayout(layout, edgePaths);
  // DOMUS input intentionally excludes self-loops; route them with a dedicated loop router.
  applySelfLoopRoutes();

  log.debug(ORTHO_DEBUG, 'DOMUS_RUN_RESULT', {
    success: true,
    pathsGenerated: edgePaths.size,
    stats: domusResult.stats,
  });

  if (debug) {
    log.debug(ORTHO_DEBUG, 'domus_runner_success', {
      stats: domusResult.stats,
      pathsGenerated: edgePaths.size,
    });
  }

  return {
    success: true,
    domusResult,
    edgePaths,
    portPlan,
  };
}
