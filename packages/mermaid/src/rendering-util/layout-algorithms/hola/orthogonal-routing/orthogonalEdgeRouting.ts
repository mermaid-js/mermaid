/**
 * Main orthogonal edge routing module
 */

import type { LayoutData, Edge } from '../../../types.js';
import { findAStarPath } from './Astar.js';
import { RoutingGrid } from './grid.js';
import { findOrthogonalPath } from './pathfinding.js';
import { DEFAULT_CROSSING_CURVE_CONFIG } from './crossingCurves.js';
import type { GridConfig, Point, EdgeContext, RoutedEdgeInfo } from './types.js';
import { handleSelfLoop } from './selfloop.js';
import { nudgePathsAwayFromSubgraphBoundaries } from './subgraphBoundaryNudge.js';

/**
 * Default grid configuration
 */
const DEFAULT_GRID_CONFIG: GridConfig = {
  cellSize: 8,
  nodeMargin: 0,
  nodeClearance: 10,
  subgraphBoundaryClearance: 15,
  crossingCurves: {
    ...DEFAULT_CROSSING_CURVE_CONFIG,
    enabled: true,
    curveType: 'arc',
    curveRadius: 12,
    offsetDistance: 8,
    minCrossingAngle: 45,
    priority: 'first-edge',
  },
};

/**
 * Route edges with orthogonal paths using two-pass approach
 * Pass 1: Simple patterns (Straight → L-shape → Z-shape)
 * Pass 2: A* with flexible connection points for failed edges
 *
 * @param layoutData - Layout data with positioned nodes and edges with connection points
 * @param config - Optional grid configuration
 * @returns Updated layout data with orthogonal edge paths
 */
export function orthogonalEdgeRouting(
  layoutData: LayoutData,
  logStep: (stepName: string) => void,
  config: GridConfig = DEFAULT_GRID_CONFIG
): LayoutData {
  const { nodes, edges } = layoutData;

  if (!nodes || nodes.length === 0) {
    return layoutData;
  }

  if (!edges || edges.length === 0) {
    return layoutData;
  }
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const grid = new RoutingGrid(nodes, config);

  const pairKey = (a?: string, b?: string): string | null => {
    if (!a || !b) {
      return null;
    }
    return a < b ? `${a}::${b}` : `${b}::${a}`;
  };
  const pairToEdges = new Map<string, Edge[]>();
  for (const e of edges) {
    const k = pairKey(e.start, e.end);
    if (!k) {
      continue;
    }
    if (!pairToEdges.has(k)) {
      pairToEdges.set(k, []);
    }
    pairToEdges.get(k)!.push(e);
  }
  const edgeIdToParallel = new Map<string, { index: number; count: number }>();
  for (const [_k, list] of pairToEdges.entries()) {
    if (list.length <= 1) {
      continue;
    }
    list.forEach((e, idx) => {
      edgeIdToParallel.set(e.id, { index: idx, count: list.length });
    });
  }

  const routedEdges: Edge[] = [];
  const failedEdges: Edge[] = [];
  const selfLoopEdges: Edge[] = [];
  const successfulEdges: RoutedEdgeInfo[] = [];

  // ========== PASS 1: Simple Patterns ==========
  for (const edge of edges) {
    const startNode = nodes.find((n) => n.id === edge.start);
    const endNode = nodes.find((n) => n.id === edge.end);
    if (!startNode || !endNode) {
      routedEdges.push(edge);
      continue;
    }

    edge.hasIntersectionPoints = true;

    if (edge.start === edge.end) {
      selfLoopEdges.push(edge);
      continue;
    }

    if (!edge.points || edge.points.length < 2) {
      failedEdges.push(edge);
      continue;
    }

    const startPoint: Point = edge.points[0];
    const endPoint: Point = edge.points[edge.points.length - 1];

    const edgeContext: EdgeContext | undefined =
      edge.start && edge.end
        ? {
            sourceNodeId: edge.start,
            targetNodeId: edge.end,
            parallelIndex: edgeIdToParallel.get(edge.id)?.index,
            parallelCount: edgeIdToParallel.get(edge.id)?.count,
          }
        : undefined;

    const pathResult = findOrthogonalPath(
      startPoint,
      endPoint,
      grid,
      10,
      edgeContext,
      layoutData,
      edge.startSide as any,
      edge.endSide as any
    );

    if (pathResult.valid && pathResult.points) {
      const routedEdge: Edge = {
        ...edge,
        points: pathResult.points,
      };
      routedEdges.push(routedEdge);

      grid.markPathOccupied(pathResult.points);

      const edgeInfo: RoutedEdgeInfo = {
        edgeId: edge.id,
        sourceNodeId: edge.start!,
        targetNodeId: edge.end!,
        points: pathResult.points,
        startPoint: pathResult.points[0],
        endPoint: pathResult.points[pathResult.points.length - 1],
      };
      successfulEdges.push(edgeInfo);
      edge.points = pathResult.points;
      grid.registerRoutedEdge(edgeInfo);
    } else {
      failedEdges.push(edge);
    }
  }
  logStep('Assigning edge points and simple orthogonal routing complete');
  // ========== PASS 2: A* for Failed Edges ==========
  for (const edge of failedEdges) {
    const startNode = nodes.find((n) => n.id === edge.start);
    const endNode = nodes.find((n) => n.id === edge.end);

    if (!startNode || !endNode) {
      routedEdges.push(edge);
      continue;
    }

    const edgeContext: EdgeContext = {
      sourceNodeId: edge.start!,
      targetNodeId: edge.end!,
      parallelIndex: edgeIdToParallel.get(edge.id)?.index,
      parallelCount: edgeIdToParallel.get(edge.id)?.count,
    };

    const astarResult = findAStarPath(
      startNode,
      endNode,
      grid,
      edgeContext,
      successfulEdges,
      {
        maxConnectionPointCombinations: 32,
        connectionPointSpacing: 8,
        endpointBufferDistance: 8,
        maxSearchIterations: 6000,
        bendPenalty: 1000,
        crossingPenalty: 1000,
      },
      edge.id
    );

    if (astarResult.valid && astarResult.points) {
      const routedEdge: Edge = {
        ...edge,
        points: astarResult.points,
      };
      routedEdges.push(routedEdge);

      grid.markPathOccupied(astarResult.points);

      const edgeInfo: RoutedEdgeInfo = {
        edgeId: edge.id,
        sourceNodeId: edge.start!,
        targetNodeId: edge.end!,
        points: astarResult.points,
        startPoint: astarResult.points[0],
        endPoint: astarResult.points[astarResult.points.length - 1],
      };
      successfulEdges.push(edgeInfo);
      edge.points = astarResult.points;
      grid.registerRoutedEdge(edgeInfo);
    } else {
      const fallbackPoints =
        edge.points && edge.points.length >= 2
          ? edge.points
          : [
              { x: startNode.x ?? 0, y: startNode.y ?? 0 },
              { x: endNode.x ?? 0, y: endNode.y ?? 0 },
            ];
      edge.points = fallbackPoints;
      routedEdges.push({
        ...edge,
        points: fallbackPoints,
      });
    }
  }

  logStep('A* Routing for Failed Edges Complete');

  for (const edge of selfLoopEdges) {
    const startNode = nodes.find((n) => n.id === edge.start);
    const endNode = nodes.find((n) => n.id === edge.end);
    if (!startNode || !endNode) {
      routedEdges.push(edge);
      continue;
    }
    if (edge.start === edge.end) {
      const selfLoopEdge = handleSelfLoop(edge, startNode, edges, nodeMap);
      const points = selfLoopEdge.points ?? [];
      const updatedEdge = { ...edge, points };

      const edgeIndex = edges.findIndex((e) => e.id === edge.id);
      if (edgeIndex !== -1) {
        edges[edgeIndex] = updatedEdge;
      }
      edge.points = points;
      routedEdges.push(selfLoopEdge);

      if (selfLoopEdge.points && selfLoopEdge.points.length >= 2) {
        const edgeInfo: RoutedEdgeInfo = {
          edgeId: edge.id,
          sourceNodeId: edge.start!,
          targetNodeId: edge.end!,
          points: selfLoopEdge.points,
          startPoint: selfLoopEdge.points[0],
          endPoint: selfLoopEdge.points[selfLoopEdge.points.length - 1],
        };
        successfulEdges.push(edgeInfo);
        grid.registerRoutedEdge(edgeInfo);
      }
      continue;
    }
  }

  const clearance = config.subgraphBoundaryClearance ?? 0;
  if (clearance > 0) {
    nudgePathsAwayFromSubgraphBoundaries(nodes, routedEdges, clearance);
  }

  for (const edge of routedEdges) {
    const currentStartNode = nodes.find((n) => n.id === edge.start);
    const currentEndNode = nodes.find((n) => n.id === edge.end);
    if (!currentStartNode || !currentEndNode) {
      continue;
    }
    if (currentStartNode.intersect && currentEndNode.intersect && edge.points) {
      const newStartPoint = currentStartNode.intersect(edge.points[0]);
      const newEndPoint = currentEndNode.intersect(edge.points[edge.points.length - 1]);
      if (newStartPoint) {
        edge.points[0] = newStartPoint;
      }
      if (newEndPoint) {
        edge.points[edge.points.length - 1] = newEndPoint;
      }
    }
  }
  return {
    ...layoutData,
    edges: routedEdges,
  };
}

/**
 * Export main function as default
 */
export default orthogonalEdgeRouting;
