/**
 * Vertex Expansion for High-Degree Vertices
 *
 * In orthogonal drawings, each vertex can have at most 4 incident edges
 * (one in each direction: L, R, U, D). When a vertex has degree \> 4,
 * we "expand" it into a chain of vertices, each with degree \<= 4.
 *
 * Reference: (DOMUS, p.10, Figure 10)
 *
 * Post-SAT Expansion Strategy:
 * - A vertex v with degree d \> 4 is replaced by a "box" structure.
 * - Edges are grouped by their assigned SAT labels (L, R, D, U).
 * - For each direction with \>1 edge, a "port chain" is created.
 * - This allows multiple edges to exit from the same side of the virtual box.
 */

import type { DomusGraph, DirectedEdge, Shape, EdgeLabel, Point } from './types.js';
import { getVertexDegree } from './graphAnalysis.js';
import { log } from '../../../../logger.js';
import { ORTHO_DEBUG } from '../debug.js';

/**
 * Information about an expanded vertex.
 */
export interface ExpandedVertex {
  /** Original vertex ID that was expanded */
  originalVertexId: string;
  /** IDs of all vertices created for the expansion (core + ports) */
  chainVertexIds: string[];
  /** IDs of all internal edges created */
  chainEdgeIds: string[];
  /** Mapping from original neighbor to the port vertex it connects to */
  neighborToChainVertex: Map<string, string>;
}

/**
 * Result of vertex expansion.
 */
export interface ExpansionResult {
  /** The modified graph */
  graph: DomusGraph;
  /** Information about each expanded vertex */
  expansions: Map<string, ExpandedVertex>;
  /** Whether any expansion was performed */
  hasExpansions: boolean;
}

/**
 * Augment a node-size map so compaction can account for post-SAT expanded vertices.
 *
 * In the DOMUS box-expansion, the original high-degree vertex `vId` is removed and
 * replaced by `${vId}_core` plus `${vId}_port_*` vertices. For Mermaid, the rendered
 * box corresponds to the *original* vertex size, so we propagate that size onto the
 * `_core` vertex ID so metric compaction can maintain appropriate spacing.
 *
 * This is intentionally conservative: port/internal vertices are virtual (not rendered),
 * so we do not assign them box sizes.
 */
export function augmentNodeSizesForPostSatExpansion(
  nodeSizes: Map<string, { width: number; height: number }>,
  expansions: Map<string, ExpandedVertex>
): Map<string, { width: number; height: number }> {
  const out = new Map(nodeSizes);
  for (const [originalVertexId] of expansions) {
    const size = nodeSizes.get(originalVertexId);
    if (!size) {
      continue;
    }
    out.set(`${originalVertexId}_core`, { ...size });
  }
  return out;
}

/**
 * Find all vertices with degree \> 4.
 */
export function findHighDegreeVertices(graph: DomusGraph): string[] {
  const highDegree: string[] = [];

  for (const vertexId of graph.vertices) {
    if (!graph.originalVertices.has(vertexId)) {
      continue;
    }
    const degree = getVertexDegree(graph, vertexId);
    if (degree > 4) {
      highDegree.push(vertexId);
    }
  }

  return highDegree;
}

/**
 * Expand high-degree vertices AFTER a shape has been found.
 * This implements the "box expansion" from the paper (Section 6, Figure 10).
 *
 * @param graph - The graph to modify
 * @param shape - The current shape (labels for original edges)
 * @param debug - Debug flag
 * @returns Expansion result
 */
export function expandHighDegreeVerticesPostSat(
  graph: DomusGraph,
  shape: Shape,
  debug = false
): ExpansionResult {
  const expansions = new Map<string, ExpandedVertex>();
  const highDegreeVertices = findHighDegreeVertices(graph);

  if (debug && highDegreeVertices.length > 0) {
    log.debug(ORTHO_DEBUG, 'domus_vertex_expansion_post_sat', highDegreeVertices);
  }

  for (const vId of highDegreeVertices) {
    const expansion = expandVertexIntoBox(graph, shape, vId);
    expansions.set(vId, expansion);
  }

  return {
    graph,
    expansions,
    hasExpansions: expansions.size > 0,
  };
}

/**
 * Expand a single high-degree vertex into a "box" structure.
 */
function expandVertexIntoBox(graph: DomusGraph, shape: Shape, vId: string): ExpandedVertex {
  const neighbors = graph.adjacency.get(vId) ?? [];
  const byLabel = new Map<EdgeLabel, { neighbor: string; edgeId: string }[]>();

  for (const n of neighbors) {
    const label = shape.getLabel(vId, n.neighbor, n.edgeId);
    if (label) {
      if (!byLabel.has(label)) {
        byLabel.set(label, []);
      }
      byLabel.get(label)!.push(n);
    }
  }

  const coreId = `${vId}_core`;
  const chainVertexIds: string[] = [coreId];
  const chainEdgeIds: string[] = [];
  const neighborToChainVertex = new Map<string, string>();

  graph.vertices.add(coreId);
  graph.adjacency.set(coreId, []);

  for (const label of ['L', 'R', 'D', 'U'] as EdgeLabel[]) {
    const labelNeighbors = byLabel.get(label) ?? [];
    if (labelNeighbors.length === 0) {
      continue;
    }

    if (labelNeighbors.length === 1) {
      const { neighbor, edgeId } = labelNeighbors[0];
      neighborToChainVertex.set(neighbor, coreId);

      const edge = graph.edges.get(edgeId)!;
      if (edge.from === vId) {
        edge.from = coreId;
      } else {
        edge.to = coreId;
      }

      const nAdj = graph.adjacency.get(neighbor)!;
      const idx = nAdj.findIndex((a) => a.neighbor === vId);
      if (idx >= 0) {
        nAdj[idx].neighbor = coreId;
      }

      graph.adjacency.get(coreId)!.push({ neighbor, edgeId });
    } else {
      const orthogonalLabel: EdgeLabel = label === 'L' || label === 'R' ? 'D' : 'R';
      const portIds: string[] = [];

      for (const [i, { neighbor, edgeId }] of labelNeighbors.entries()) {
        const pId = `${vId}_port_${label}_${i}`;
        portIds.push(pId);
        chainVertexIds.push(pId);
        graph.vertices.add(pId);
        graph.adjacency.set(pId, []);

        neighborToChainVertex.set(neighbor, pId);

        const edge = graph.edges.get(edgeId)!;
        if (edge.from === vId) {
          edge.from = pId;
        } else {
          edge.to = pId;
        }

        const nAdj = graph.adjacency.get(neighbor)!;
        const idx = nAdj.findIndex((a) => a.neighbor === vId);
        if (idx >= 0) {
          nAdj[idx].neighbor = pId;
        }

        graph.adjacency.get(pId)!.push({ neighbor, edgeId });
      }

      for (let i = 0; i < portIds.length - 1; i++) {
        const eId = `${vId}_internal_${label}_${i}`;
        chainEdgeIds.push(eId);
        const internalEdge: DirectedEdge = {
          id: eId,
          from: portIds[i],
          to: portIds[i + 1],
          originalEdgeId: eId,
        };
        graph.edges.set(eId, internalEdge);
        shape.setLabel(eId, orthogonalLabel, portIds[i], portIds[i + 1]);

        graph.adjacency.get(portIds[i])!.push({ neighbor: portIds[i + 1], edgeId: eId });
        graph.adjacency.get(portIds[i + 1])!.push({ neighbor: portIds[i], edgeId: eId });
      }

      const midIdx = Math.floor(portIds.length / 2);
      const midPortId = portIds[midIdx];
      const connId = `${vId}_core_to_${label}`;
      chainEdgeIds.push(connId);
      const connEdge: DirectedEdge = {
        id: connId,
        from: coreId,
        to: midPortId,
        originalEdgeId: connId,
      };
      graph.edges.set(connId, connEdge);
      shape.setLabel(connId, label, coreId, midPortId);

      graph.adjacency.get(coreId)!.push({ neighbor: midPortId, edgeId: connId });
      graph.adjacency.get(midPortId)!.push({ neighbor: coreId, edgeId: connId });
    }
  }

  graph.vertices.delete(vId);
  graph.adjacency.delete(vId);

  return {
    originalVertexId: vId,
    chainVertexIds,
    chainEdgeIds,
    neighborToChainVertex,
  };
}

/**
 * Collapse expanded vertices back after DOMUS has computed coordinates.
 *
 * This mapping translates the coordinates of the expanded "box" structure
 * back to a single coordinate for the original high-degree vertex.
 *
 * We prefer the coordinate of the "core" vertex of the expansion, which
 * represents the topological center of the box.
 *
 * @param coordinates - Full coordinates for all vertices (including expansion chain)
 * @param expansions - Information about expanded vertices
 * @returns Coordinates with expansions collapsed back to original vertices
 */
export function collapseExpandedVertices(
  coordinates: Map<string, Point>,
  expansions: Map<string, ExpandedVertex>
): Map<string, Point> {
  const result = new Map(coordinates);

  for (const [originalVertexId, expansion] of expansions) {
    // Look for the "core" vertex position first as the primary center
    const coreId = `${originalVertexId}_core`;
    const coreCoord = coordinates.get(coreId);

    if (coreCoord) {
      result.set(originalVertexId, { ...coreCoord });
    } else {
      // Fallback: calculate centroid of all vertices in the expansion
      let sumX = 0;
      let sumY = 0;
      let count = 0;

      for (const chainVertexId of expansion.chainVertexIds) {
        const coord = coordinates.get(chainVertexId);
        if (coord) {
          sumX += coord.x;
          sumY += coord.y;
          count++;
        }
      }

      if (count > 0) {
        result.set(originalVertexId, {
          x: Math.round(sumX / count),
          y: Math.round(sumY / count),
        });
      }
    }

    // Clean up all chain vertices from the result map
    for (const chainVertexId of expansion.chainVertexIds) {
      result.delete(chainVertexId);
    }
  }

  return result;
}

/**
 * Pre-SAT expansion is no longer used.
 */
export function expandHighDegreeVertices(_graph: DomusGraph, _debug = false): ExpansionResult {
  return {
    graph: _graph,
    expansions: new Map(),
    hasExpansions: false,
  };
}
